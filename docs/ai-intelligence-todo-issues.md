# AI Intelligence TODOs -> Proposed GitHub Issues

This backlog consolidates TODO/FIXME comments found under `ai-intelligence/src`.

## 1) Persist and Learn From Value Feedback
- Scope:
  - `ai-intelligence/src/api/routes/value-decision.routes.ts` (lines 184-186)
- Description:
  - Persist `impact-feedback` into PostgreSQL.
  - Recalculate `value_score` from real outcomes.
  - Update decision history aggregates after feedback ingestion.
- Acceptance criteria:
  - Feedback is saved with decision ID and timestamp.
  - `value_score` is recomputed using persisted outcome fields.
  - A follow-up dashboard query reflects updated aggregates.
- Suggested labels:
  - `ai-intelligence`, `backend`, `value-intelligence`, `enhancement`

## 2) Implement ROI Dashboard Data Pipeline
- Scope:
  - `ai-intelligence/src/api/routes/value-decision.routes.ts` (lines 254-256)
- Description:
  - Implement period-based retrieval and ROI aggregation.
  - Integrate `ROICalculator` and return completed dashboard payload.
- Acceptance criteria:
  - Endpoint returns non-placeholder metrics for `day|week|month`.
  - ROI and quality sections are derived from stored decisions.
- Suggested labels:
  - `ai-intelligence`, `dashboard`, `analytics`

## 3) Implement Top-Value Ranking Query
- Scope:
  - `ai-intelligence/src/api/routes/value-decision.routes.ts` (lines 296-298)
- Description:
  - Query decisions by period and `min_value_score`.
  - Sort descending by value score and enforce limit.
- Acceptance criteria:
  - Sorting, filtering and pagination/limit work as requested.
- Suggested labels:
  - `ai-intelligence`, `api`, `analytics`

## 4) Wire Previous Decision Context in Autonomous Feedback
- Scope:
  - `ai-intelligence/src/api/routes/autonomous-decision.routes.ts` (line 139)
- Description:
  - Load prior decision from DB and pass it into `processFeedbackAndEvolve`.
- Acceptance criteria:
  - Feedback evolution uses real prior decision metadata.
  - Missing decision path is handled with clear 4xx response.
- Suggested labels:
  - `ai-intelligence`, `autonomous`, `learning`

## 5) Implement Autonomous Re-execution Flow
- Scope:
  - `ai-intelligence/src/autonomous/AutonomousDecisionOrchestrator.ts` (line 144)
- Description:
  - Implement automatic reexecution strategy trigger + fallback model path.
- Acceptance criteria:
  - Reexecution condition is deterministic and observable.
  - Audit trail records reexecution reason and outcome.
- Suggested labels:
  - `ai-intelligence`, `autonomous`, `reliability`

## 6) Replace Placeholder Runtime Metrics in Learning/Governance
- Scope:
  - `ai-intelligence/src/autonomous/GovernanceAuditLayer.ts` (line 112)
  - `ai-intelligence/src/learning/LearningEngineOrchestrator.ts` (line 117)
- Description:
  - Replace hardcoded `promptVersion` and `latencyMs` placeholders with real values.
- Acceptance criteria:
  - Values come from runtime metadata/tracing instead of constants.
- Suggested labels:
  - `ai-intelligence`, `observability`, `technical-debt`

## 7) Implement Real Embeddings in Memory Layer
- Scope:
  - `ai-intelligence/src/memory/MemoryLayer.ts` (line 417)
- Description:
  - Replace dummy hash-vector embedding with OpenAI embedding API integration.
- Acceptance criteria:
  - Embeddings are generated via provider API.
  - Failure path degrades gracefully with telemetry.
- Suggested labels:
  - `ai-intelligence`, `memory`, `rag`, `enhancement`

## 8) Close Production Safeguards TODOs (Anomaly/SRE/SLO/Alerts)
- Scope:
  - `ai-intelligence/src/production/AnomalyGuard.ts` (314, 316, 319, 320)
  - `ai-intelligence/src/production/SREValidationGateway.ts` (327, 332)
  - `ai-intelligence/src/production/SafeExecutionLayer.ts` (473)
  - `ai-intelligence/src/production/RollbackManager.ts` (600)
  - `ai-intelligence/src/production/SLOMonitor.ts` (336, 421)
  - `ai-intelligence/src/production/RateLimitingEngine.ts` (325)
- Description:
  - Implement missing calculations (risk stats, trend slope, top recommendations).
  - Implement real alerting integrations and gateway cache/reexecution behavior.
  - Load quota overrides from DB.
- Acceptance criteria:
  - Placeholder returns removed.
  - Alerting pathways are functional and test-covered.
  - Cache/reexecution and quota-loading paths are operational.
- Suggested labels:
  - `ai-intelligence`, `production-safety`, `sre`, `technical-debt`

## Notes
- GitHub CLI is not available in this environment, so issues were prepared as actionable drafts instead of being created automatically.
