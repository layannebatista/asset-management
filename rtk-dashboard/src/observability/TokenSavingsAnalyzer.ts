import { Pool } from 'pg';
import { Logger } from 'winston';

export interface TokenSavingsRecord {
  analysisId: string;
  analysisType: string;
  model: string;
  rawTokens: number;
  afterSddTokens: number;
  finalTokens: number;
  promptTokens: number;
  totalTokens: number;
  sddReductionPct: number;
  totalReductionPct: number;
  contextAccuracyPct: number;
  droppedChunksCount: number;
  timestamp: Date;
}

export interface TokenSavingsSummary {
  totalAnalyses: number;
  period: string;
  avgRawTokens: number;
  avgFinalTokens: number;
  avgSddReductionPct: number;
  avgTotalReductionPct: number;
  avgContextAccuracyPct: number;
  totalTokensSaved: number;
  byAnalysisType: Record<string, {
    count: number;
    avgReductionPct: number;
    totalSaved: number;
  }>;
  byModel: Record<string, {
    count: number;
    avgReductionPct: number;
    totalSaved: number;
  }>;
}

export class TokenSavingsAnalyzer {
  constructor(
    private readonly pgPool: Pool,
    private readonly logger: Logger,
  ) {}

  async initialize(): Promise<void> {
    const client = await this.pgPool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS token_savings_log (
          id SERIAL PRIMARY KEY,
          analysis_id UUID NOT NULL,
          analysis_type VARCHAR(50) NOT NULL,
          model VARCHAR(100) NOT NULL,
          raw_tokens INT NOT NULL,
          after_sdd_tokens INT NOT NULL,
          final_tokens INT NOT NULL,
          prompt_tokens INT NOT NULL,
          total_tokens INT NOT NULL,
          sdd_reduction_pct FLOAT NOT NULL,
          total_reduction_pct FLOAT NOT NULL,
          context_accuracy_pct FLOAT NOT NULL,
          dropped_chunks_count INT DEFAULT 0,
          timestamp TIMESTAMP DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_token_savings_analysis_id
          ON token_savings_log(analysis_id);
        CREATE INDEX IF NOT EXISTS idx_token_savings_timestamp
          ON token_savings_log(timestamp);
        CREATE INDEX IF NOT EXISTS idx_token_savings_type_timestamp
          ON token_savings_log(analysis_type, timestamp);
        CREATE INDEX IF NOT EXISTS idx_token_savings_model_timestamp
          ON token_savings_log(model, timestamp);
      `);
      this.logger.info('Token savings log table initialized');
    } catch (error) {
      if (error instanceof Error && error.message.includes('already exists')) {
        this.logger.debug('Token savings log table already exists');
      } else {
        this.logger.error('Failed to initialize token savings log', { error });
        throw error;
      }
    } finally {
      client.release();
    }
  }

  async recordTokenSavings(record: TokenSavingsRecord): Promise<void> {
    const client = await this.pgPool.connect();
    try {
      await client.query(
        `INSERT INTO token_savings_log (
          analysis_id, analysis_type, model, raw_tokens, after_sdd_tokens,
          final_tokens, prompt_tokens, total_tokens, sdd_reduction_pct,
          total_reduction_pct, context_accuracy_pct, dropped_chunks_count
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          record.analysisId,
          record.analysisType,
          record.model,
          record.rawTokens,
          record.afterSddTokens,
          record.finalTokens,
          record.promptTokens,
          record.totalTokens,
          record.sddReductionPct,
          record.totalReductionPct,
          record.contextAccuracyPct,
          record.droppedChunksCount,
        ],
      );

      this.logger.debug('Token savings recorded', {
        analysisId: record.analysisId,
        totalReductionPct: record.totalReductionPct.toFixed(1),
      });
    } catch (error) {
      this.logger.error('Failed to record token savings', { error });
    } finally {
      client.release();
    }
  }

  async getSummary(daysBack: number = 7): Promise<TokenSavingsSummary> {
    const client = await this.pgPool.connect();
    try {
      const result = await client.query(
        `SELECT
          COUNT(*) as total,
          AVG(raw_tokens)::float as avg_raw_tokens,
          AVG(final_tokens)::float as avg_final_tokens,
          AVG(sdd_reduction_pct)::float as avg_sdd_reduction_pct,
          AVG(total_reduction_pct)::float as avg_total_reduction_pct,
          AVG(context_accuracy_pct)::float as avg_context_accuracy_pct,
          SUM(raw_tokens - final_tokens)::int as total_saved
        FROM token_savings_log
        WHERE timestamp > NOW() - INTERVAL '${daysBack} days'`,
      );

      const summary = result.rows[0];

      // Get breakdown by analysis type
      const typeResult = await client.query(
        `SELECT
          analysis_type,
          COUNT(*) as count,
          AVG(total_reduction_pct)::float as avg_reduction_pct,
          SUM(raw_tokens - final_tokens)::int as total_saved
        FROM token_savings_log
        WHERE timestamp > NOW() - INTERVAL '${daysBack} days'
        GROUP BY analysis_type
        ORDER BY count DESC`,
      );

      const byAnalysisType: Record<string, any> = {};
      for (const row of typeResult.rows) {
        byAnalysisType[row.analysis_type] = {
          count: parseInt(row.count),
          avgReductionPct: Math.round(row.avg_reduction_pct * 100) / 100,
          totalSaved: row.total_saved || 0,
        };
      }

      // Get breakdown by model
      const modelResult = await client.query(
        `SELECT
          model,
          COUNT(*) as count,
          AVG(total_reduction_pct)::float as avg_reduction_pct,
          SUM(raw_tokens - final_tokens)::int as total_saved
        FROM token_savings_log
        WHERE timestamp > NOW() - INTERVAL '${daysBack} days'
        GROUP BY model
        ORDER BY count DESC`,
      );

      const byModel: Record<string, any> = {};
      for (const row of modelResult.rows) {
        byModel[row.model] = {
          count: parseInt(row.count),
          avgReductionPct: Math.round(row.avg_reduction_pct * 100) / 100,
          totalSaved: row.total_saved || 0,
        };
      }

      return {
        totalAnalyses: parseInt(summary.total),
        period: `${daysBack} days`,
        avgRawTokens: Math.round(summary.avg_raw_tokens || 0),
        avgFinalTokens: Math.round(summary.avg_final_tokens || 0),
        avgSddReductionPct: Math.round((summary.avg_sdd_reduction_pct || 0) * 100) / 100,
        avgTotalReductionPct: Math.round((summary.avg_total_reduction_pct || 0) * 100) / 100,
        avgContextAccuracyPct: Math.round((summary.avg_context_accuracy_pct || 0) * 100) / 100,
        totalTokensSaved: summary.total_saved || 0,
        byAnalysisType,
        byModel,
      };
    } finally {
      client.release();
    }
  }

  async getRecentAnalyses(limit: number = 50): Promise<TokenSavingsRecord[]> {
    const client = await this.pgPool.connect();
    try {
      const result = await client.query(
        `SELECT
          analysis_id,
          analysis_type,
          model,
          raw_tokens,
          after_sdd_tokens,
          final_tokens,
          prompt_tokens,
          total_tokens,
          sdd_reduction_pct,
          total_reduction_pct,
          context_accuracy_pct,
          dropped_chunks_count,
          timestamp
        FROM token_savings_log
        ORDER BY timestamp DESC
        LIMIT $1`,
        [limit],
      );

      return result.rows.map(row => ({
        analysisId: row.analysis_id,
        analysisType: row.analysis_type,
        model: row.model,
        rawTokens: row.raw_tokens,
        afterSddTokens: row.after_sdd_tokens,
        finalTokens: row.final_tokens,
        promptTokens: row.prompt_tokens,
        totalTokens: row.total_tokens,
        sddReductionPct: row.sdd_reduction_pct,
        totalReductionPct: row.total_reduction_pct,
        contextAccuracyPct: row.context_accuracy_pct,
        droppedChunksCount: row.dropped_chunks_count,
        timestamp: new Date(row.timestamp),
      }));
    } finally {
      client.release();
    }
  }

  async getAnalysisByType(
    analysisType: string,
    daysBack: number = 7,
  ): Promise<{
    analysisType: string;
    count: number;
    avgReductionPct: number;
    minReductionPct: number;
    maxReductionPct: number;
    totalSaved: number;
  }> {
    const client = await this.pgPool.connect();
    try {
      const result = await client.query(
        `SELECT
          analysis_type,
          COUNT(*) as count,
          AVG(total_reduction_pct)::float as avg_reduction_pct,
          MIN(total_reduction_pct)::float as min_reduction_pct,
          MAX(total_reduction_pct)::float as max_reduction_pct,
          SUM(raw_tokens - final_tokens)::int as total_saved
        FROM token_savings_log
        WHERE analysis_type = $1
        AND timestamp > NOW() - INTERVAL '${daysBack} days'
        GROUP BY analysis_type`,
        [analysisType],
      );

      if (result.rows.length === 0) {
        return {
          analysisType,
          count: 0,
          avgReductionPct: 0,
          minReductionPct: 0,
          maxReductionPct: 0,
          totalSaved: 0,
        };
      }

      const row = result.rows[0];
      return {
        analysisType: row.analysis_type,
        count: parseInt(row.count),
        avgReductionPct: Math.round((row.avg_reduction_pct || 0) * 100) / 100,
        minReductionPct: Math.round((row.min_reduction_pct || 0) * 100) / 100,
        maxReductionPct: Math.round((row.max_reduction_pct || 0) * 100) / 100,
        totalSaved: row.total_saved || 0,
      };
    } finally {
      client.release();
    }
  }
}
