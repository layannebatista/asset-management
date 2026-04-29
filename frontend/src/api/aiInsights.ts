import { api } from './axios'

// ─── Shared types (mirrors analysis.types.ts from the AI service) ─────────────

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info'
export type AnalysisType = 'observability' | 'test-intelligence' | 'cicd' | 'incident' | 'risk' | 'multi-agent'

export interface AnalysisMetadata {
  analysisId: string
  type: AnalysisType
  status: string
  model: string
  tokensUsed?: number
  durationMs: number
  createdAt: string
  dataWindowMinutes?: number
}

export interface Finding {
  id: string
  severity: Severity
  title: string
  description: string
  affectedComponent?: string
  evidence?: string
}

export interface Recommendation {
  priority: 'immediate' | 'short-term' | 'long-term'
  action: string
  rationale: string
  estimatedImpact?: string
}

export interface ObservabilityAnalysis {
  metadata: AnalysisMetadata
  summary: string
  overallHealthScore: number
  anomalies: Finding[]
  bottlenecks: Finding[]
  recommendations: Recommendation[]
  jvmInsights: { heapUsageTrend: string; gcPressure: Severity; threadPoolStatus: string }
  httpInsights: { p95LatencyMs: number; errorRatePct: number; slowestEndpoints: string[] }
}

export interface TestIntelligenceAnalysis {
  metadata: AnalysisMetadata
  summary: string
  totalTests: number
  passRate: number
  flakyTests: { name: string; suite: string; durationMs: number; status: string; failureCount?: number; errorMessage?: string }[]
  slowTests: { name: string; suite: string; durationMs: number; status: string }[]
  failurePatterns: Finding[]
  recommendations: Recommendation[]
  prioritization: string[]
}

export interface CICDAnalysis {
  metadata: AnalysisMetadata
  summary: string
  averagePipelineDurationMinutes: number
  successRate: number
  slowJobs: { name: string; durationSeconds: number; status: string; conclusion?: string }[]
  failureTrends: Finding[]
  optimizationOpportunities: Recommendation[]
  estimatedTimeSavingsMinutes?: number
}

export interface IncidentAnalysis {
  metadata: AnalysisMetadata
  summary: string
  severity: Severity
  rootCauseHypothesis: string
  impactedLayers: { layer: string; component: string; confidence: number }[]
  errorPatterns: Finding[]
  suggestedFixes: Recommendation[]
  preventionMeasures: string[]
}

export interface RiskAnalysis {
  metadata: AnalysisMetadata
  summary: string
  overallRiskScore: number
  riskLevel: Severity
  scenarios: { id: string; domain: string; title: string; description: string; riskScore: number; likelihood: Severity; impact: Severity; affectedAssetCount?: number }[]
  inconsistencies: Finding[]
  recommendations: Recommendation[]
  complianceFlags: string[]
}

export interface MultiAgentAnalysis {
  metadata: AnalysisMetadata
  executiveSummary: string
  overallSystemHealthScore: number
  agentReports: { agentName: string; domain: string; summary: string; findings: Finding[]; recommendations: Recommendation[]; confidence: number }[]
  crossCuttingConcerns: Finding[]
  prioritizedActions: Recommendation[]
}

export type AnyAnalysis = ObservabilityAnalysis | TestIntelligenceAnalysis | CICDAnalysis | IncidentAnalysis | RiskAnalysis | MultiAgentAnalysis

// ─── API calls ────────────────────────────────────────────────────────────────

const BASE = '/ai/analysis'

export const aiInsightsApi = {
  observability: (windowMinutes?: number) =>
    api.post<ObservabilityAnalysis>(`${BASE}/observability`, { windowMinutes }).then((r) => r.data),

  testIntelligence: (suite?: 'backend' | 'frontend' | 'all') =>
    api.post<TestIntelligenceAnalysis>(`${BASE}/test-intelligence`, { suite }).then((r) => r.data),

  cicd: (lookbackDays?: number) =>
    api.post<CICDAnalysis>(`${BASE}/cicd`, { lookbackDays }).then((r) => r.data),

  incident: (logs: string[], errorMessages?: string[], timeWindowMinutes?: number) =>
    api.post<IncidentAnalysis>(`${BASE}/incident`, { logs, errorMessages, timeWindowMinutes }).then((r) => r.data),

  risk: (domains?: string[]) =>
    api.post<RiskAnalysis>(`${BASE}/risk`, { domains }).then((r) => r.data),

  multiAgent: () =>
    api.post<MultiAgentAnalysis>(`${BASE}/multi-agent`, {}).then((r) => r.data),

  history: (type?: AnalysisType, limit = 20) =>
    api.get<{ data: AnyAnalysis[]; total: number }>(`${BASE}/history`, { params: { type, limit } }).then((r) => r.data),

  getById: (id: string) =>
    api.get<AnyAnalysis>(`${BASE}/${id}`).then((r) => r.data),
}
