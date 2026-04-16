import { Pool, PoolConfig } from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';
import { config } from '../config';
import { logger } from '../api/logger';
import { AnalysisResult, AnalysisType } from '../types/analysis.types';

/**
 * Persists analysis results in the ai_intelligence PostgreSQL schema.
 * Uses connection pooling – one shared Pool per service instance.
 */
export class AnalysisRepository {
  private readonly pool: Pool;

  constructor() {
    const poolConfig: PoolConfig = {
      host: config.db.host,
      port: config.db.port,
      database: config.db.database,
      user: config.db.user,
      password: config.db.password,
      max: 5,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    };
    this.pool = new Pool(poolConfig);

    this.pool.on('error', (err) => {
      logger.error('PostgreSQL pool error', { error: err.message });
    });
  }

  async initialize(): Promise<void> {
    const schemaPath = join(__dirname, 'schema.sql');
    const sql = readFileSync(schemaPath, 'utf-8');

    try {
      await this.pool.query(sql);
      logger.info('AI intelligence schema initialized');
    } catch (error) {
      logger.error('Failed to initialize schema', { error });
      throw error;
    }
  }

  async save(result: AnalysisResult): Promise<void> {
    const { metadata } = result;

    try {
      await this.pool.query(
        `INSERT INTO ai_intelligence.analyses
           (analysis_id, type, status, model, tokens_used, duration_ms, data, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (analysis_id) DO UPDATE
           SET status = EXCLUDED.status,
               data   = EXCLUDED.data`,
        [
          metadata.analysisId,
          metadata.type,
          metadata.status,
          metadata.model,
          metadata.tokensUsed ?? null,
          metadata.durationMs,
          JSON.stringify(result),
          metadata.createdAt,
        ],
      );
    } catch (error) {
      // Persistence failure must not crash the analysis – log and continue
      logger.error('Failed to persist analysis result', { analysisId: metadata.analysisId, error });
    }
  }

  async findById(analysisId: string): Promise<AnalysisResult | null> {
    const result = await this.pool.query<{ data: AnalysisResult }>(
      'SELECT data FROM ai_intelligence.analyses WHERE analysis_id = $1',
      [analysisId],
    );
    return result.rows[0]?.data ?? null;
  }

  async findRecent(type?: AnalysisType, limit = 20): Promise<AnalysisResult[]> {
    const query = type
      ? 'SELECT data FROM ai_intelligence.analyses WHERE type = $1 ORDER BY created_at DESC LIMIT $2'
      : 'SELECT data FROM ai_intelligence.analyses ORDER BY created_at DESC LIMIT $1';

    const params = type ? [type, limit] : [limit];
    const result = await this.pool.query<{ data: AnalysisResult }>(query, params);
    return result.rows.map((r) => r.data);
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}
