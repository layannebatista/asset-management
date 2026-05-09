-- V010__Create_Production_Safety_Tables.sql
-- Creates all tables for the 10-component production safety layer

-- ═══════════════════════════════════════════════════════════════════
-- 1. AUTONOMY POLICY ENGINE
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS autonomy_policies (
  id BIGSERIAL PRIMARY KEY,
  policy_name VARCHAR(255) NOT NULL,
  analysis_type VARCHAR(100) NOT NULL,
  criticality VARCHAR(50) NOT NULL,
  context VARCHAR(50) NOT NULL,  -- DEV, STAGING, PRODUCTION
  autonomy_level VARCHAR(50) NOT NULL,  -- MANUAL, SEMI_AUTONOMOUS, FULL_AUTONOMOUS

  -- Limites
  max_executions_per_hour INTEGER DEFAULT 100,
  max_cost_per_hour DECIMAL(10, 2) DEFAULT 1000,
  max_reexecutions_per_decision INTEGER DEFAULT 3,

  -- Flags
  requires_human_approval BOOLEAN DEFAULT false,
  can_override_errors BOOLEAN DEFAULT false,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by VARCHAR(255),

  UNIQUE(analysis_type, criticality, context)
);

CREATE INDEX idx_autonomy_policies_type_crit ON autonomy_policies(analysis_type, criticality);
CREATE INDEX idx_autonomy_policies_context ON autonomy_policies(context);

-- ═══════════════════════════════════════════════════════════════════
-- 2. BLAST RADIUS ANALYZER
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS blast_radius_assessments (
  id BIGSERIAL PRIMARY KEY,
  assessment_id VARCHAR(100) UNIQUE NOT NULL,
  action_description TEXT NOT NULL,
  affected_services TEXT[],  -- JSON array of service names

  -- Assessment results
  severity VARCHAR(50) NOT NULL,  -- NEGLIGIBLE, LOW, MEDIUM, HIGH, CRITICAL
  reversibility_score DECIMAL(3, 2),  -- 0.0 - 1.0
  estimated_rollback_time_minutes INTEGER,
  estimated_affected_users INTEGER,

  -- Risk detection
  has_data_loss_risk BOOLEAN DEFAULT false,
  has_compliance_risk BOOLEAN DEFAULT false,
  has_security_risk BOOLEAN DEFAULT false,

  -- Recommendations
  suggested_alternatives TEXT,
  suggested_wait_time_minutes INTEGER,

  created_at TIMESTAMP DEFAULT NOW(),
  assessment_data JSONB
);

CREATE INDEX idx_blast_radius_severity ON blast_radius_assessments(severity);
CREATE INDEX idx_blast_radius_created_at ON blast_radius_assessments(created_at DESC);

-- ═══════════════════════════════════════════════════════════════════
-- 3. SAFE EXECUTION LAYER
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS execution_attempts (
  id BIGSERIAL PRIMARY KEY,
  attempt_id VARCHAR(100) UNIQUE NOT NULL,
  decision_id VARCHAR(100) NOT NULL,
  action_description TEXT NOT NULL,

  -- Execution stages
  simulation_status VARCHAR(50),    -- completed, failed
  validation_status VARCHAR(50),    -- passed, failed
  security_check_status VARCHAR(50), -- passed, failed
  execution_status VARCHAR(50),     -- success, failed, timeout

  -- Results
  final_output JSONB,
  execution_time_ms INTEGER,

  -- Errors
  errors TEXT[],

  -- Rollback
  rollback_executed BOOLEAN DEFAULT false,
  rollback_status VARCHAR(50),

  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE INDEX idx_execution_attempts_decision_id ON execution_attempts(decision_id);
CREATE INDEX idx_execution_attempts_status ON execution_attempts(execution_status);

-- ═══════════════════════════════════════════════════════════════════
-- 4. ROLLBACK MANAGER
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS rollback_plans (
  id BIGSERIAL PRIMARY KEY,
  plan_id VARCHAR(100) UNIQUE NOT NULL,
  decision_id VARCHAR(100) NOT NULL,
  action_description TEXT NOT NULL,

  -- Plan steps (JSON array)
  rollback_steps JSONB NOT NULL,
  verification_steps JSONB,

  -- Timing
  estimated_duration_seconds INTEGER,
  expected_recovery_time_seconds INTEGER,

  -- Status
  status VARCHAR(50) DEFAULT 'created',  -- created, executed, failed, verified

  created_at TIMESTAMP DEFAULT NOW(),
  executed_at TIMESTAMP,
  completed_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rollback_executions (
  id BIGSERIAL PRIMARY KEY,
  execution_id VARCHAR(100) UNIQUE NOT NULL,
  plan_id VARCHAR(100) NOT NULL REFERENCES rollback_plans(plan_id),

  -- Execution context
  initiated_by VARCHAR(255) NOT NULL,
  reason TEXT,

  -- Progress
  status VARCHAR(50) DEFAULT 'in_progress',  -- in_progress, completed, failed, manual_intervention_required
  current_step_index INTEGER,

  -- Results
  step_results JSONB,  -- Array of step execution results
  verification_results JSONB,

  -- Timing
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  duration_ms INTEGER,

  -- Alerts
  on_call_team_alerted BOOLEAN DEFAULT false
);

CREATE INDEX idx_rollback_plans_decision_id ON rollback_plans(decision_id);
CREATE INDEX idx_rollback_executions_plan_id ON rollback_executions(plan_id);
CREATE INDEX idx_rollback_executions_status ON rollback_executions(status);

-- ═══════════════════════════════════════════════════════════════════
-- 5. DECISION EXPLAINER
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS decision_explanations (
  id BIGSERIAL PRIMARY KEY,
  decision_id VARCHAR(100) UNIQUE NOT NULL,
  explanation_id VARCHAR(100) UNIQUE NOT NULL,

  -- Explanation components
  key_factors JSONB NOT NULL,     -- Array of factors with impact/weight
  rejected_alternatives JSONB,     -- Array of rejected alternatives with reasons
  decision_path JSONB,             -- Step-by-step decision process

  -- Metadata
  confidence_score DECIMAL(3, 2),
  explanation_type VARCHAR(50),   -- multiagent, rulesbased, hybrid

  -- Natural language
  markdown_explanation TEXT,

  -- Uncertainties
  uncertainties TEXT[],
  assumptions TEXT[],

  created_at TIMESTAMP DEFAULT NOW(),
  generated_by VARCHAR(255)
);

CREATE INDEX idx_decision_explanations_decision_id ON decision_explanations(decision_id);

-- ═══════════════════════════════════════════════════════════════════
-- 6. ANOMALY GUARD
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS decision_history (
  id BIGSERIAL PRIMARY KEY,
  analysis_type VARCHAR(100) NOT NULL,
  criticality VARCHAR(50) NOT NULL,

  -- Metrics
  quality_score DECIMAL(3, 2),
  cost DECIMAL(10, 2),
  recommendation TEXT,
  success BOOLEAN,

  -- Risk
  risk_score DECIMAL(3, 2),
  risk_level VARCHAR(50),  -- LOW, MEDIUM, HIGH

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS anomaly_detections (
  id BIGSERIAL PRIMARY KEY,
  detection_id VARCHAR(100) UNIQUE NOT NULL,
  decision_id VARCHAR(100) NOT NULL,

  -- Anomaly info
  is_anomaly BOOLEAN DEFAULT false,
  anomaly_score DECIMAL(3, 2),
  anomaly_types TEXT[],  -- Array of AnomalyType enums
  severity VARCHAR(50),  -- warning, critical

  -- Action recommendation
  suggested_action VARCHAR(50),  -- approve, escalate, block

  -- Details
  reasons TEXT[],

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_anomaly_detections_decision_id ON anomaly_detections(decision_id);
CREATE INDEX idx_anomaly_detections_is_anomaly ON anomaly_detections(is_anomaly);
CREATE INDEX idx_decision_history_analysis_type ON decision_history(analysis_type, criticality);

-- ═══════════════════════════════════════════════════════════════════
-- 7. RATE LIMITING ENGINE
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS user_rate_limit_quotas (
  id BIGSERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  analysis_type VARCHAR(100) NOT NULL,
  environment VARCHAR(50) NOT NULL,

  -- Quota limits
  max_requests_per_hour INTEGER DEFAULT 100,
  max_cost_per_hour DECIMAL(10, 2) DEFAULT 100,
  max_reexecutions_per_request INTEGER DEFAULT 3,
  max_tokens_per_month BIGINT DEFAULT 10000000,

  -- Usage tracking (current hour/month)
  requests_this_hour INTEGER DEFAULT 0,
  cost_this_hour DECIMAL(10, 2) DEFAULT 0,
  tokens_this_month BIGINT DEFAULT 0,

  -- Reset times
  hour_reset_at TIMESTAMP,
  month_reset_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id, analysis_type, environment)
);

CREATE TABLE IF NOT EXISTS rate_limit_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  analysis_type VARCHAR(100) NOT NULL,
  environment VARCHAR(50) NOT NULL,

  -- Decision
  allowed BOOLEAN NOT NULL,
  reason VARCHAR(255),

  -- Estimates
  estimated_tokens INTEGER,
  estimated_cost DECIMAL(10, 2),

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_rate_limit_quotas_user_id ON user_rate_limit_quotas(user_id);
CREATE INDEX idx_rate_limit_logs_user_id ON rate_limit_logs(user_id, created_at DESC);

-- ═══════════════════════════════════════════════════════════════════
-- 8. SLO MONITOR
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS slo_targets (
  id BIGSERIAL PRIMARY KEY,
  slo_name VARCHAR(100) UNIQUE NOT NULL,
  environment VARCHAR(50) NOT NULL,  -- PRODUCTION, STAGING

  -- Target metrics
  target_error_rate DECIMAL(3, 2),          -- e.g., 0.02 for 2%
  target_latency_p99_ms INTEGER,            -- milliseconds
  target_availability DECIMAL(3, 2),        -- e.g., 0.995 for 99.5%
  target_quality_score DECIMAL(3, 2),       -- 0-1
  target_auto_execution_rate DECIMAL(3, 2), -- e.g., 0.75 for 75%

  -- Error budget
  error_budget_percent DECIMAL(3, 2),
  evaluation_window_days INTEGER DEFAULT 30,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS slo_status_history (
  id BIGSERIAL PRIMARY KEY,
  slo_name VARCHAR(100) NOT NULL,
  environment VARCHAR(50) NOT NULL,

  -- Current metrics
  current_error_rate DECIMAL(3, 2),
  current_latency_p99_ms INTEGER,
  current_availability DECIMAL(3, 2),
  current_quality_score DECIMAL(3, 2),
  current_auto_execution_rate DECIMAL(3, 2),

  -- Compliance
  overall_compliance BOOLEAN,
  compliance_percentage DECIMAL(5, 2),

  -- Error budget
  error_budget_remaining DECIMAL(3, 2),
  error_budget_status VARCHAR(50),  -- healthy, warning, critical

  -- Forecast
  on_track_to_meet_slo BOOLEAN,
  days_until_breach INTEGER,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_slo_status_history_slo_name ON slo_status_history(slo_name, created_at DESC);
CREATE INDEX idx_slo_status_history_environment ON slo_status_history(environment);

-- ═══════════════════════════════════════════════════════════════════
-- 9. CHAOS TEST VALIDATOR
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS chaos_test_results (
  id BIGSERIAL PRIMARY KEY,
  test_id VARCHAR(100) UNIQUE NOT NULL,
  scenario_name VARCHAR(255) NOT NULL,

  -- Execution
  started_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP NOT NULL,
  duration_ms INTEGER,

  -- Results
  resilience_score DECIMAL(3, 2),
  passed BOOLEAN NOT NULL,

  -- Details
  failures TEXT[],
  alerts TEXT[],
  recommendations TEXT[],

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_chaos_test_results_scenario ON chaos_test_results(scenario_name);
CREATE INDEX idx_chaos_test_results_passed ON chaos_test_results(passed);
CREATE INDEX idx_chaos_test_results_created_at ON chaos_test_results(created_at DESC);

-- ═══════════════════════════════════════════════════════════════════
-- 10. SHADOW MODE EXECUTOR
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS shadow_executions (
  id BIGSERIAL PRIMARY KEY,
  shadow_id VARCHAR(100) UNIQUE NOT NULL,
  original_decision_id VARCHAR(100) NOT NULL,

  -- Metadata
  analysis_type VARCHAR(100) NOT NULL,
  environment VARCHAR(50) NOT NULL,

  -- Execution
  status VARCHAR(50) NOT NULL,  -- pending, running, completed, failed, timeout

  -- Results
  matches BOOLEAN DEFAULT false,
  differences JSONB,

  -- Metrics
  duration INTEGER,  -- ms
  actual_latency INTEGER,  -- ms

  -- Errors
  errors TEXT[],

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_shadow_executions_original_decision ON shadow_executions(original_decision_id);
CREATE INDEX idx_shadow_executions_analysis_type ON shadow_executions(analysis_type);
CREATE INDEX idx_shadow_executions_matches ON shadow_executions(matches);
CREATE INDEX idx_shadow_executions_created_at ON shadow_executions(created_at DESC);

-- ═══════════════════════════════════════════════════════════════════
-- ORCHESTRATION AUDIT LOG
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS orchestration_audit_log (
  id BIGSERIAL PRIMARY KEY,
  decision_id VARCHAR(100) NOT NULL,

  -- Pipeline results
  autonomy_check_passed BOOLEAN,
  blast_radius_severity VARCHAR(50),
  anomaly_detected BOOLEAN,
  anomaly_score DECIMAL(3, 2),
  rate_limit_passed BOOLEAN,
  slo_impact_passed BOOLEAN,

  -- Overall
  approved BOOLEAN NOT NULL,
  blocked_by TEXT[],
  warnings TEXT[],

  -- Execution
  execution_status VARCHAR(50),
  execution_result JSONB,

  -- Timing
  started_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP NOT NULL,
  duration_ms INTEGER,

  -- Context
  user_id VARCHAR(255),
  analysis_type VARCHAR(100),
  criticality VARCHAR(50),

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_orchestration_audit_decision_id ON orchestration_audit_log(decision_id);
CREATE INDEX idx_orchestration_audit_approved ON orchestration_audit_log(approved);
CREATE INDEX idx_orchestration_audit_user_id ON orchestration_audit_log(user_id, created_at DESC);
CREATE INDEX idx_orchestration_audit_analysis_type ON orchestration_audit_log(analysis_type);

-- ═══════════════════════════════════════════════════════════════════
-- SEED DEFAULT DATA
-- ═══════════════════════════════════════════════════════════════════

INSERT INTO autonomy_policies
  (policy_name, analysis_type, criticality, context, autonomy_level, max_executions_per_hour, max_cost_per_hour, requires_human_approval, created_by)
VALUES
  ('Production High Risk', 'observability', 'CRITICAL', 'production', 'SEMI_AUTONOMOUS', 10, 100, true, 'system'),
  ('Production Normal', 'observability', 'NORMAL', 'production', 'SEMI_AUTONOMOUS', 50, 500, false, 'system'),
  ('Staging Normal', 'observability', 'NORMAL', 'staging', 'FULL_AUTONOMOUS', 500, 5000, false, 'system'),
  ('Dev All Types', 'observability', 'LOW', 'dev', 'FULL_AUTONOMOUS', 1000, 50000, false, 'system')
ON CONFLICT (analysis_type, criticality, context) DO NOTHING;

INSERT INTO slo_targets
  (slo_name, environment, target_error_rate, target_latency_p99_ms, target_availability, target_quality_score, target_auto_execution_rate, error_budget_percent)
VALUES
  ('Production SLO', 'production', 0.02, 5000, 0.995, 0.80, 0.75, 0.02),
  ('Staging SLO', 'staging', 0.05, 10000, 0.99, 0.75, 0.65, 0.05)
ON CONFLICT (slo_name) DO NOTHING;
