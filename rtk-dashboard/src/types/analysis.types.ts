export type AnalysisType =
  | 'observability'
  | 'test-intelligence'
  | 'cicd'
  | 'incident'
  | 'risk'
  | 'multi-agent';

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export type AnalysisStatus = 'pending' | 'running' | 'completed' | 'failed';

// ─── Shared building blocks ───────────────────────────────────────────────────

export interface Finding {
  id: string;
  severity: Severity;
  title: string;
  description: string;
  affectedComponent?: string;
  evidence?: string;
}

export interface Recommendation {
  priority: 'immediate' | 'short-term' | 'long-term';
  action: string;
  rationale: string;
  estimatedImpact?: string;
}

export interface AnalysisMetadata {
  analysisId: string;
  type: AnalysisType;
  status: AnalysisStatus;
  model: string;
  tokensUsed?: number;
  durationMs: number;
  createdAt: string;
  dataWindowMinutes?: number;
}

// ─── Observability Analysis ───────────────────────────────────────────────────

export interface ObservabilityAnalysis {
  metadata: AnalysisMetadata;
  summary: string;
  overallHealthScore: number; // 0-100
  anomalies: Finding[];
  bottlenecks: Finding[];
  recommendations: Recommendation[];
  jvmInsights: {
    heapUsageTrend: string;
    gcPressure: Severity;
    threadPoolStatus: string;
  };
  httpInsights: {
    p95LatencyMs: number;
    errorRatePct: number;
    slowestEndpoints: string[];
  };
}

// ─── Test Intelligence Analysis ───────────────────────────────────────────────

export interface TestCase {
  name: string;
  suite: string;
  durationMs: number;
  status: 'passed' | 'failed' | 'flaky' | 'skipped';
  failureCount?: number;
  errorMessage?: string;
}

export interface TestIntelligenceAnalysis {
  metadata: AnalysisMetadata;
  summary: string;
  totalTests: number;
  passRate: number;
  flakyTests: TestCase[];
  slowTests: TestCase[];
  failurePatterns: Finding[];
  recommendations: Recommendation[];
  prioritization: string[];
}

// ─── CI/CD Analysis ───────────────────────────────────────────────────────────

export interface WorkflowJob {
  name: string;
  durationSeconds: number;
  status: string;
  conclusion?: string;
}

export interface CICDAnalysis {
  metadata: AnalysisMetadata;
  summary: string;
  averagePipelineDurationMinutes: number;
  successRate: number;
  slowJobs: WorkflowJob[];
  failureTrends: Finding[];
  optimizationOpportunities: Recommendation[];
  estimatedTimeSavingsMinutes?: number;
}

// ─── Incident Analysis ────────────────────────────────────────────────────────

export interface IncidentAnalysis {
  metadata: AnalysisMetadata;
  summary: string;
  severity: Severity;
  rootCauseHypothesis: string;
  impactedLayers: {
    layer: 'domain' | 'application' | 'infrastructure' | 'security' | 'interface';
    component: string;
    confidence: number; // 0-1
  }[];
  errorPatterns: Finding[];
  suggestedFixes: Recommendation[];
  preventionMeasures: string[];
}

// ─── Risk Analysis ────────────────────────────────────────────────────────────

export interface RiskScenario {
  id: string;
  domain: 'asset' | 'transfer' | 'maintenance' | 'depreciation' | 'insurance' | 'inventory';
  title: string;
  description: string;
  riskScore: number; // 0-100
  likelihood: Severity;
  impact: Severity;
  affectedAssetCount?: number;
}

export interface RiskAnalysis {
  metadata: AnalysisMetadata;
  summary: string;
  overallRiskScore: number; // 0-100
  riskLevel: Severity;
  scenarios: RiskScenario[];
  inconsistencies: Finding[];
  recommendations: Recommendation[];
  complianceFlags: string[];
}

// ─── Multi-Agent Analysis ────────────────────────────────────────────────────

export interface AgentReport {
  agentName: string;
  domain: string;
  summary: string;
  findings: Finding[];
  recommendations: Recommendation[];
  confidence: number; // 0-1
}

export interface MultiAgentAnalysis {
  metadata: AnalysisMetadata;
  executiveSummary: string;
  overallSystemHealthScore: number;
  agentReports: AgentReport[];
  crossCuttingConcerns: Finding[];
  prioritizedActions: Recommendation[];
}

// ─── Union result type ───────────────────────────────────────────────────────

export type AnalysisResult =
  | ObservabilityAnalysis
  | TestIntelligenceAnalysis
  | CICDAnalysis
  | IncidentAnalysis
  | RiskAnalysis
  | MultiAgentAnalysis;

// ─── Request payloads ────────────────────────────────────────────────────────

export interface ObservabilityRequest {
  windowMinutes?: number;
}

export interface TestIntelligenceRequest {
  projectId?: string;
  suite?: 'backend' | 'frontend' | 'all';
}

export interface CICDRequest {
  workflowFile?: string;
  lookbackDays?: number;
}

export interface IncidentRequest {
  logs: string[];
  errorMessages?: string[];
  timeWindowMinutes?: number;
}

export interface RiskRequest {
  domains?: ('asset' | 'transfer' | 'maintenance' | 'depreciation' | 'insurance' | 'inventory')[];
  assetIds?: string[];
}
