"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalysisRepository = void 0;
const pg_1 = require("pg");
const fs_1 = require("fs");
const path_1 = require("path");
const config_1 = require("../config");
const logger_1 = require("../api/logger");
/**
 * Persists analysis results in the ai_intelligence PostgreSQL schema.
 * Uses connection pooling – one shared Pool per service instance.
 */
class AnalysisRepository {
    pool;
    constructor() {
        const poolConfig = {
            host: config_1.config.db.host,
            port: config_1.config.db.port,
            database: config_1.config.db.database,
            user: config_1.config.db.user,
            password: config_1.config.db.password,
            max: 5,
            idleTimeoutMillis: 30_000,
            connectionTimeoutMillis: 5_000,
        };
        this.pool = new pg_1.Pool(poolConfig);
        this.pool.on('error', (err) => {
            logger_1.logger.error('PostgreSQL pool error', { error: err.message });
        });
    }
    async initialize() {
        const schemaPath = (0, path_1.join)(__dirname, 'schema.sql');
        const sql = (0, fs_1.readFileSync)(schemaPath, 'utf-8');
        try {
            await this.pool.query(sql);
            logger_1.logger.info('AI intelligence schema initialized');
        }
        catch (error) {
            logger_1.logger.error('Failed to initialize schema', { error });
            throw error;
        }
    }
    async save(result) {
        const { metadata } = result;
        try {
            await this.pool.query(`INSERT INTO ai_intelligence.analyses
           (analysis_id, type, status, model, tokens_used, duration_ms, data, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (analysis_id) DO UPDATE
           SET status = EXCLUDED.status,
               data   = EXCLUDED.data`, [
                metadata.analysisId,
                metadata.type,
                metadata.status,
                metadata.model,
                metadata.tokensUsed ?? null,
                metadata.durationMs,
                JSON.stringify(result),
                metadata.createdAt,
            ]);
        }
        catch (error) {
            // Persistence failure must not crash the analysis – log and continue
            logger_1.logger.error('Failed to persist analysis result', { analysisId: metadata.analysisId, error });
        }
    }
    async findById(analysisId) {
        const result = await this.pool.query('SELECT data FROM ai_intelligence.analyses WHERE analysis_id = $1', [analysisId]);
        return result.rows[0]?.data ?? null;
    }
    async findRecent(type, limit = 20) {
        const query = type
            ? 'SELECT data FROM ai_intelligence.analyses WHERE type = $1 ORDER BY created_at DESC LIMIT $2'
            : 'SELECT data FROM ai_intelligence.analyses ORDER BY created_at DESC LIMIT $1';
        const params = type ? [type, limit] : [limit];
        const result = await this.pool.query(query, params);
        return result.rows.map((r) => r.data);
    }
    async close() {
        await this.pool.end();
    }
}
exports.AnalysisRepository = AnalysisRepository;
//# sourceMappingURL=AnalysisRepository.js.map