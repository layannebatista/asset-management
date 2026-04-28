import { Pool } from 'pg';
import { Logger } from 'winston';
import { ICollector, CollectionResult } from './ICollector';
import { PostgreSQLData } from '../types/report.types';

/**
 * PostgreSQLCollector: Coleta dados do banco de dados ai-intelligence
 * - Métricas de análises
 * - Histórico de sucesso
 * - Decisões autônomas
 * - Tokens economizados
 */
export class PostgreSQLCollector implements ICollector {
  private readonly pool: Pool;
  private readonly logger: Logger;

  constructor(pool: Pool, logger: Logger) {
    this.pool = pool;
    this.logger = logger;
  }

  async collect(startDate: Date, endDate: Date): Promise<CollectionResult> {
    const start = Date.now();

    try {
      const client = await this.pool.connect();

      try {
        const aiMetrics = await this.getAIMetrics(client, startDate, endDate);
        const analysisHistory = await this.getAnalysisHistory(client, startDate, endDate);
        const decisions = await this.getAutonomousDecisions(client, startDate, endDate);
        const tokenSavings = await this.getTokenSavings(client, startDate, endDate);
        const analysesSummary = await this.getAnalysesSummary(client, startDate, endDate);

        const postgresData: PostgreSQLData = {
          aiMetrics,
          analysisHistory,
          decisions,
        };

        this.logger.info('PostgreSQL collected data', {
          analyses: analysisHistory.length,
          decisions: decisions.length,
          tokenSaved: tokenSavings.totalTokensSaved,
        });

        return {
          source: 'PostgreSQL',
          success: true,
          data: {
            ...postgresData,
            tokenSavings,
            analysesSummary,
          },
          itemsCollected: analysisHistory.length + decisions.length,
          duration: Date.now() - start,
        };
      } finally {
        client.release();
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('PostgreSQLCollector error', { error: errorMsg });
      return {
        source: 'PostgreSQL',
        success: false,
        error: errorMsg,
        itemsCollected: 0,
        duration: Date.now() - start,
      };
    }
  }

  getName(): string {
    return 'PostgreSQLCollector';
  }

  async validate(): Promise<boolean> {
    try {
      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();
      return true;
    } catch {
      return false;
    }
  }

  // ─── Private Methods ──────────────────────────────────────────────────────

  private async getAIMetrics(client: any, startDate: Date, endDate: Date): Promise<any[]> {
    try {
      const result = await client.query(
        `SELECT
          model,
          COUNT(*) as count,
          AVG(quality_score) as avg_quality,
          AVG(latency_ms) as avg_latency
        FROM model_performance_log
        WHERE timestamp BETWEEN $1 AND $2
        GROUP BY model`,
        [startDate, endDate],
      );
      return result.rows;
    } catch (error) {
      this.logger.debug('Error getting AI metrics - table may not exist');
      return [];
    }
  }

  private async getAnalysisHistory(client: any, startDate: Date, endDate: Date): Promise<any[]> {
    try {
      const result = await client.query(
        `SELECT
          analysis_type,
          COUNT(*) as count,
          AVG(quality_score) as avg_quality,
          AVG(actionability_score) as avg_actionability,
          AVG(consistency_score) as avg_consistency,
          AVG(overall_score) as avg_overall,
          COUNT(CASE WHEN user_feedback = 'helpful' THEN 1 END) as helpful_count
        FROM analysis_success_history
        WHERE timestamp BETWEEN $1 AND $2
        GROUP BY analysis_type`,
        [startDate, endDate],
      );
      return result.rows;
    } catch (error) {
      this.logger.debug('Error getting analysis history - table may not exist');
      return [];
    }
  }

  private async getAutonomousDecisions(client: any, startDate: Date, endDate: Date): Promise<any[]> {
    try {
      const result = await client.query(
        `SELECT
          COUNT(*) as total_decisions,
          COUNT(CASE WHEN success = true THEN 1 END) as successful,
          AVG(risk_score) as avg_risk,
          AVG(confidence) as avg_confidence
        FROM autonomous_decisions
        WHERE timestamp BETWEEN $1 AND $2`,
        [startDate, endDate],
      );
      return result.rows;
    } catch (error) {
      this.logger.debug('Error getting autonomous decisions - table may not exist');
      return [];
    }
  }

  private async getTokenSavings(client: any, startDate: Date, endDate: Date): Promise<any> {
    try {
      const result = await client.query(
        `SELECT
          COUNT(*) as count,
          SUM(raw_tokens - final_tokens) as total_tokens_saved,
          AVG(total_reduction_pct) as avg_reduction_pct
        FROM token_savings_log
        WHERE timestamp BETWEEN $1 AND $2`,
        [startDate, endDate],
      );

      if (result.rows.length === 0) {
        return { totalTokensSaved: 0, avgReductionPct: 0 };
      }

      return {
        totalTokensSaved: result.rows[0].total_tokens_saved || 0,
        avgReductionPct: result.rows[0].avg_reduction_pct || 0,
        count: result.rows[0].count || 0,
      };
    } catch (error) {
      this.logger.debug('Error getting token savings');
      return { totalTokensSaved: 0 };
    }
  }

  private async getAnalysesSummary(client: any, startDate: Date, endDate: Date): Promise<any> {
    try {
      const result = await client.query(
        `SELECT
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'success' THEN 1 END) as successful,
          AVG(COALESCE(tokens_used, 0)) as avg_tokens_used,
          COUNT(CASE WHEN model IS NOT NULL AND model <> '' THEN 1 END) as with_model
        FROM ai_intelligence.analyses
        WHERE created_at BETWEEN $1 AND $2`,
        [startDate, endDate],
      );

      if (result.rows.length === 0) {
        return { total: 0, successful: 0, avgTokensUsed: 0, withModel: 0 };
      }

      return {
        total: parseInt(result.rows[0].total || '0', 10),
        successful: parseInt(result.rows[0].successful || '0', 10),
        avgTokensUsed: Number(result.rows[0].avg_tokens_used || 0),
        withModel: parseInt(result.rows[0].with_model || '0', 10),
      };
    } catch (error) {
      this.logger.debug('Error getting analyses summary from ai_intelligence.analyses');
      return { total: 0, successful: 0, avgTokensUsed: 0, withModel: 0 };
    }
  }
}
