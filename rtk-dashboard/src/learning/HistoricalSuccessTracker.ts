import { Logger } from 'winston';
import { Redis } from 'ioredis';
import { Pool } from 'pg';
import { AnalysisType } from '../types/analysis.types';

export interface SuccessMetric {
  analysisId: string;
  analysisType: AnalysisType;
  query: string;
  qualityScore: number; // 0-1
  actionabilityScore: number; // 0-1
  consistencyScore: number; // 0-1
  overallScore: number; // 0-1
  tokensSaved: number;
  resolutionTime: number; // minutes to resolve issue
  userFeedback?: 'helpful' | 'neutral' | 'unhelpful';
  timestamp: Date;
}

/**
 * HistoricalSuccessTracker: Aprende com histórico de análises bem-sucedidas
 *
 * Rastreia:
 * - Qual tipo de análise tem melhor performance
 * - Quais queries geram bons resultados
 * - Qual é o padrão de sucesso para cada tipo
 *
 * Usado para:
 * - Boost de contexto baseado em histórico
 * - Ranking de chunks similares passados
 * - Predição de qualidade esperada
 */
export class HistoricalSuccessTracker {
  private readonly redis: Redis;
  private readonly pgPool: Pool;
  private readonly logger: Logger;
  private readonly cacheTTL = 24 * 60 * 60; // 1 dia
  private readonly minSamples = 10; // Mín. de exemplos para confiar em padrões

  constructor(redis: Redis, pgPool: Pool, logger: Logger) {
    this.redis = redis;
    this.pgPool = pgPool;
    this.logger = logger;
  }

  /**
   * Registrar sucesso de uma análise
   */
  async recordSuccess(metric: SuccessMetric): Promise<void> {
    try {
      const client = await this.pgPool.connect();

      try {
        // Armazenar em PostgreSQL (histórico permanente)
        await client.query(
          `INSERT INTO analysis_success_history
          (analysis_id, analysis_type, query, quality_score, actionability_score,
           consistency_score, overall_score, tokens_saved, resolution_time,
           user_feedback, timestamp)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            metric.analysisId,
            metric.analysisType,
            metric.query,
            metric.qualityScore,
            metric.actionabilityScore,
            metric.consistencyScore,
            metric.overallScore,
            metric.tokensSaved,
            metric.resolutionTime,
            metric.userFeedback || null,
            metric.timestamp,
          ],
        );

        // Invalidar caches relacionados
        await this._invalidateTypeCache(metric.analysisType);
      } finally {
        client.release();
      }

      this.logger.debug('Success metric recorded', {
        analysisType: metric.analysisType,
        overallScore: metric.overallScore.toFixed(2),
      });
    } catch (error) {
      this.logger.warn('Failed to record success metric', {
        error: error instanceof Error ? error.message : 'unknown',
      });
    }
  }

  /**
   * Obter estatísticas agregadas por tipo de análise
   */
  async getTypeStats(analysisType: AnalysisType): Promise<{
    avgQuality: number;
    avgActionability: number;
    avgConsistency: number;
    avgOverallScore: number;
    sampleCount: number;
    bestPerformingQueries: string[];
  } | null> {
    // ── Try cache first
    const cacheKey = `stats:${analysisType}`;
    const cached = await this.redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    // ── Query database
    const client = await this.pgPool.connect();

    try {
      const result = await client.query(
        `SELECT
          AVG(quality_score)::float as avg_quality,
          AVG(actionability_score)::float as avg_actionability,
          AVG(consistency_score)::float as avg_consistency,
          AVG(overall_score)::float as avg_overall,
          COUNT(*) as sample_count
        FROM analysis_success_history
        WHERE analysis_type = $1
        AND timestamp > NOW() - INTERVAL '30 days'`,
        [analysisType],
      );

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      const sampleCount = parseInt(row.sample_count);

      if (sampleCount < this.minSamples) {
        // Não confiar em padrão com poucas amostras
        return null;
      }

      // ── Get best queries
      const queryResult = await client.query(
        `SELECT query, AVG(overall_score) as avg_score
        FROM analysis_success_history
        WHERE analysis_type = $1
        AND timestamp > NOW() - INTERVAL '30 days'
        GROUP BY query
        ORDER BY avg_score DESC
        LIMIT 5`,
        [analysisType],
      );

      const bestQueries = queryResult.rows.map((r) => r.query);

      const stats = {
        avgQuality: parseFloat(row.avg_quality),
        avgActionability: parseFloat(row.avg_actionability),
        avgConsistency: parseFloat(row.avg_consistency),
        avgOverallScore: parseFloat(row.avg_overall),
        sampleCount,
        bestPerformingQueries: bestQueries,
      };

      // Cache por 1 dia
      await this.redis.setex(cacheKey, this.cacheTTL, JSON.stringify(stats));

      return stats;
    } finally {
      client.release();
    }
  }

  /**
   * Obter histórico de análises similares bem-sucedidas
   */
  async getSimilarSuccesses(
    analysisType: AnalysisType,
    queryKeywords: string[],
    limit: number = 5,
  ): Promise<SuccessMetric[]> {
    const client = await this.pgPool.connect();

    try {
      // Buscar por tipo + keywords na query
      let sqlQuery = `
        SELECT *
        FROM analysis_success_history
        WHERE analysis_type = $1
        AND timestamp > NOW() - INTERVAL '90 days'
        AND overall_score > 0.75
      `;

      const params: any[] = [analysisType];

      // Adicionar filtro de keywords se fornecidos
      if (queryKeywords.length > 0) {
        const keywordPattern = queryKeywords.join('|');
        sqlQuery += ` AND query ~* $${params.length + 1}`;
        params.push(keywordPattern);
      }

      sqlQuery += ` ORDER BY overall_score DESC, timestamp DESC LIMIT $${params.length + 1}`;
      params.push(limit);

      const result = await client.query(sqlQuery, params);

      return result.rows.map((row) => ({
        analysisId: row.analysis_id,
        analysisType: row.analysis_type,
        query: row.query,
        qualityScore: row.quality_score,
        actionabilityScore: row.actionability_score,
        consistencyScore: row.consistency_score,
        overallScore: row.overall_score,
        tokensSaved: row.tokens_saved,
        resolutionTime: row.resolution_time,
        userFeedback: row.user_feedback,
        timestamp: new Date(row.timestamp),
      }));
    } finally {
      client.release();
    }
  }

  /**
   * Calcular score esperado baseado em histórico
   */
  async predictQualityScore(
    analysisType: AnalysisType,
    contextSize: number,
  ): Promise<number> {
    const stats = await this.getTypeStats(analysisType);

    if (!stats) {
      return 0.75; // Default if no history
    }

    // Ajustar esperativa por tamanho de contexto
    // Contextos menores tendem a ter melhor score
    let adjustment = 0;

    if (contextSize < 500) {
      adjustment = 0.05; // +5% para contextos pequenos (menos ruído)
    } else if (contextSize > 5000) {
      adjustment = -0.1; // -10% para contextos grandes (mais complexo)
    }

    return Math.min(1.0, stats.avgOverallScore + adjustment);
  }

  /**
   * Listar tipos de análise por performance
   */
  async rankAnalysisTypesByPerformance(): Promise<
    Array<{
      type: AnalysisType;
      avgScore: number;
      sampleCount: number;
    }>
  > {
    const client = await this.pgPool.connect();

    try {
      const result = await client.query(`
        SELECT
          analysis_type,
          AVG(overall_score)::float as avg_score,
          COUNT(*) as sample_count
        FROM analysis_success_history
        WHERE timestamp > NOW() - INTERVAL '30 days'
        GROUP BY analysis_type
        HAVING COUNT(*) >= $1
        ORDER BY avg_score DESC`,
        [this.minSamples],
      );

      return result.rows.map((row) => ({
        type: row.analysis_type as AnalysisType,
        avgScore: row.avg_score,
        sampleCount: parseInt(row.sample_count),
      }));
    } finally {
      client.release();
    }
  }

  /**
   * Obter insights sobre qualidade por período
   */
  async getQualityTrend(analysisType: AnalysisType, days: number = 30): Promise<
    Array<{
      date: Date;
      avgScore: number;
      sampleCount: number;
    }>
  > {
    const client = await this.pgPool.connect();

    try {
      const result = await client.query(
        `SELECT
          DATE(timestamp) as date,
          AVG(overall_score)::float as avg_score,
          COUNT(*) as sample_count
        FROM analysis_success_history
        WHERE analysis_type = $1
        AND timestamp > NOW() - INTERVAL '${days} days'
        GROUP BY DATE(timestamp)
        ORDER BY date ASC`,
        [analysisType],
      );

      return result.rows.map((row) => ({
        date: new Date(row.date),
        avgScore: row.avg_score,
        sampleCount: parseInt(row.sample_count),
      }));
    } finally {
      client.release();
    }
  }

  // ════════════════════════════════════════════════════════════════
  // Private methods
  // ════════════════════════════════════════════════════════════════

  private async _invalidateTypeCache(analysisType: AnalysisType): Promise<void> {
    await this.redis.del(`stats:${analysisType}`);
  }
}
