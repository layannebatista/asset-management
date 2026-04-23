import { Logger } from 'winston';
import { DecisionOutput } from '../types/DecisionOutput';

export interface AIMetricsContext {
  decision_id: string;
  analysis_type: string;
  model_used: string;
  criticality: string;
  context_tokens: number;
}

export class AIMetricsCollector {
  private readonly logger: Logger;
  private metrics: {
    latencies: number[];
    costs: number[];
    fallbacks: number;
    reexecutions: number;
    total_decisions: number;
  } = {
    latencies: [],
    costs: [],
    fallbacks: 0,
    reexecutions: 0,
    total_decisions: 0,
  };

  constructor(logger: Logger) {
    this.logger = logger;
  }

  recordDecision(decision: DecisionOutput, latency_ms: number, cost_usd: number) {
    this.metrics.latencies.push(latency_ms);
    this.metrics.costs.push(cost_usd);
    this.metrics.total_decisions++;

    if (decision.metadata.evaluation_count > 1) {
      this.metrics.reexecutions++;
    }

    if (decision.metadata.model_fallback) {
      this.metrics.fallbacks++;
    }

    this.logger.debug('Decision recorded', {
      decision_id: decision.metadata.analysisId,
      latency_ms,
      cost_usd: cost_usd.toFixed(6),
      model: decision.metadata.model_used,
    });
  }

  recordFallback(from_model: string, to_model: string, reason: string) {
    this.metrics.fallbacks++;
    this.logger.warn('Fallback recorded', { from_model, to_model, reason });
  }

  getMetricsSummary(): {
    total_decisions: number;
    avg_latency_ms: number;
    p95_latency_ms: number;
    p99_latency_ms: number;
    total_cost_usd: number;
    fallback_rate: number;
    reexecution_rate: number;
  } {
    const latencies = this.metrics.latencies.sort((a, b) => a - b);
    const total_cost = this.metrics.costs.reduce((a, b) => a + b, 0);

    return {
      total_decisions: this.metrics.total_decisions,
      avg_latency_ms: latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0,
      p95_latency_ms: latencies.length > 0 ? latencies[Math.floor(latencies.length * 0.95)] : 0,
      p99_latency_ms: latencies.length > 0 ? latencies[Math.floor(latencies.length * 0.99)] : 0,
      total_cost_usd: total_cost,
      fallback_rate: this.metrics.total_decisions > 0 ? this.metrics.fallbacks / this.metrics.total_decisions : 0,
      reexecution_rate: this.metrics.total_decisions > 0 ? this.metrics.reexecutions / this.metrics.total_decisions : 0,
    };
  }

  logSummary() {
    const summary = this.getMetricsSummary();
    this.logger.info('AI Decision Engine Metrics Summary', {
      total_decisions: summary.total_decisions,
      avg_latency_ms: summary.avg_latency_ms.toFixed(0),
      p99_latency_ms: summary.p99_latency_ms.toFixed(0),
      total_cost_usd: summary.total_cost_usd.toFixed(4),
      fallback_rate_pct: (summary.fallback_rate * 100).toFixed(2),
      reexecution_rate_pct: (summary.reexecution_rate * 100).toFixed(2),
    });
  }
}
