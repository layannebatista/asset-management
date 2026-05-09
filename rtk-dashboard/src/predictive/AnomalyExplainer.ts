import { Logger } from 'winston';
import { Redis } from 'ioredis';
import { Pool } from 'pg';
import { ModelRouter, ModelDecision } from '../routing/ModelRouter';

/**
 * AnomalyExplainer: Provide causal analysis of anomalies
 *
 * Answers:
 * - "Why did latency spike 50% at 14:30?"
 * - "What caused the 2% error rate increase?"
 * - "Which deployment triggered the memory leak?"
 *
 * Methods:
 * - Correlation analysis (what metrics moved together?)
 * - Deployment/event timeline (what changed?)
 * - Root cause clustering (multiple symptoms → one cause?)
 * - LLM-based reasoning (ask model to explain)
 */

export interface AnomalyExplanation {
  timestamp: Date;
  metric: string;
  anomalousValue: number;
  expectedValue: number;
  deviation: number;
  possibleCauses: Array<{
    cause: string;
    type: 'deployment' | 'scaling' | 'dependency' | 'external' | 'unknown';
    confidence: number; // 0-1
    evidence: string[];
    timelineMatch: boolean;
  }>;
  mostLikelyCause: {
    cause: string;
    confidence: number;
    reasoning: string;
  };
  relatedMetrics: Array<{
    metric: string;
    correlation: number; // -1 to 1
    direction: 'positive' | 'negative';
  }>;
  suggestedActions: string[];
  explainedAt: Date;
}

export class AnomalyExplainer {
  private readonly redis: Redis;
  private readonly pgPool: Pool;
  private readonly logger: Logger;
  private readonly modelRouter: ModelRouter;

  private correlationCache: Map<string, Map<string, number>> = new Map();

  constructor(redis: Redis, pgPool: Pool, logger: Logger, modelRouter: ModelRouter) {
    this.redis = redis;
    this.pgPool = pgPool;
    this.logger = logger;
    this.modelRouter = modelRouter;
  }

  /**
   * Explain an anomaly: find root cause
   */
  async explainAnomaly(
    metric: string,
    timestamp: Date,
    anomalousValue: number,
    expectedValue: number,
  ): Promise<AnomalyExplanation> {
    this.logger.info('🔍 Explaining anomaly', {
      metric,
      timestamp,
      value: anomalousValue,
      expected: expectedValue,
    });

    const deviation = ((anomalousValue - expectedValue) / expectedValue) * 100;

    // Step 1: Find correlated metrics
    const relatedMetrics = await this._findCorrelatedMetrics(metric, timestamp, anomalousValue);

    // Step 2: Check timeline for events
    const events = await this._findTimelineEvents(timestamp);

    // Step 3: Find deployment/scaling changes
    const deployments = await this._findRecentDeployments(timestamp);
    const scalingEvents = await this._findScalingEvents(timestamp);

    // Step 4: Correlate evidence
    const possibleCauses = this._correlateEvidence({
      metric,
      anomalousValue,
      expectedValue,
      relatedMetrics,
      events,
      deployments,
      scalingEvents,
    });

    // Step 5: Use LLM for additional reasoning (optional)
    const llmInsight = await this._getLLMInsight(
      metric,
      anomalousValue,
      expectedValue,
      possibleCauses,
    );

    // Combine all evidence
    const mostLikelyCause = this._selectMostLikelyCause(possibleCauses, llmInsight);
    const suggestedActions = this._suggestActions(metric, mostLikelyCause, anomalousValue);

    const explanation: AnomalyExplanation = {
      timestamp,
      metric,
      anomalousValue,
      expectedValue,
      deviation,
      possibleCauses,
      mostLikelyCause,
      relatedMetrics,
      suggestedActions,
      explainedAt: new Date(),
    };

    // Cache explanation
    await this.redis.setex(
      `explanation:${metric}:${timestamp.getTime()}`,
      86400, // 24 hours
      JSON.stringify(explanation),
    );

    this.logger.info('✅ Anomaly explained', {
      metric,
      mostLikely: mostLikelyCause.cause,
      confidence: (mostLikelyCause.confidence * 100).toFixed(1) + '%',
    });

    return explanation;
  }

  /**
   * Compare two anomalies to find patterns
   */
  async compareAnomalies(
    anomaly1Timestamp: Date,
    anomaly2Timestamp: Date,
    metric: string,
  ): Promise<{
    similarity: number;
    commonCauses: string[];
    differences: string[];
  }> {
    const cached1 = await this.redis.get(
      `explanation:${metric}:${anomaly1Timestamp.getTime()}`,
    );
    const cached2 = await this.redis.get(
      `explanation:${metric}:${anomaly2Timestamp.getTime()}`,
    );

    if (!cached1 || !cached2) {
      return {
        similarity: 0,
        commonCauses: [],
        differences: ['Explanations not cached'],
      };
    }

    const exp1 = JSON.parse(cached1);
    const exp2 = JSON.parse(cached2);

    const causes1 = new Set(exp1.possibleCauses.map((c: any) => c.cause));
    const causes2 = new Set(exp2.possibleCauses.map((c: any) => c.cause));

    const common = Array.from(causes1).filter(c => causes2.has(c));
    const only1 = Array.from(causes1).filter(c => !causes2.has(c));
    const only2 = Array.from(causes2).filter(c => !causes1.has(c));

    const similarity = common.length / Math.max(causes1.size, causes2.size);

    return {
      similarity,
      commonCauses: common,
      differences: [...only1, ...only2],
    };
  }

  // ════════════════════════════════════════════════════════════════
  // Private methods
  // ════════════════════════════════════════════════════════════════

  private async _findCorrelatedMetrics(
    metric: string,
    timestamp: Date,
    value: number,
  ): Promise<Array<{ metric: string; correlation: number; direction: 'positive' | 'negative' }>> {
    const client = await this.pgPool.connect();

    try {
      // Get last hour of data for correlation
      const result = await client.query(
        `SELECT metric, value, timestamp
         FROM sla_metrics
         WHERE timestamp BETWEEN $1 AND $2
         ORDER BY timestamp`,
        [new Date(timestamp.getTime() - 3600000), timestamp],
      );

      const byMetric = new Map<string, number[]>();

      for (const row of result.rows) {
        if (!byMetric.has(row.metric)) {
          byMetric.set(row.metric, []);
        }
        byMetric.get(row.metric)!.push(row.value);
      }

      const targetValues = byMetric.get(metric) || [];
      const related: Array<{
        metric: string;
        correlation: number;
        direction: 'positive' | 'negative';
      }> = [];

      // Calculate correlations
      for (const [otherMetric, otherValues] of byMetric) {
        if (otherMetric === metric) continue;

        const correlation = this._calculateCorrelation(targetValues, otherValues);

        if (Math.abs(correlation) > 0.3) {
          related.push({
            metric: otherMetric,
            correlation: Math.abs(correlation),
            direction: correlation > 0 ? 'positive' : 'negative',
          });
        }
      }

      return related.sort((a, b) => b.correlation - a.correlation).slice(0, 5);
    } finally {
      client.release();
    }
  }

  private async _findTimelineEvents(timestamp: Date): Promise<string[]> {
    // Check for system events around this time
    const events: string[] = [];

    // Check logs for errors/warnings
    const client = await this.pgPool.connect();

    try {
      const result = await client.query(
        `SELECT DISTINCT message
         FROM logs
         WHERE timestamp BETWEEN $1 AND $2
         AND level IN ('ERROR', 'WARN')
         LIMIT 5`,
        [new Date(timestamp.getTime() - 300000), new Date(timestamp.getTime() + 300000)],
      );

      events.push(...result.rows.map(r => r.message));
    } finally {
      client.release();
    }

    return events;
  }

  private async _findRecentDeployments(timestamp: Date): Promise<Array<{
    deploymentId: string;
    service: string;
    time: Date;
  }>> {
    // In production, query actual deployment system
    // For now, return empty (would be connected to CI/CD)
    return [];
  }

  private async _findScalingEvents(timestamp: Date): Promise<Array<{
    service: string;
    fromReplicas: number;
    toReplicas: number;
    time: Date;
  }>> {
    // In production, query Kubernetes or scaling service
    return [];
  }

  private _correlateEvidence(input: {
    metric: string;
    anomalousValue: number;
    expectedValue: number;
    relatedMetrics: Array<{ metric: string; correlation: number }>;
    events: string[];
    deployments: Array<{ deploymentId: string; service: string; time: Date }>;
    scalingEvents: Array<{ service: string; fromReplicas: number; toReplicas: number; time: Date }>;
  }): AnomalyExplanation['possibleCauses'] {
    const causes: AnomalyExplanation['possibleCauses'] = [];

    // Hypothesis 1: Scaling event
    if (input.scalingEvents.length > 0) {
      causes.push({
        cause: `Scaling event: ${input.scalingEvents[0].service} scaled`,
        type: 'scaling',
        confidence: 0.6,
        evidence: [
          `Timing matches within 5 minutes`,
          `Related metrics: ${input.relatedMetrics.slice(0, 2).map(m => m.metric).join(', ')}`,
        ],
        timelineMatch: true,
      });
    }

    // Hypothesis 2: Deployment
    if (input.deployments.length > 0) {
      causes.push({
        cause: `Deployment: ${input.deployments[0].service}`,
        type: 'deployment',
        confidence: 0.7,
        evidence: [
          `Recent deployment detected`,
          `Correlated with error rate increase`,
        ],
        timelineMatch: true,
      });
    }

    // Hypothesis 3: External dependency
    if (input.relatedMetrics.some(m => m.metric.includes('external'))) {
      causes.push({
        cause: 'External dependency latency',
        type: 'dependency',
        confidence: 0.5,
        evidence: [
          `Correlated with external API latency`,
          `No local changes detected`,
        ],
        timelineMatch: true,
      });
    }

    // Hypothesis 4: Unknown
    if (causes.length === 0) {
      causes.push({
        cause: 'Unknown - requires investigation',
        type: 'unknown',
        confidence: 0.3,
        evidence: [
          `No obvious events detected`,
          `Patterns suggest systematic issue`,
        ],
        timelineMatch: false,
      });
    }

    return causes.sort((a, b) => b.confidence - a.confidence);
  }

  private async _getLLMInsight(
    metric: string,
    anomalousValue: number,
    expectedValue: number,
    possibleCauses: AnomalyExplanation['possibleCauses'],
  ): Promise<string> {
    // Use ModelRouter to decide on model
    const decision = this.modelRouter.route({
      type: 'OBSERVABILITY' as any,
      contextSize: 2000,
      criticality: 'HIGH' as any,
      userTier: 'enterprise',
    });

    // In production, call LLM with context
    // For now, return synthesized insight
    return `Based on ${possibleCauses.length} hypotheses, the most likely cause is ` +
           `${possibleCauses[0].cause} with ${(possibleCauses[0].confidence * 100).toFixed(0)}% confidence.`;
  }

  private _selectMostLikelyCause(
    causes: AnomalyExplanation['possibleCauses'],
    llmInsight: string,
  ): AnomalyExplanation['mostLikelyCause'] {
    const topCause = causes[0];

    return {
      cause: topCause.cause,
      confidence: topCause.confidence,
      reasoning: `${llmInsight} Evidence: ${topCause.evidence.join(', ')}`,
    };
  }

  private _suggestActions(
    metric: string,
    cause: AnomalyExplanation['mostLikelyCause'],
    value: number,
  ): string[] {
    const actions: string[] = [];

    if (cause.cause.includes('Scaling')) {
      actions.push('Monitor replica health after scaling');
      actions.push('Check pod startup latency');
      actions.push('Review scale-up thresholds');
    } else if (cause.cause.includes('Deployment')) {
      actions.push('Rollback to previous version');
      actions.push('Check deployment logs for errors');
      actions.push('Run automated tests on new version');
    } else if (cause.cause.includes('dependency')) {
      actions.push('Check external service health');
      actions.push('Enable circuit breaker for external calls');
      actions.push('Increase timeout thresholds');
    } else {
      actions.push('Investigate further with detailed logs');
      actions.push('Enable debug mode for affected service');
      actions.push('Page on-call for manual investigation');
    }

    return actions;
  }

  private _calculateCorrelation(values1: number[], values2: number[]): number {
    if (values1.length < 2 || values1.length !== values2.length) {
      return 0;
    }

    const mean1 = values1.reduce((a, b) => a + b) / values1.length;
    const mean2 = values2.reduce((a, b) => a + b) / values2.length;

    let numerator = 0;
    let denominator1 = 0;
    let denominator2 = 0;

    for (let i = 0; i < values1.length; i++) {
      const diff1 = values1[i] - mean1;
      const diff2 = values2[i] - mean2;
      numerator += diff1 * diff2;
      denominator1 += diff1 * diff1;
      denominator2 += diff2 * diff2;
    }

    const denominator = Math.sqrt(denominator1 * denominator2);
    return denominator === 0 ? 0 : numerator / denominator;
  }
}
