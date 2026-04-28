// ─── Prometheus metric shapes ─────────────────────────────────────────────────

export interface PrometheusQueryResult {
  status: string;
  data: {
    resultType: 'vector' | 'matrix' | 'scalar' | 'string';
    result: PrometheusMetric[];
  };
}

export interface PrometheusMetric {
  metric: Record<string, string>;
  value?: [number, string];      // vector
  values?: [number, string][];   // matrix
}

export interface JVMMetrics {
  heapUsedBytes: number;
  heapMaxBytes: number;
  heapUsagePct: number;
  nonHeapUsedBytes: number;
  gcPauseSeconds: number;
  gcCollections: number;
  liveThreads: number;
  peakThreads: number;
  loadedClasses: number;
}

export interface HTTPMetrics {
  requestsTotal: number;
  errorsTotal: number;
  errorRatePct: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  activeConnections: number;
  slowestEndpoints: EndpointMetric[];
}

export interface EndpointMetric {
  uri: string;
  method: string;
  status: string;
  p95LatencyMs: number;
  requestCount: number;
}

export interface SystemMetrics {
  cpuUsagePct: number;
  memoryUsagePct: number;
  diskUsagePct: number;
  uptime: number;
}

export interface CollectedMetrics {
  collectedAt: string;
  windowMinutes: number;
  jvm: JVMMetrics;
  http: HTTPMetrics;
  system: SystemMetrics;
}

// ─── Allure/Test result shapes ────────────────────────────────────────────────

export interface AllureTestResult {
  uuid: string;
  name: string;
  fullName: string;
  status: 'passed' | 'failed' | 'broken' | 'skipped' | 'unknown';
  duration: number; // ms
  start: number;
  stop: number;
  labels: { name: string; value: string }[];
  statusDetails?: {
    message?: string;
    trace?: string;
  };
  steps?: AllureStep[];
}

export interface AllureStep {
  name: string;
  status: 'passed' | 'failed' | 'broken' | 'skipped';
  duration: number;
}

export interface AllureSummary {
  statistic: {
    failed: number;
    broken: number;
    skipped: number;
    passed: number;
    unknown: number;
    total: number;
  };
  time: {
    start: number;
    stop: number;
    duration: number;
    minDuration: number;
    maxDuration: number;
    sumsOfDurations: number;
  };
}

// ─── GitHub Actions shapes ────────────────────────────────────────────────────

export interface GitHubWorkflowRun {
  id: number;
  name: string;
  status: string;
  conclusion: string | null;
  createdAt: string;
  updatedAt: string;
  runAttempt: number;
  durationMs?: number;
  jobs?: GitHubJob[];
}

export interface GitHubJob {
  id: number;
  name: string;
  status: string;
  conclusion: string | null;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  steps?: GitHubStep[];
}

export interface GitHubStep {
  name: string;
  status: string;
  conclusion: string | null;
  number: number;
  startedAt?: string;
  completedAt?: string;
}
