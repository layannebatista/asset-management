import { Logger } from 'winston';
import { Pool } from 'pg';
import { Redis } from 'ioredis';

/**
 * Registro de performance de um modelo
 */
export interface ModelPerformanceRecord {
  model: string;
  analysisType: string;
  contextSize: number; // tokens
  qualityScore: number; // 0-1
  latencyMs: number;
  costUsd: number;
  timestamp: Date;
}

/**
 * Agregação de performance por modelo
 */
export interface ModelPerformanceStats {
  model: string;
  analysisType: string;
  totalExecutions: number;
  avgQuality: number;
  medianQuality: number;
  p95Quality: number;
  avgLatency: number;
  p99Latency: number;
  totalCost: number;
  avgCost: number;
  costEfficiency: number; // quality/cost ratio
  lastUpdated: Date;
}

/**
 * Recomendação de modelo com raciocínio
 */
export interface ModelRecommendation {
  model: string;
  score: number; // 0-1 (composite score)
  reasons: {
    qualityAdvantage: number;
    costAdvantage: number;
    latencyAdvantage: number;
  };
  alternative: string;
  shouldMigrateFrom?: string;
}

/**
 * ModelPerformanceStore: Aprende qual modelo é melhor para cada contexto
 *
 * Rastreia:
 * - Performance por modelo × tipo × contextSize
 * - Trajetória de qualidade
 * - Tendência de custo
 * - Períodos de degradação
 *
 * Usa para:
 * - Recomendação automática de modelo
 * - Detecção de regressão
 * - Otimização de custo vs qualidade
 * - A/B testing automático
 */
export class ModelPerformanceStore {
  private readonly pgPool: Pool;
  private readonly redis: Redis;
  private readonly logger: Logger;
  private readonly cacheTTL = 3600; // 1 hora

  constructor(pgPool: Pool, redis: Redis, logger: Logger) {
    this.pgPool = pgPool;
    this.redis = redis;
    this.logger = logger;
  }

  /**
   * Registrar execução de modelo
   */
  async recordExecution(record: ModelPerformanceRecord): Promise<void> {
    try {
      const client = await this.pgPool.connect();

      try {
        await client.query(
          `INSERT INTO model_performance_log
          (model, analysis_type, context_size, quality_score, latency_ms, cost_usd, timestamp)
          VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
          [
            record.model,
            record.analysisType,
            record.contextSize,
            record.qualityScore,
            record.latencyMs,
            record.costUsd,
          ],
        );

        // Invalidar cache de stats
        await this._invalidateStatsCache(record.model, record.analysisType);
      } finally {
        client.release();
      }

      this.logger.debug('Model execution recorded', {
        model: record.model,
        analysisType: record.analysisType,
        quality: record.qualityScore.toFixed(2),
        cost: record.costUsd.toFixed(4),
      });
    } catch (error) {
      this.logger.warn('Failed to record model execution', {
        error: error instanceof Error ? error.message : 'unknown',
      });
    }
  }

  /**
   * Obter estatísticas de performance para um modelo
   */
  async getModelStats(model: string, analysisType: string): Promise<ModelPerformanceStats | null> {
    const cacheKey = `model_stats:${model}:${analysisType}`;
    const cached = await this.redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const client = await this.pgPool.connect();

    try {
      const result = await client.query(
        `SELECT
          model,
          analysis_type,
          COUNT(*) as total_executions,
          AVG(quality_score)::float as avg_quality,
          PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY quality_score)::float as median_quality,
          PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY quality_score)::float as p95_quality,
          AVG(latency_ms)::float as avg_latency,
          PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY latency_ms)::float as p99_latency,
          SUM(cost_usd)::float as total_cost,
          AVG(cost_usd)::float as avg_cost
        FROM model_performance_log
        WHERE model = $1
        AND analysis_type = $2
        AND timestamp > NOW() - INTERVAL '30 days'
        GROUP BY model, analysis_type`,
        [model, analysisType],
      );

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      const stats: ModelPerformanceStats = {
        model: row.model,
        analysisType: row.analysis_type,
        totalExecutions: parseInt(row.total_executions),
        avgQuality: row.avg_quality,
        medianQuality: row.median_quality,
        p95Quality: row.p95_quality,
        avgLatency: row.avg_latency,
        p99Latency: row.p99_latency,
        totalCost: row.total_cost,
        avgCost: row.avg_cost,
        costEfficiency: row.avg_quality / (row.avg_cost || 0.001), // quality/cost
        lastUpdated: new Date(),
      };

      // Cache
      await this.redis.setex(cacheKey, this.cacheTTL, JSON.stringify(stats));

      return stats;
    } finally {
      client.release();
    }
  }

  /**
   * Comparar dois modelos
   */
  async compareModels(
    model1: string,
    model2: string,
    analysisType: string,
  ): Promise<{
    winner: string;
    score1: number;
    score2: number;
    qualityDelta: number;
    costDelta: number;
    latencyDelta: number;
  }> {
    const stats1 = await this.getModelStats(model1, analysisType);
    const stats2 = await this.getModelStats(model2, analysisType);

    if (!stats1 || !stats2) {
      return {
        winner: 'unknown',
        score1: stats1?.avgQuality || 0,
        score2: stats2?.avgQuality || 0,
        qualityDelta: 0,
        costDelta: 0,
        latencyDelta: 0,
      };
    }

    // Composite score: quality 60%, cost 25%, latency 15%
    const score1 = stats1.avgQuality * 0.6 + (1 - stats1.avgCost / 0.1) * 0.25 + (1 - stats1.avgLatency / 5000) * 0.15;

    const score2 = stats2.avgQuality * 0.6 + (1 - stats2.avgCost / 0.1) * 0.25 + (1 - stats2.avgLatency / 5000) * 0.15;

    return {
      winner: score1 > score2 ? model1 : model2,
      score1: Math.max(0, Math.min(1, score1)),
      score2: Math.max(0, Math.min(1, score2)),
      qualityDelta: stats1.avgQuality - stats2.avgQuality,
      costDelta: stats2.avgCost - stats1.avgCost, // positivo = model1 mais barato
      latencyDelta: stats2.avgLatency - stats1.avgLatency, // positivo = model1 mais rápido
    };
  }

  /**
   * Recomendar melhor modelo para contexto
   */
  async recommendBestModel(
    analysisType: string,
    contextSize: number,
    prioritize: 'quality' | 'cost' | 'speed' = 'quality',
  ): Promise<ModelRecommendation> {
    const client = await this.pgPool.connect();

    try {
      // Buscar histórico de modelos para este tipo
      const result = await client.query(
        `SELECT
          model,
          AVG(quality_score)::float as avg_quality,
          AVG(latency_ms)::float as avg_latency,
          AVG(cost_usd)::float as avg_cost,
          COUNT(*) as executions
        FROM model_performance_log
        WHERE analysis_type = $1
        AND timestamp > NOW() - INTERVAL '14 days'
        GROUP BY model
        HAVING COUNT(*) >= 3
        ORDER BY avg_quality DESC, avg_cost ASC`,
        [analysisType],
      );

      if (result.rows.length === 0) {
        return {
          model: 'gpt-4o',
          score: 0.5,
          reasons: {
            qualityAdvantage: 0,
            costAdvantage: 0,
            latencyAdvantage: 0,
          },
          alternative: 'gpt-4-turbo',
          shouldMigrateFrom: undefined,
        };
      }

      const models = result.rows;
      const baseline = models[0];

      // Calcular scores ponderados
      const weights =
        prioritize === 'quality' ? { q: 0.6, c: 0.2, l: 0.2 } : prioritize === 'cost' ? { q: 0.4, c: 0.5, l: 0.1 } : { q: 0.4, c: 0.2, l: 0.4 };

      let bestModel = models[0];
      let bestScore = 0;

      for (const model of models) {
        const qualityScore = model.avg_quality;
        const costScore = 1 - Math.min(1, model.avg_cost / 0.1); // Normalizar contra $0.10
        const latencyScore = 1 - Math.min(1, model.avg_latency / 5000); // Normalizar contra 5s

        const composite = qualityScore * weights.q + costScore * weights.c + latencyScore * weights.l;

        if (composite > bestScore) {
          bestScore = composite;
          bestModel = model;
        }
      }

      return {
        model: bestModel.model,
        score: Math.max(0, Math.min(1, bestScore)),
        reasons: {
          qualityAdvantage: bestModel.avg_quality - baseline.avg_quality,
          costAdvantage: baseline.avg_cost - bestModel.avg_cost,
          latencyAdvantage: baseline.avg_latency - bestModel.avg_latency,
        },
        alternative: models.length > 1 ? models[1].model : 'unknown',
        shouldMigrateFrom: models.some((m) => m.avg_quality < 0.6) ? models.filter((m) => m.avg_quality < 0.6)[0].model : undefined,
      };
    } finally {
      client.release();
    }
  }

  /**
   * Detectar regressão de performance (qualidade em queda)
   */
  async detectRegression(
    model: string,
    analysisType: string,
    windowDays: number = 7,
  ): Promise<{
    isRegression: boolean;
    qualityTrend: number; // delta por dia
    severity: 'critical' | 'high' | 'medium' | 'low' | 'none';
    recommendation: string;
  }> {
    const client = await this.pgPool.connect();

    try {
      // Comparar últimos 7 dias com período anterior
      const result = await client.query(
        `SELECT
          DATE(timestamp) as date,
          AVG(quality_score)::float as avg_quality,
          COUNT(*) as executions
        FROM model_performance_log
        WHERE model = $1
        AND analysis_type = $2
        AND timestamp > NOW() - INTERVAL '${windowDays * 2} days'
        GROUP BY DATE(timestamp)
        ORDER BY date DESC`,
        [model, analysisType],
      );

      if (result.rows.length < windowDays) {
        return {
          isRegression: false,
          qualityTrend: 0,
          severity: 'none',
          recommendation: 'insufficient data',
        };
      }

      const recent = result.rows.slice(0, windowDays);
      const previous = result.rows.slice(windowDays);

      const avgRecentQuality = recent.reduce((s, r) => s + r.avg_quality, 0) / recent.length;
      const avgPreviousQuality = previous.reduce((s, r) => s + r.avg_quality, 0) / previous.length;

      const delta = avgRecentQuality - avgPreviousQuality;
      const percentChange = (delta / avgPreviousQuality) * 100;

      let severity: 'critical' | 'high' | 'medium' | 'low' | 'none' = 'none';
      let recommendation = 'no action needed';

      if (percentChange < -10) {
        severity = 'critical';
        recommendation = `URGENT: ${model} quality dropped ${Math.abs(percentChange).toFixed(1)}% → switch models or investigate`;
      } else if (percentChange < -5) {
        severity = 'high';
        recommendation = `${model} quality declining → monitor closely`;
      } else if (percentChange < -2) {
        severity = 'medium';
        recommendation = `slight quality decline in ${model} → investigate`;
      } else if (percentChange < 0) {
        severity = 'low';
        recommendation = `minor fluctuation`;
      }

      return {
        isRegression: percentChange < -2,
        qualityTrend: delta / windowDays,
        severity,
        recommendation,
      };
    } finally {
      client.release();
    }
  }

  /**
   * Obter trend de custo por modelo
   */
  async getCostTrend(model: string, analysisType: string, days: number = 30): Promise<
    Array<{
      date: Date;
      avgCost: number;
      avgQuality: number;
      executions: number;
    }>
  > {
    const client = await this.pgPool.connect();

    try {
      const result = await client.query(
        `SELECT
          DATE(timestamp) as date,
          AVG(cost_usd)::float as avg_cost,
          AVG(quality_score)::float as avg_quality,
          COUNT(*) as executions
        FROM model_performance_log
        WHERE model = $1
        AND analysis_type = $2
        AND timestamp > NOW() - INTERVAL '${days} days'
        GROUP BY DATE(timestamp)
        ORDER BY date ASC`,
        [model, analysisType],
      );

      return result.rows.map((row) => ({
        date: new Date(row.date),
        avgCost: row.avg_cost,
        avgQuality: row.avg_quality,
        executions: parseInt(row.executions),
      }));
    } finally {
      client.release();
    }
  }

  /**
   * Ranquear modelos por tipo
   */
  async rankModelsByType(analysisType: string): Promise<
    Array<{
      model: string;
      quality: number;
      cost: number;
      latency: number;
      executions: number;
      rank: number;
    }>
  > {
    const client = await this.pgPool.connect();

    try {
      const result = await client.query(
        `SELECT
          model,
          AVG(quality_score)::float as quality,
          AVG(cost_usd)::float as cost,
          AVG(latency_ms)::float as latency,
          COUNT(*) as executions
        FROM model_performance_log
        WHERE analysis_type = $1
        AND timestamp > NOW() - INTERVAL '30 days'
        GROUP BY model
        HAVING COUNT(*) >= 2
        ORDER BY quality DESC, cost ASC`,
        [analysisType],
      );

      return result.rows.map((row, index) => ({
        model: row.model,
        quality: row.quality,
        cost: row.cost,
        latency: row.latency,
        executions: parseInt(row.executions),
        rank: index + 1,
      }));
    } finally {
      client.release();
    }
  }

  // ═══════════════════════════════════════════════════════════════════

  private async _invalidateStatsCache(model: string, analysisType: string): Promise<void> {
    const cacheKey = `model_stats:${model}:${analysisType}`;
    await this.redis.del(cacheKey);
  }
}
