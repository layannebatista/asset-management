/**
 * Evaluation datasets for all analysis types
 *
 * Each dataset contains 5-10 representative test cases
 * Format: input (context + query) + expected output
 */

import { AnalysisType } from '../../src/routing/RoutingContext';
import { EvalDatapoint } from '../../src/eval/EvalPipeline';
import { v4 as uuidv4 } from 'uuid';

// ─────────────────────────────────────────────────────────────────
// OBSERVABILITY DATASET
// ─────────────────────────────────────────────────────────────────

export const OBSERVABILITY_DATASET: EvalDatapoint[] = [
  {
    id: uuidv4(),
    analysisType: AnalysisType.OBSERVABILITY,
    input: {
      contextChunks: [
        'P95 latency increased from 200ms to 500ms in last 30 minutes',
        'Error rate steady at 0.1% (no change)',
        'CPU usage normal at 45%',
        'Database connection pool at 85% capacity',
        'Recent deployment: 2 hours ago',
      ],
      query: 'What is the root cause of latency spike?',
    },
    expectedOutput: {
      keyPoints: [
        'P95 latency spike is the primary signal',
        'Steady error rate suggests no cascading failures',
        'Database connection pool usage is elevated',
        'Recent deployment likely introduced regression',
      ],
      recommendedActions: [
        'Check database query logs for slow queries (sort by duration DESC)',
        'Review deployment changes from 2 hours ago',
        'Profile top 5 slowest endpoints with APM',
        'Monitor connection pool over next hour',
      ],
      confidence: 0.85,
    },
    generatedOutput: {
      keyPoints: [
        'P95 latency doubled (200 → 500ms)',
        'Database pool at high capacity',
        'Deployment 2 hours ago is timeline match',
      ],
      recommendedActions: [
        'Review database queries',
        'Check recent changes',
        'Monitor system',
      ],
      confidence: 0.78,
    },
  },

  {
    id: uuidv4(),
    analysisType: AnalysisType.OBSERVABILITY,
    input: {
      contextChunks: [
        'Memory usage increased linearly from 60% to 95% over 4 hours',
        'Garbage collection pauses increased from 50ms to 200ms',
        'Request count steady at 500 req/s',
        'No recent deployments',
      ],
      query: 'Is there a memory leak?',
    },
    expectedOutput: {
      keyPoints: [
        'Linear memory growth over 4h indicates possible leak',
        'GC pause increase suggests memory pressure',
        'Request volume unchanged rules out load issue',
        'No recent changes, so likely existing bug',
      ],
      recommendedActions: [
        'Enable heap dumps on next alert',
        'Check for listener/subscription leaks in code',
        'Review recent feature branches for memory allocation',
        'Set alert at 90% memory usage',
      ],
      confidence: 0.88,
    },
    generatedOutput: {
      keyPoints: [
        'Memory increasing steadily',
        'GC pauses getting longer',
        'Similar request load',
      ],
      recommendedActions: [
        'Check for memory leaks',
        'Review code changes',
        'Monitor memory',
      ],
      confidence: 0.72,
    },
  },

  {
    id: uuidv4(),
    analysisType: AnalysisType.OBSERVABILITY,
    input: {
      contextChunks: [
        'Disk IO latency P99 increased from 5ms to 45ms',
        'Database response time increased 10x',
        'Network latency normal (2ms)',
        'All database replicas affected',
        'Storage utilization: 92% of capacity',
      ],
      query: 'Why is database latency high?',
    },
    expectedOutput: {
      keyPoints: [
        'Disk IO is the bottleneck (45ms P99)',
        'All replicas affected suggests shared storage issue',
        'Storage at 92% capacity limits performance',
        'Network OK so not connectivity',
      ],
      recommendedActions: [
        'URGENT: Clean up old logs/archives (reduce disk to <80%)',
        'Upgrade storage tier or add faster storage',
        'Review slow query logs for optimization',
        'Set alert at 85% disk capacity',
      ],
      confidence: 0.92,
    },
    generatedOutput: {
      keyPoints: [
        'IO latency high (45ms)',
        'All replicas slow',
        'Disk full',
      ],
      recommendedActions: [
        'Clean up disk',
        'Fix queries',
      ],
      confidence: 0.75,
    },
  },
];

// ─────────────────────────────────────────────────────────────────
// INCIDENT DATASET
// ─────────────────────────────────────────────────────────────────

export const INCIDENT_DATASET: EvalDatapoint[] = [
  {
    id: uuidv4(),
    analysisType: AnalysisType.INCIDENT,
    input: {
      contextChunks: [
        'Incident started: 14:32 UTC',
        'All API endpoints returning 503 Service Unavailable',
        'Database connection pool: exhausted (150/150 used)',
        'Recent change (14:15 UTC): increased max connections 100 → 150',
        'No recent code deployments',
        'Error log: "Connection pool exhausted, rejecting new connections"',
      ],
      query: 'Root cause and immediate mitigation?',
    },
    expectedOutput: {
      keyPoints: [
        'Connection pool exhaustion is immediate cause',
        'Increased max connections paradoxically caused exhaustion',
        'Likely a connection leak introduced by recent config change',
        'Timing aligns: change 14:15, incident 14:32',
      ],
      recommendedActions: [
        'IMMEDIATE: Revert connection pool change (100 max)',
        'IMMEDIATE: Monitor for recovery (should be instant)',
        'Investigate: Why did increasing limit cause exhaustion?',
        'Long-term: Add connection leak detection + alerts',
      ],
      confidence: 0.95,
    },
    generatedOutput: {
      keyPoints: [
        'All endpoints down',
        'Connection pool full',
        'Recent config change',
      ],
      recommendedActions: [
        'Revert the change',
        'Monitor recovery',
      ],
      confidence: 0.88,
    },
  },

  {
    id: uuidv4(),
    analysisType: AnalysisType.INCIDENT,
    input: {
      contextChunks: [
        'Incident: P99 latency spiked from 500ms to 15s',
        'Start time: 22:15 UTC',
        'Error rate increased from 0.1% to 5%',
        'A/B test started: new recommendation engine (22:00 UTC)',
        'New engine: heavy ML model inference per request',
        'CPU: 100% on inference nodes',
        'Memory: stable',
      ],
      query: 'Root cause and mitigation?',
    },
    expectedOutput: {
      keyPoints: [
        'A/B test feature deployed 15 min before incident',
        'New recommendation engine has heavy ML inference',
        'CPU maxed out indicates resource starvation',
        'Latency + error rate spike due to timeouts',
      ],
      recommendedActions: [
        'IMMEDIATE: Disable A/B test feature flag',
        'IMMEDIATE: Monitor latency/errors recovery',
        'Investigation: Profile ML model performance',
        'Long-term: Optimize model or cache predictions',
      ],
      confidence: 0.91,
    },
    generatedOutput: {
      keyPoints: [
        'Latency spike',
        'A/B test started',
        'CPU high',
      ],
      recommendedActions: [
        'Disable feature',
        'Optimize model',
      ],
      confidence: 0.8,
    },
  },
];

// ─────────────────────────────────────────────────────────────────
// RISK DATASET
// ─────────────────────────────────────────────────────────────────

export const RISK_DATASET: EvalDatapoint[] = [
  {
    id: uuidv4(),
    analysisType: AnalysisType.RISK,
    input: {
      contextChunks: [
        'Code review: User emails stored in plaintext in logs',
        'Affected systems: User authentication service',
        'Data classification: PII (Personally Identifiable Information)',
        'Exposure: Logs stored in shared ELK cluster',
        'LGPD Article 46: "data shall be protected"',
        'Current access: 50+ engineers can access logs',
      ],
      query: 'Assess LGPD and security risk',
    },
    expectedOutput: {
      keyPoints: [
        'PII (emails) in plaintext is LGPD violation (Article 46)',
        'Severity: CRITICAL due to wide access (50+ engineers)',
        'Risk: Data subject rights violation, regulatory fines',
        'Immediate exposure: Active logs are readable',
      ],
      recommendedActions: [
        'IMMEDIATE (24h): Enable encryption for PII fields in logs',
        'IMMEDIATE (24h): Redact historical emails from log indices',
        'SHORT-TERM (1w): Restrict log access via RBAC',
        'LONG-TERM: Implement data classification scanning in CI/CD',
      ],
      riskLevel: 'critical',
      confidence: 0.98,
    },
    generatedOutput: {
      keyPoints: [
        'Emails in logs',
        'Many people can see them',
        'LGPD violation',
      ],
      recommendedActions: [
        'Encrypt logs',
        'Limit access',
      ],
      riskLevel: 'critical',
      confidence: 0.9,
    },
  },

  {
    id: uuidv4(),
    analysisType: AnalysisType.RISK,
    input: {
      contextChunks: [
        'SQL injection vulnerability found in user search endpoint',
        'Input: username parameter not parameterized',
        'Query: `SELECT * FROM users WHERE username = \\'${input}\\'`',
        'CVSS Score: 8.6 (High)',
        'PoC: username = `\\' OR \\'1\\'=\\'1` → returns all users',
        'Current exposure: Public API, no rate limiting',
      ],
      query: 'Security risk assessment',
    },
    expectedOutput: {
      keyPoints: [
        'SQL injection vulnerability confirmed (CVSS 8.6)',
        'Allows unauthorized data access',
        'Public API increases risk',
        'No rate limiting allows repeated attacks',
      ],
      recommendedActions: [
        'IMMEDIATE: Use parameterized queries',
        'SHORT-TERM: Add query validation + escaping',
        'MID-TERM: Implement WAF rules',
        'AUDIT: Check for similar patterns in codebase',
      ],
      riskLevel: 'critical',
      confidence: 0.99,
    },
    generatedOutput: {
      keyPoints: [
        'SQL injection found',
        'High severity',
        'Can steal data',
      ],
      recommendedActions: [
        'Fix query',
        'Use parameterized queries',
      ],
      riskLevel: 'critical',
      confidence: 0.92,
    },
  },
];

// ─────────────────────────────────────────────────────────────────
// TEST INTELLIGENCE DATASET
// ─────────────────────────────────────────────────────────────────

export const TEST_INTELLIGENCE_DATASET: EvalDatapoint[] = [
  {
    id: uuidv4(),
    analysisType: AnalysisType.TEST_INTELLIGENCE,
    input: {
      contextChunks: [
        'Service: Authentication service',
        'Code: MFA verification endpoint',
        'Test coverage: 65%',
        'Missing coverage: MFA code reuse scenario',
        'Risk: User can reuse old MFA code?',
      ],
      query: 'Generate test case for MFA reuse vulnerability',
    },
    expectedOutput: {
      keyPoints: [
        'MFA code reuse is security gap (65% coverage)',
        'Specific scenario: send code, use twice',
        'Should fail on second attempt',
      ],
      recommendedActions: [
        'Test: Send MFA code, verify first use succeeds',
        'Test: Second use of same code fails with 400',
        'Test: Code expires after 10 minutes',
        'Setup: User with MFA enabled',
      ],
      confidence: 0.87,
    },
    generatedOutput: {
      keyPoints: [
        'MFA testing gap found',
        'Code reuse not tested',
      ],
      recommendedActions: [
        'Add test for code reuse',
        'Verify code expires',
      ],
      confidence: 0.8,
    },
  },

  {
    id: uuidv4(),
    analysisType: AnalysisType.TEST_INTELLIGENCE,
    input: {
      contextChunks: [
        'Component: Payment processor',
        'Test coverage: 72%',
        'Happy path tested: successful charge',
        'Gap: Refund flow untested',
        'Gap: Partial refund edge cases',
        'Refund amounts: full vs partial',
      ],
      query: 'Test coverage gaps for payment refunds',
    },
    expectedOutput: {
      keyPoints: [
        'Refund flow completely untested (gap)',
        'Partial refunds have 5 edge cases',
        'Critical business logic without tests',
      ],
      recommendedActions: [
        'Test: Full refund (amount == charge)',
        'Test: Partial refund (amount < charge)',
        'Test: Refund > charge (should fail)',
        'Test: Multiple refunds (serial)',
        'Test: Concurrent refunds (race condition)',
      ],
      confidence: 0.93,
    },
    generatedOutput: {
      keyPoints: [
        'Refunds not tested',
        'Partial refunds missing',
      ],
      recommendedActions: [
        'Add refund tests',
      ],
      confidence: 0.75,
    },
  },
];

// ─────────────────────────────────────────────────────────────────
// CI/CD DATASET
// ─────────────────────────────────────────────────────────────────

export const CICD_DATASET: EvalDatapoint[] = [
  {
    id: uuidv4(),
    analysisType: AnalysisType.CICD,
    input: {
      contextChunks: [
        'Pipeline stage: Docker image build',
        'Duration: 18 minutes (40% of total pipeline)',
        'Build context size: 2.5 GB',
        'Layer caching: disabled',
        'Dockerfile: 50 layers, no optimization',
        'Cost: $500/month in runner minutes',
      ],
      query: 'How to optimize Docker build time?',
    },
    expectedOutput: {
      keyPoints: [
        'Docker build is 40% of pipeline duration',
        'No layer caching = rebuild every time',
        'Unoptimized Dockerfile (50 layers)',
        'Large build context wasted',
      ],
      recommendedActions: [
        'Enable Docker layer caching in CI',
        'Use multi-stage Dockerfile (reduce final image)',
        'Add .dockerignore to exclude 1.5GB of files',
        'Optimize build order (dependencies first)',
      ],
      confidence: 0.89,
    },
    generatedOutput: {
      keyPoints: [
        'Docker build is slow',
        'No caching enabled',
      ],
      recommendedActions: [
        'Enable caching',
        'Optimize Dockerfile',
      ],
      confidence: 0.82,
    },
  },

  {
    id: uuidv4(),
    analysisType: AnalysisType.CICD,
    input: {
      contextChunks: [
        'Pipeline: Unit tests + Integration tests',
        'Unit tests: 2 min (10s setup, 110s execution)',
        'Integration tests: 8 min (5m setup, 3m execution)',
        'Parallelization: Tests run sequentially',
        'Infrastructure: 4 CPU cores available but unused',
      ],
      query: 'How to speed up test execution?',
    },
    expectedOutput: {
      keyPoints: [
        'Tests run sequentially despite 4 CPU cores',
        'Setup times dominate (5m for integration)',
        'Parallelization would reduce by ~3x',
      ],
      recommendedActions: [
        'Parallelize unit tests (per test class)',
        'Parallelize integration tests (per suite)',
        'Share test database setup (reduce from 5m to 1m)',
        'Use test sharding (distribute across workers)',
      ],
      confidence: 0.91,
    },
    generatedOutput: {
      keyPoints: [
        'Tests slow',
        'Running one at a time',
      ],
      recommendedActions: [
        'Run tests in parallel',
      ],
      confidence: 0.78,
    },
  },
];

// ─────────────────────────────────────────────────────────────────
// EXPORT ALL DATASETS
// ─────────────────────────────────────────────────────────────────

export const ALL_EVAL_DATASETS = {
  [AnalysisType.OBSERVABILITY]: OBSERVABILITY_DATASET,
  [AnalysisType.INCIDENT]: INCIDENT_DATASET,
  [AnalysisType.RISK]: RISK_DATASET,
  [AnalysisType.TEST_INTELLIGENCE]: TEST_INTELLIGENCE_DATASET,
  [AnalysisType.CICD]: CICD_DATASET,
};

export function getDatasetForType(type: AnalysisType): EvalDatapoint[] {
  return ALL_EVAL_DATASETS[type] || [];
}

export function getAllDatapoints(): EvalDatapoint[] {
  return Object.values(ALL_EVAL_DATASETS).flat();
}
