/**
 * Model Router: Intelligent dynamic model selection
 *
 * Decision tree based on:
 * - Analysis type
 * - Criticality level
 * - Context size
 * - User tier
 * - Recent success/failure history
 */

import { Logger } from 'winston';
import {
  AnalysisType,
  Criticality,
  ModelName,
  RoutingContext,
  ModelDecision,
  RoutingStats,
} from './RoutingContext';

interface RoutingHistoryEntry {
  timestamp: Date;
  context: RoutingContext;
  decision: ModelDecision;
  success: boolean;
  evalScore?: number;
}

export class ModelRouter {
  private readonly logger: Logger;
  private costCache: Map<ModelName, number> = new Map();
  private routingHistory: RoutingHistoryEntry[] = [];

  constructor(logger: Logger) {
    this.logger = logger;
    this._initCostMatrix();
  }

  /**
   * Core routing decision tree.
   * Order matters: constraints first, then optimize for cost/quality.
   */
  route(context: RoutingContext): ModelDecision {
    this.logger.debug('Routing decision requested', { type: context.type, criticality: context.criticality });

    // ── Constraint 1: Security Classification
    if (context.requiresLocalModel) {
      return {
        modelId: 'llama2-13b-local',
        modelName: 'local-llama2',
        temperature: 0.3,
        maxTokens: 2000,
        costEstimate: 0.001,
        reason: 'Security classified: requires local/on-prem model (LGPD)',
      };
    }

    // ── Constraint 2: Billing Tier (free tier restrictions)
    if (context.userTier === 'free' && context.criticality === 'CRITICAL') {
      return {
        modelId: 'gpt-4o-mini',
        modelName: 'gpt-4o-mini',
        temperature: 0.5,
        maxTokens: 1500,
        costEstimate: 0.005,
        reason: 'Free tier: critical analyses use cost-optimized path',
      };
    }

    // ── Decision Tree: Type → Criticality → Context Size
    switch (context.type) {
      case AnalysisType.OBSERVABILITY:
        return this._routeObservability(context);

      case AnalysisType.TEST_INTELLIGENCE:
        return this._routeTestIntelligence(context);

      case AnalysisType.CICD:
        return this._routeCICD(context);

      case AnalysisType.INCIDENT:
        return this._routeIncident(context);

      case AnalysisType.RISK:
        return this._routeRisk(context);

      default:
        throw new Error(`Unknown analysis type: ${context.type}`);
    }
  }

  private _routeObservability(ctx: RoutingContext): ModelDecision {
    // Observability = trend detection + pattern matching
    // Lighter model OK since patterns are relatively stable
    if (ctx.contextSize < 1000) {
      return this._decision('gpt-4o-mini', 0.4, 1000, 'Observability: small context');
    }
    if (ctx.contextSize < 2500) {
      return this._decision('gpt-4o', 0.5, 2000, 'Observability: medium context');
    }
    return this._decision('gpt-4o', 0.5, 2500, 'Observability: large context');
  }

  private _routeTestIntelligence(ctx: RoutingContext): ModelDecision {
    // Test intelligence needs code understanding + recommendations
    // Benefit from stronger model for test generation
    if (ctx.criticality === 'CRITICAL') {
      return this._decision('gpt-4-turbo', 0.3, 2000, 'Test intelligence: critical');
    }

    if (ctx.contextSize > 3000 && ctx.criticality === 'HIGH') {
      return this._decision('gpt-4-turbo', 0.4, 2500, 'Test intelligence: large critical');
    }

    if (ctx.contextSize > 3000) {
      return this._decision('gpt-4o', 0.5, 2500, 'Test intelligence: large context');
    }

    return this._decision('gpt-4o', 0.5, 2000, 'Test intelligence: standard');
  }

  private _routeIncident(ctx: RoutingContext): ModelDecision {
    // Incident investigation = highest priority, needs strong reasoning
    // Use o1-preview for complex root cause analysis
    if (ctx.criticality === 'CRITICAL' && ctx.contextSize > 2000) {
      return this._decision('o1-preview', 0.2, 3000, 'Incident: o1 for deep reasoning');
    }

    if (ctx.criticality === 'CRITICAL') {
      return this._decision('gpt-4-turbo', 0.3, 2500, 'Incident: turbo for critical');
    }

    if (ctx.criticality === 'HIGH') {
      return this._decision('gpt-4-turbo', 0.4, 2000, 'Incident: turbo for high priority');
    }

    return this._decision('gpt-4o', 0.5, 2000, 'Incident: standard');
  }

  private _routeRisk(ctx: RoutingContext): ModelDecision {
    // Risk assessment = high precision required, compliance critical
    if (ctx.criticality === 'CRITICAL') {
      return this._decision('gpt-4-turbo', 0.2, 2500, 'Risk: compliance-grade');
    }

    if (ctx.criticality === 'HIGH') {
      return this._decision('gpt-4o', 0.4, 2000, 'Risk: high priority');
    }

    return this._decision('gpt-4o', 0.5, 2000, 'Risk: standard');
  }

  private _routeCICD(ctx: RoutingContext): ModelDecision {
    // CI/CD = automation heavy, cost sensitive
    if (ctx.criticality === 'HIGH' || ctx.userTier === 'enterprise') {
      return this._decision('gpt-4o', 0.5, 2000, 'CI/CD: high priority');
    }

    if (ctx.criticality === 'CRITICAL') {
      return this._decision('gpt-4o', 0.4, 2000, 'CI/CD: critical (cost vs quality balance)');
    }

    return this._decision('gpt-4o-mini', 0.6, 1500, 'CI/CD: cost optimized');
  }

  private _decision(
    modelName: ModelName,
    temperature: number,
    maxTokens: number,
    reason: string,
  ): ModelDecision {
    const cost = this.costCache.get(modelName) || 0.02;
    return {
      modelId: `openai-${modelName}`,
      modelName,
      temperature,
      maxTokens,
      costEstimate: (cost * maxTokens) / 1000,
      reason,
    };
  }

  private _initCostMatrix(): void {
    // Cost per 1K tokens (input/output avg, 2024 pricing)
    this.costCache.set('gpt-4o-mini', 0.0005); // $0.15/1M → $0.00015/1k
    this.costCache.set('gpt-4o', 0.015); // $5/1M → $0.005/1k (avg in/out)
    this.costCache.set('gpt-4-turbo', 0.02); // $10/1M → $0.01/1k
    this.costCache.set('o1-preview', 0.08); // $15/1M input, $60/1M output → avg $0.0375/1k
    this.costCache.set('local-llama2', 0.001); // On-prem, minimal cost
  }

  /**
   * Learning: track success rates by routing decision
   * Use to adjust thresholds over time
   */
  recordOutcome(context: RoutingContext, decision: ModelDecision, evalScore: number): void {
    const entry: RoutingHistoryEntry = {
      timestamp: new Date(),
      context,
      decision,
      success: evalScore >= 0.8,
      evalScore,
    };

    this.routingHistory.push(entry);

    // Prune history > 1000 entries
    if (this.routingHistory.length > 1000) {
      this.routingHistory = this.routingHistory.slice(-800);
    }

    // Log anomalies
    if (evalScore < 0.6) {
      this.logger.warn('Router decision led to low eval score', {
        model: decision.modelName,
        evalScore,
        type: context.type,
      });
    }

    this.logger.debug('Routing outcome recorded', {
      modelName: decision.modelName,
      evalScore,
      success: entry.success,
    });
  }

  /**
   * Return routing statistics for monitoring
   */
  getStats(): RoutingStats {
    if (this.routingHistory.length === 0) {
      return {
        totalDecisions: 0,
        successRate: 0,
        costAverage: 0,
        modelDistribution: {
          'gpt-4o-mini': 0,
          'gpt-4o': 0,
          'gpt-4-turbo': 0,
          'o1-preview': 0,
          'local-llama2': 0,
        },
      };
    }

    const success = this.routingHistory.filter((h) => h.success).length;
    const costAverage =
      this.routingHistory.reduce((sum, h) => sum + h.decision.costEstimate, 0) /
      this.routingHistory.length;

    // Model distribution
    const modelDist: Record<ModelName, number> = {
      'gpt-4o-mini': 0,
      'gpt-4o': 0,
      'gpt-4-turbo': 0,
      'o1-preview': 0,
      'local-llama2': 0,
    };

    this.routingHistory.forEach((h) => {
      modelDist[h.decision.modelName]++;
    });

    return {
      totalDecisions: this.routingHistory.length,
      successRate: success / this.routingHistory.length,
      costAverage,
      modelDistribution: modelDist,
    };
  }

  /**
   * Get recent decisions (for debugging)
   */
  getRecent(limit: number = 10): RoutingHistoryEntry[] {
    return this.routingHistory.slice(-limit);
  }
}
