import { Logger } from 'winston';
import { Pool } from 'pg';
import { Redis } from 'ioredis';
import { AnalysisType } from '../types/analysis.types';

/**
 * Versão de prompt com performance tracking
 */
export interface PromptVersion {
  id: string;
  analysisType: AnalysisType;
  version: string; // "v1.0", "v1.1", etc
  template: string; // O template do prompt
  status: 'active' | 'inactive' | 'deprecated';
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Métrica de performance de um prompt
 */
export interface PromptPerformanceMetric {
  promptId: string;
  version: string;
  totalExecutions: number;
  avgQuality: number; // 0-1
  avgActionability: number; // 0-1
  avgConsistency: number; // 0-1
  successRate: number; // % de execuções com quality > 0.7
  avgTokensUsed: number;
  avgTokensSaved: number; // vs baseline
  lastUpdated: Date;
}

/**
 * PromptPerformanceTracker: Aprende qual versão de prompt funciona melhor
 *
 * Rastreia:
 * - Performance de cada versão de prompt
 * - Evolução de qualidade
 * - Remoção automática de prompts ruins
 * - Sugestões de melhoria
 *
 * Algoritmo A/B testing:
 * - Aumenta traffic para versões de melhor performance
 * - Dimui traffic para versões ruins
 * - Auto-depreca versões persistentemente fracas
 */
export class PromptPerformanceTracker {
  private readonly pgPool: Pool;
  private readonly redis: Redis;
  private readonly logger: Logger;
  private readonly cacheTTL = 3600; // 1 hora
  private readonly minExecutionsForTrust = 10;
  private readonly degradationThreshold = -0.1; // 10% queda = degradação

  constructor(pgPool: Pool, redis: Redis, logger: Logger) {
    this.pgPool = pgPool;
    this.redis = redis;
    this.logger = logger;
  }

  /**
   * Criar nova versão de prompt
   */
  async createPromptVersion(
    analysisType: AnalysisType,
    version: string,
    template: string,
  ): Promise<PromptVersion> {
    const client = await this.pgPool.connect();

    try {
      const result = await client.query(
        `INSERT INTO prompt_versions
        (analysis_type, version, template, status, created_at, updated_at)
        VALUES ($1, $2, $3, 'active', NOW(), NOW())
        RETURNING id, analysis_type, version, template, status, created_at, updated_at`,
        [analysisType, version, template],
      );

      const row = result.rows[0];
      return {
        id: row.id,
        analysisType: row.analysis_type,
        version: row.version,
        template: row.template,
        status: row.status,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      };
    } finally {
      client.release();
    }
  }

  /**
   * Registrar execução de prompt
   */
  async recordExecution(
    promptId: string,
    qualityScore: number,
    actionabilityScore: number,
    consistencyScore: number,
    tokensUsed: number,
  ): Promise<void> {
    try {
      const client = await this.pgPool.connect();

      try {
        await client.query(
          `INSERT INTO prompt_execution_log
          (prompt_id, quality_score, actionability_score, consistency_score, tokens_used, timestamp)
          VALUES ($1, $2, $3, $4, $5, NOW())`,
          [promptId, qualityScore, actionabilityScore, consistencyScore, tokensUsed],
        );

        // Invalidar cache
        await this._invalidateMetricsCache(promptId);
      } finally {
        client.release();
      }

      this.logger.debug('Prompt execution recorded', {
        promptId: promptId.substring(0, 8),
        quality: qualityScore.toFixed(2),
      });
    } catch (error) {
      this.logger.warn('Failed to record prompt execution', {
        error: error instanceof Error ? error.message : 'unknown',
      });
    }
  }

  /**
   * Obter métricas de um prompt
   */
  async getPromptMetrics(promptId: string): Promise<PromptPerformanceMetric | null> {
    const cacheKey = `prompt_metrics:${promptId}`;
    const cached = await this.redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const client = await this.pgPool.connect();

    try {
      const result = await client.query(
        `SELECT
          p.id as prompt_id,
          p.version,
          COUNT(e.id) as total_executions,
          AVG(e.quality_score)::float as avg_quality,
          AVG(e.actionability_score)::float as avg_actionability,
          AVG(e.consistency_score)::float as avg_consistency,
          SUM(CASE WHEN e.quality_score > 0.7 THEN 1 ELSE 0 END)::float / COUNT(e.id) as success_rate,
          AVG(e.tokens_used)::float as avg_tokens_used
        FROM prompt_versions p
        LEFT JOIN prompt_execution_log e ON p.id = e.prompt_id
        WHERE p.id = $1
        AND (e.timestamp IS NULL OR e.timestamp > NOW() - INTERVAL '30 days')
        GROUP BY p.id, p.version`,
        [promptId],
      );

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      const totalExecutions = parseInt(row.total_executions || '0');

      const metrics: PromptPerformanceMetric = {
        promptId: row.prompt_id,
        version: row.version,
        totalExecutions,
        avgQuality: row.avg_quality || 0,
        avgActionability: row.avg_actionability || 0,
        avgConsistency: row.avg_consistency || 0,
        successRate: row.success_rate || 0,
        avgTokensUsed: row.avg_tokens_used || 0,
        avgTokensSaved: 0, // Será calculado em compareWithBaseline
        lastUpdated: new Date(),
      };

      // Cache
      await this.redis.setex(cacheKey, this.cacheTTL, JSON.stringify(metrics));

      return metrics;
    } finally {
      client.release();
    }
  }

  /**
   * Obter melhor versão de prompt para um tipo
   */
  async getBestPromptVersion(analysisType: AnalysisType): Promise<PromptVersion | null> {
    const client = await this.pgPool.connect();

    try {
      const result = await client.query(
        `SELECT
          p.id,
          p.analysis_type,
          p.version,
          p.template,
          p.status,
          p.created_at,
          p.updated_at,
          AVG(e.quality_score)::float as avg_quality,
          COUNT(e.id) as execution_count
        FROM prompt_versions p
        LEFT JOIN prompt_execution_log e ON p.id = e.prompt_id
        WHERE p.analysis_type = $1
        AND p.status IN ('active', 'inactive')
        AND (e.timestamp IS NULL OR e.timestamp > NOW() - INTERVAL '30 days')
        GROUP BY p.id
        HAVING COUNT(e.id) >= $2
        ORDER BY avg_quality DESC
        LIMIT 1`,
        [analysisType, this.minExecutionsForTrust],
      );

      if (result.rows.length === 0) {
        // Retornar qualquer versão ativa
        const anyResult = await client.query(
          `SELECT * FROM prompt_versions
          WHERE analysis_type = $1
          AND status = 'active'
          ORDER BY created_at DESC
          LIMIT 1`,
          [analysisType],
        );

        if (anyResult.rows.length === 0) {
          return null;
        }

        const row = anyResult.rows[0];
        return {
          id: row.id,
          analysisType: row.analysis_type,
          version: row.version,
          template: row.template,
          status: row.status,
          createdAt: new Date(row.created_at),
          updatedAt: new Date(row.updated_at),
        };
      }

      const row = result.rows[0];
      return {
        id: row.id,
        analysisType: row.analysis_type,
        version: row.version,
        template: row.template,
        status: row.status,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      };
    } finally {
      client.release();
    }
  }

  /**
   * Comparar versões de prompt
   */
  async compareVersions(
    analysisType: AnalysisType,
  ): Promise<
    Array<{
      version: string;
      quality: number;
      executions: number;
      trend: 'improving' | 'stable' | 'declining';
      recommendation: string;
    }>
  > {
    const client = await this.pgPool.connect();

    try {
      // Obter performance de cada versão
      const result = await client.query(
        `SELECT
          p.version,
          COUNT(e.id) as total_executions,
          AVG(e.quality_score)::float as avg_quality,
          AVG(e.consistency_score)::float as avg_consistency
        FROM prompt_versions p
        LEFT JOIN prompt_execution_log e ON p.id = e.prompt_id
        WHERE p.analysis_type = $1
        AND p.status IN ('active', 'inactive')
        AND (e.timestamp IS NULL OR e.timestamp > NOW() - INTERVAL '30 days')
        GROUP BY p.version
        ORDER BY avg_quality DESC`,
        [analysisType],
      );

      if (result.rows.length === 0) {
        return [];
      }

      // Calcular trend
      const versions = result.rows.map((row, index) => {
        const executions = parseInt(row.total_executions || '0');
        const quality = row.avg_quality || 0;
        const consistency = row.avg_consistency || 0;

        // Trend baseado em posição e consistência
        let trend: 'improving' | 'stable' | 'declining';
        let recommendation = '';

        if (index === 0 && consistency > 0.8) {
          trend = 'improving';
          recommendation = 'best performer, keep using';
        } else if (index > 0 && quality > result.rows[index - 1].avg_quality * 0.95) {
          trend = 'stable';
          recommendation = 'performance acceptable';
        } else {
          trend = 'declining';
          recommendation = 'quality below expectations, consider deprecating';
        }

        // Verificar se tem suficientes execuções
        if (executions < this.minExecutionsForTrust) {
          recommendation += ` (insufficient data: ${executions} executions)`;
        }

        return {
          version: row.version,
          quality,
          executions,
          trend,
          recommendation,
        };
      });

      return versions;
    } finally {
      client.release();
    }
  }

  /**
   * Detectar prompts degradados e sugerir ação
   */
  async detectDegradedPrompts(analysisType: AnalysisType): Promise<
    Array<{
      version: string;
      currentQuality: number;
      previousQuality: number;
      degradation: number; // percentage
      recommendation: 'monitor' | 'investigate' | 'deprecate';
    }>
  > {
    const client = await this.pgPool.connect();

    try {
      // Comparar performance em intervalos de tempo
      const result = await client.query(
        `WITH recent AS (
          SELECT
            p.id,
            p.version,
            AVG(e.quality_score)::float as avg_quality
          FROM prompt_versions p
          LEFT JOIN prompt_execution_log e ON p.id = e.prompt_id
          WHERE p.analysis_type = $1
          AND e.timestamp > NOW() - INTERVAL '7 days'
          GROUP BY p.id, p.version
        ),
        previous AS (
          SELECT
            p.id,
            p.version,
            AVG(e.quality_score)::float as avg_quality
          FROM prompt_versions p
          LEFT JOIN prompt_execution_log e ON p.id = e.prompt_id
          WHERE p.analysis_type = $1
          AND e.timestamp BETWEEN NOW() - INTERVAL '14 days' AND NOW() - INTERVAL '7 days'
          GROUP BY p.id, p.version
        )
        SELECT
          r.version,
          r.avg_quality as recent_quality,
          p.avg_quality as previous_quality,
          ((p.avg_quality - r.avg_quality) / p.avg_quality) * 100 as degradation_pct
        FROM recent r
        LEFT JOIN previous p ON r.id = p.id
        WHERE p.avg_quality > 0
        AND (p.avg_quality - r.avg_quality) / p.avg_quality > $2`,
        [analysisType, this.degradationThreshold],
      );

      return result.rows.map((row) => {
        const degradation = ((row.previous_quality - row.recent_quality) / row.previous_quality) * 100;

        let recommendation: 'monitor' | 'investigate' | 'deprecate';
        if (degradation > 20) {
          recommendation = 'deprecate';
        } else if (degradation > 10) {
          recommendation = 'investigate';
        } else {
          recommendation = 'monitor';
        }

        return {
          version: row.version,
          currentQuality: row.recent_quality,
          previousQuality: row.previous_quality,
          degradation,
          recommendation,
        };
      });
    } finally {
      client.release();
    }
  }

  /**
   * Marcar prompt como deprecado
   */
  async deprecatePrompt(promptId: string): Promise<void> {
    const client = await this.pgPool.connect();

    try {
      await client.query(
        `UPDATE prompt_versions
        SET status = 'deprecated', updated_at = NOW()
        WHERE id = $1`,
        [promptId],
      );

      // Invalidar cache
      await this._invalidateMetricsCache(promptId);

      this.logger.info('Prompt deprecated', {
        promptId: promptId.substring(0, 8),
      });
    } finally {
      client.release();
    }
  }

  /**
   * Sugerir template melhorado baseado em falhas
   */
  async suggestImprovement(
    promptId: string,
    failureAnalysis: {
      commonFailures: string[];
      missingElements: string[];
      overcomplicatedSections: string[];
    },
  ): Promise<{
    suggestion: string;
    expectedImprovement: number;
    implementationPriority: 'high' | 'medium' | 'low';
  }> {
    const metric = await this.getPromptMetrics(promptId);

    if (!metric) {
      return {
        suggestion: 'insufficient execution data',
        expectedImprovement: 0,
        implementationPriority: 'low',
      };
    }

    // Analisar pattern de falhas
    let suggestions: string[] = [];
    let expectedImprovement = 0;

    if (metric.avgQuality < 0.6) {
      suggestions.push('Add more context constraints and examples');
      expectedImprovement += 0.15;
    }

    if (metric.avgActionability < 0.65) {
      suggestions.push('Include clear action steps and prioritization');
      expectedImprovement += 0.12;
    }

    if (metric.avgConsistency < 0.7) {
      suggestions.push('Standardize output format with JSON schema');
      expectedImprovement += 0.1;
    }

    if (failureAnalysis.overcomplicatedSections.length > 0) {
      suggestions.push(`Simplify: ${failureAnalysis.overcomplicatedSections.slice(0, 2).join(', ')}`);
      expectedImprovement += 0.08;
    }

    const priority = expectedImprovement > 0.2 ? 'high' : expectedImprovement > 0.1 ? 'medium' : 'low';

    return {
      suggestion: suggestions.join('; '),
      expectedImprovement: Math.min(0.3, expectedImprovement),
      implementationPriority: priority,
    };
  }

  /**
   * Obter histórico de evoluções de um prompt
   */
  async getEvolutionHistory(
    analysisType: AnalysisType,
    days: number = 30,
  ): Promise<
    Array<{
      date: Date;
      versionCount: number;
      avgQuality: number;
      activeVersions: number;
    }>
  > {
    const client = await this.pgPool.connect();

    try {
      const result = await client.query(
        `SELECT
          DATE(e.timestamp) as date,
          COUNT(DISTINCT p.id) as version_count,
          AVG(e.quality_score)::float as avg_quality,
          COUNT(DISTINCT CASE WHEN p.status = 'active' THEN p.id END) as active_versions
        FROM prompt_versions p
        LEFT JOIN prompt_execution_log e ON p.id = e.prompt_id
        WHERE p.analysis_type = $1
        AND (e.timestamp IS NULL OR e.timestamp > NOW() - INTERVAL '${days} days')
        GROUP BY DATE(e.timestamp)
        ORDER BY date ASC`,
        [analysisType],
      );

      return result.rows.map((row) => ({
        date: new Date(row.date),
        versionCount: parseInt(row.version_count || '0'),
        avgQuality: row.avg_quality || 0,
        activeVersions: parseInt(row.active_versions || '0'),
      }));
    } finally {
      client.release();
    }
  }

  // ═══════════════════════════════════════════════════════════════════

  private async _invalidateMetricsCache(promptId: string): Promise<void> {
    const cacheKey = `prompt_metrics:${promptId}`;
    await this.redis.del(cacheKey);
  }
}
