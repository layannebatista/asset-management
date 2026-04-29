-- Autonomous Decision Engine Schema
-- Tables para validação, risco, multi-strategy, drift, auditoria

-- ============================================================================
-- 1. DECISION VALIDATION LOG
-- ============================================================================
CREATE TABLE IF NOT EXISTS decision_validations (
  id BIGSERIAL PRIMARY KEY,
  decision_id VARCHAR(100) NOT NULL UNIQUE,
  analysis_type VARCHAR(50) NOT NULL,
  is_valid BOOLEAN NOT NULL,
  validation_score FLOAT NOT NULL,
  violations JSONB,
  should_reexecute BOOLEAN DEFAULT FALSE,
  reexecution_strategy VARCHAR(50),
  timestamp TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_decision_validations_type ON decision_validations (analysis_type);
CREATE INDEX IF NOT EXISTS idx_decision_validations_valid ON decision_validations (is_valid);
CREATE INDEX IF NOT EXISTS idx_decision_validations_timestamp ON decision_validations (timestamp);

-- ============================================================================
-- 2. DECISION RISK ANALYSES
-- ============================================================================
CREATE TABLE IF NOT EXISTS decision_risk_analyses (
  id BIGSERIAL PRIMARY KEY,
  analysis_id VARCHAR(100) NOT NULL UNIQUE,
  risk_level VARCHAR(20) NOT NULL, -- low, medium, high, critical
  risk_score FLOAT NOT NULL,
  action_risks JSONB,
  required_approval BOOLEAN DEFAULT FALSE,
  approval_level VARCHAR(50), -- manager, director, executive
  analysis_details JSONB,
  timestamp TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_risk_analyses_level ON decision_risk_analyses (risk_level);
CREATE INDEX IF NOT EXISTS idx_risk_analyses_score ON decision_risk_analyses (risk_score);
CREATE INDEX IF NOT EXISTS idx_risk_analyses_timestamp ON decision_risk_analyses (timestamp);

-- ============================================================================
-- 3. STRATEGY COMPARISONS & EXECUTIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS strategy_comparisons (
  id BIGSERIAL PRIMARY KEY,
  analysis_type VARCHAR(50) NOT NULL,
  winner_strategy_id VARCHAR(100) NOT NULL,
  winner_strategy_name VARCHAR(255) NOT NULL,
  winner_quality FLOAT NOT NULL,
  winner_latency BIGINT NOT NULL,
  winner_cost FLOAT NOT NULL,
  all_results JSONB,
  timestamp TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_strategies_type ON strategy_comparisons (analysis_type);
CREATE INDEX IF NOT EXISTS idx_strategies_winner ON strategy_comparisons (winner_strategy_id);
CREATE INDEX IF NOT EXISTS idx_strategies_timestamp ON strategy_comparisons (timestamp);

CREATE TABLE IF NOT EXISTS strategy_executions (
  id BIGSERIAL PRIMARY KEY,
  analysis_type VARCHAR(50) NOT NULL,
  strategy_id VARCHAR(100) NOT NULL,
  strategy_name VARCHAR(255) NOT NULL,
  execution_time_ms BIGINT NOT NULL,
  quality_score FLOAT NOT NULL,
  latency_ms BIGINT NOT NULL,
  cost_usd FLOAT NOT NULL,
  composite_score FLOAT NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_executions_type ON strategy_executions (analysis_type);
CREATE INDEX IF NOT EXISTS idx_executions_strategy ON strategy_executions (strategy_id);
CREATE INDEX IF NOT EXISTS idx_executions_score ON strategy_executions (composite_score);
CREATE INDEX IF NOT EXISTS idx_executions_timestamp ON strategy_executions (timestamp);

-- ============================================================================
-- 4. DRIFT DETECTIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS drift_detections (
  id BIGSERIAL PRIMARY KEY,
  is_drifting BOOLEAN NOT NULL,
  drift_score FLOAT NOT NULL,
  indicators JSONB,
  affected_types TEXT[],
  root_causes TEXT[],
  requires_intervention BOOLEAN DEFAULT FALSE,
  intervention_level VARCHAR(50), -- logging, alert, investigate, emergency
  recommendations JSONB,
  timestamp TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_drift_drifting ON drift_detections (is_drifting);
CREATE INDEX IF NOT EXISTS idx_drift_score ON drift_detections (drift_score);
CREATE INDEX IF NOT EXISTS idx_drift_intervention ON drift_detections (intervention_level);
CREATE INDEX IF NOT EXISTS idx_drift_timestamp ON drift_detections (timestamp);

-- ============================================================================
-- 5. DECISION AUDIT LOG (Governance)
-- ============================================================================
CREATE TABLE IF NOT EXISTS decision_audit_log (
  id BIGSERIAL PRIMARY KEY,
  decision_id VARCHAR(100) NOT NULL UNIQUE,
  timestamp TIMESTAMP NOT NULL,
  analysis_type VARCHAR(50) NOT NULL,
  criticality VARCHAR(20) NOT NULL,
  user_id VARCHAR(100),
  model_used VARCHAR(100),
  prompt_version VARCHAR(50),
  context_size INTEGER,
  quality_score FLOAT,
  actions JSONB,
  risk_level VARCHAR(20),
  validation_result VARCHAR(50),
  executed BOOLEAN DEFAULT FALSE,
  execution_time TIMESTAMP,
  execution_status VARCHAR(50), -- success, failed, rolled_back
  execution_details TEXT,
  feedback_received BOOLEAN DEFAULT FALSE,
  feedback_at TIMESTAMP,
  feedback_type VARCHAR(50),
  feedback_details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_decision_id ON decision_audit_log (decision_id);
CREATE INDEX IF NOT EXISTS idx_audit_type ON decision_audit_log (analysis_type);
CREATE INDEX IF NOT EXISTS idx_audit_user ON decision_audit_log (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_executed ON decision_audit_log (executed);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON decision_audit_log (timestamp);

-- ============================================================================
-- 6. VALIDATION REEXECUTIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS validation_reexecutions (
  id BIGSERIAL PRIMARY KEY,
  original_decision_id VARCHAR(100) NOT NULL,
  failure_reason TEXT NOT NULL,
  reexecution_attempt INTEGER DEFAULT 1,
  strategy VARCHAR(100), -- different_model, expanded_context, alternative_prompt
  quality_improvement FLOAT,
  cost_delta FLOAT,
  success BOOLEAN DEFAULT FALSE,
  timestamp TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reexec_decision ON validation_reexecutions (original_decision_id);
CREATE INDEX IF NOT EXISTS idx_reexec_strategy ON validation_reexecutions (strategy);
CREATE INDEX IF NOT EXISTS idx_reexec_timestamp ON validation_reexecutions (timestamp);

-- ============================================================================
-- 7. AUTONOMOUS DECISION LOG
-- ============================================================================
CREATE TABLE IF NOT EXISTS autonomous_decision_log (
  id BIGSERIAL PRIMARY KEY,
  decision_id VARCHAR(100) NOT NULL UNIQUE,
  analysis_type VARCHAR(50) NOT NULL,
  criticality VARCHAR(20) NOT NULL,
  user_id VARCHAR(100),
  final_quality FLOAT NOT NULL,
  execution_recommended BOOLEAN NOT NULL,
  multi_strategy_winner VARCHAR(255),
  validation_score FLOAT,
  risk_level VARCHAR(20),
  drift_score FLOAT,
  required_approvals TEXT[],
  auto_executed BOOLEAN DEFAULT FALSE,
  approval_status VARCHAR(50), -- pending, approved, rejected
  timestamp TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_autonomous_type ON autonomous_decision_log (analysis_type);
CREATE INDEX IF NOT EXISTS idx_autonomous_exec ON autonomous_decision_log (execution_recommended);
CREATE INDEX IF NOT EXISTS idx_autonomous_auto ON autonomous_decision_log (auto_executed);
CREATE INDEX IF NOT EXISTS idx_autonomous_timestamp ON autonomous_decision_log (timestamp);

-- ============================================================================
-- 8. SYSTEM EVOLUTION LOG
-- ============================================================================
CREATE TABLE IF NOT EXISTS system_evolution_log (
  id BIGSERIAL PRIMARY KEY,
  decision_id VARCHAR(100),
  improvement_type VARCHAR(50), -- learning_feedback, model_update, prompt_optimization
  improvements_applied JSONB,
  quality_delta FLOAT,
  cost_delta FLOAT,
  model_weights_before JSONB,
  model_weights_after JSONB,
  timestamp TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_evolution_type ON system_evolution_log (improvement_type);
CREATE INDEX IF NOT EXISTS idx_evolution_decision ON system_evolution_log (decision_id);
CREATE INDEX IF NOT EXISTS idx_evolution_timestamp ON system_evolution_log (timestamp);

-- ============================================================================
-- ANALYTICAL VIEWS
-- ============================================================================

-- View: Autonomous Execution Metrics
CREATE OR REPLACE VIEW v_autonomous_metrics AS
SELECT
  DATE(timestamp) as execution_date,
  COUNT(*) as total_decisions,
  SUM(CASE WHEN execution_recommended THEN 1 ELSE 0 END)::FLOAT / COUNT(*) as auto_exec_rate,
  SUM(CASE WHEN auto_executed THEN 1 ELSE 0 END)::FLOAT / COUNT(*) as actual_auto_exec_rate,
  AVG(final_quality) as avg_quality,
  COUNT(DISTINCT CASE WHEN approval_status = 'approved' THEN decision_id END) as approved_decisions,
  COUNT(DISTINCT CASE WHEN approval_status = 'rejected' THEN decision_id END) as rejected_decisions
FROM autonomous_decision_log
GROUP BY DATE(timestamp);

-- View: Drift Trend
CREATE OR REPLACE VIEW v_drift_trend AS
SELECT
  DATE(timestamp) as drift_date,
  SUM(CASE WHEN is_drifting THEN 1 ELSE 0 END)::FLOAT / COUNT(*) as drift_rate,
  AVG(drift_score) as avg_drift_score,
  MAX(CASE WHEN intervention_level = 'emergency' THEN 1 ELSE 0 END) as has_emergency
FROM drift_detections
GROUP BY DATE(timestamp);

-- View: Risk Distribution
CREATE OR REPLACE VIEW v_risk_distribution AS
SELECT
  DATE(timestamp) as risk_date,
  risk_level,
  COUNT(*) as count,
  AVG(risk_score) as avg_score
FROM decision_risk_analyses
GROUP BY DATE(timestamp), risk_level;

-- View: Validation Success Rate
CREATE OR REPLACE VIEW v_validation_metrics AS
SELECT
  analysis_type,
  DATE(timestamp) as validation_date,
  COUNT(*) as total_validations,
  SUM(CASE WHEN is_valid THEN 1 ELSE 0 END)::FLOAT / COUNT(*) as validation_pass_rate,
  SUM(CASE WHEN should_reexecute THEN 1 ELSE 0 END)::FLOAT / COUNT(*) as reexecution_rate,
  AVG(validation_score) as avg_validation_score
FROM decision_validations
GROUP BY analysis_type, DATE(timestamp);

-- ============================================================================
-- GRANTS (if needed)
-- ============================================================================
-- GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO "assetmanagement";
