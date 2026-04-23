/**
 * Sprint Reporter - Type definitions
 * Define todas as estruturas de dados do relatório
 */

// ─── Período da Sprint ─────────────────────────────────────────────────────
export interface SprintPeriod {
  startDate: Date;
  endDate: Date;
  projectName: string;
  daysCount: number;
}

// ─── Status do Sistema ────────────────────────────────────────────────────
export type HealthStatus = 'excellent' | 'good' | 'attention' | 'critical';

export interface SystemHealth {
  status: HealthStatus;
  issuesCount: number;
  criticalCount: number;
  warningCount: number;
}

// ─── Testes ──────────────────────────────────────────────────────────────
export interface TestMetrics {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  flaky: number;
  passRate: number;
  failureRate: number;
  flakyRate: number;
  byType: {
    unit: TestCount;
    integration: TestCount;
    e2e: TestCount;
    performance: TestCount;
  };
  byStatus: {
    passed: string[];
    failed: string[];
    flaky: string[];
  };
}

export interface TestCount {
  total: number;
  passed: number;
  failed: number;
  passRate: number;
}

// ─── Duração dos Testes ───────────────────────────────────────────────────
export interface TestDuration {
  fastest: number;
  slowest: number;
  average: number;
  median: number;
  p95: number;
  p99: number;
}

// ─── Performance (K6) ─────────────────────────────────────────────────────
export interface PerformanceMetrics {
  k6?: K6Metrics;
}

export interface K6Metrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  errorRate: number;
  latency: {
    min: number;
    max: number;
    avg: number;
    p95: number;
    p99: number;
  };
  rps: number;
  dataReceived: number;
  dataSent: number;
  duration: number;
}

export interface PlaywrightMetrics {
  totalSteps: number;
  passedSteps: number;
  failedSteps: number;
  avgDuration: number;
  slowestTest: string;
  failures: PlaywrightFailure[];
}

export interface PlaywrightFailure {
  testName: string;
  errorMessage: string;
  duration: number;
}

// ─── CI/CD (GitHub Actions) ───────────────────────────────────────────────
export interface CIPipelineMetrics {
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  successRate: number;
  totalDuration: number;
  avgDuration: number;
  byJob: Record<string, JobMetric>;
}

export interface JobMetric {
  name: string;
  runs: number;
  succeeded: number;
  failed: number;
  avgDuration: number;
  status: 'healthy' | 'degraded' | 'critical';
}

// ─── Qualidade de Código ──────────────────────────────────────────────────
export interface CodeQualityMetrics {
  coverage: number;
  violations: number;
  criticalIssues: number;
  warnings: number;
  staticAnalysisStatus: 'pass' | 'fail';
}

// ─── AI Intelligence ──────────────────────────────────────────────────────
export interface AIMetrics {
  analysesExecuted: number;
  avgQuality: number;
  avgConfidence: number;
  tokensEconomized: number;
  costSaved: number;
  modelDistribution: Record<string, number>;
  autonomousDecisions: {
    total: number;
    successRate: number;
    avgRisk: number;
  };
}

// ─── Fluxo (Duração nas etapas) ───────────────────────────────────────────
export interface FlowMetrics {
  development: {
    tasksCompleted: number;
    avgDuration: number;
  };
  testing: {
    testsExecuted: number;
    avgDuration: number;
  };
  deployment: {
    deployments: number;
    successRate: number;
  };
  totalCycleDays: number;
}

// ─── Problemas Detectados ────────────────────────────────────────────────
export interface Issue {
  severity: 'critical' | 'warning';
  title: string;
  description: string;
  affectedArea: string;
  recommendation: string;
  detectedAt: Date;
}

// ─── Insights e Padrões ──────────────────────────────────────────────────
export interface Insight {
  pattern: string;
  description: string;
  impact: string;
  recommendation: string;
}

// ─── Recomendações ───────────────────────────────────────────────────────
export interface Recommendation {
  priority: 'high' | 'medium' | 'low';
  action: string;
  rationale: string;
  expectedImpact: string;
  effort: 'low' | 'medium' | 'high';
}

// ─── Relatório Completo ──────────────────────────────────────────────────
export interface SprintReport {
  timestamp: Date;
  period: SprintPeriod;
  health: SystemHealth;
  summary: {
    status: HealthStatus;
    totalTests: number;
    testPassRate: number;
    performanceStatus: 'healthy' | 'degraded' | 'critical';
    deploymentCount: number;
  };
  tests: TestMetrics;
  testDuration: TestDuration;
  performance: PerformanceMetrics;
  cicd: CIPipelineMetrics;
  codeQuality: CodeQualityMetrics;
  ai: AIMetrics;
  flow: FlowMetrics;
  issues: Issue[];
  insights: Insight[];
  recommendations: Recommendation[];
}

// ─── Dados Coletados (interno) ───────────────────────────────────────────
export interface CollectedData {
  allure: AllureData;
  github: GitHubData;
  postgres: PostgreSQLData;
  aiapi?: AIAPIData;
  rtkapi?: RTKData;
  k6?: K6Data;
}

export interface RTKData {
  summary: {
    period: string;
    totalAnalysesExecuted: number;
    metrics: {
      tokensSaved: number;
      usdSaved: number;
      savingsPercentage: number;
      qualityScore: number;
    };
    recommendation: string;
  };
  tokenEconomy: {
    tokensWithoutRTK: number;
    tokensWithRTK: number;
    savingsPercentage: number;
    financialImpact: {
      costWithoutOptimization: number;
      costWithOptimization: number;
      usdSaved: number;
    };
  };
  models: Array<{
    name: string;
    executions: number;
    avgFinalTokens: number;
    avgReductionPercentage: number;
    avgAccuracy: number;
    costPerAnalysis: number;
    recommendation: string;
  }>;
  analyses: Array<{
    type: string;
    executions: number;
    avgEfficiency: number;
    avgAccuracy: number;
    totalUsdSaved: number;
    roiPercentage: number;
    recommendation: string;
  }>;
  history: Array<{
    week: string;
    totalAnalyses: number;
    savingsPercentage: number;
    usdSaved: number;
    avgAccuracy: number;
  }>;
}

export interface AIAPIData {
  dashboard: any;
  tokenSavingsSummary: any;
  recentTokenSavings: any[];
  analysisHistory: any[];
}

export interface AllureData {
  tests: any[];
  testResults: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
  };
  byType?: {
    unit: { total: number; passed: number; failed: number; passRate: number };
    integration: { total: number; passed: number; failed: number; passRate: number };
    e2e: { total: number; passed: number; failed: number; passRate: number };
    performance: { total: number; passed: number; failed: number; passRate: number };
  };
  byStatus?: {
    passed: string[];
    failed: string[];
    flaky: string[];
  };
}

export interface GitHubData {
  runs: any[];
  jobs: any[];
  summary: {
    totalRuns: number;
    totalDuration: number;
  };
}

export interface PostgreSQLData {
  aiMetrics: any[];
  analysisHistory: any[];
  decisions: any[];
}

export interface K6Data {
  metrics: {
    http_req_duration: { avg: number; min: number; max: number; med: number; p90: number; p95: number; p99: number };
    http_reqs: { count: number; rate: number };
    http_req_failed: { rate: number; passes: number; fails: number };
    checks: { rate: number; passes: number; fails: number };
    iterations: { count: number; rate: number };
    data_received: { count: number; rate: number };
    data_sent: { count: number; rate: number };
    vus_max: number;
    login_duration: { avg: number; p95: number };
    assets_duration: { avg: number; p95: number };
    maintenance_duration: { avg: number; p95: number };
  };
  summary: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    errorRate: number;
    rps: number;
    checksPassRate: number;
    latency: { min: number; max: number; avg: number; med: number; p90: number; p95: number; p99: number };
    dataReceived: number;
    dataSent: number;
    maxVUs: number;
  };
}
