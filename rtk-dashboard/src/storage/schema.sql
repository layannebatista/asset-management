-- AI Intelligence schema
-- Applied automatically on service startup

CREATE SCHEMA IF NOT EXISTS ai_intelligence;

CREATE TABLE IF NOT EXISTS ai_intelligence.analyses (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id   VARCHAR(36)  NOT NULL UNIQUE,
    type          VARCHAR(30)  NOT NULL,
    status        VARCHAR(20)  NOT NULL DEFAULT 'completed',
    model         VARCHAR(50),
    tokens_used   INTEGER,
    duration_ms   INTEGER,
    data          JSONB        NOT NULL,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analyses_type       ON ai_intelligence.analyses (type);
CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON ai_intelligence.analyses (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analyses_status     ON ai_intelligence.analyses (status);

-- Automatically purge analyses older than 30 days (keep the last 500 per type)
-- Run as a scheduled job or pg_cron task:
-- DELETE FROM ai_intelligence.analyses
--   WHERE created_at < NOW() - INTERVAL '30 days';
