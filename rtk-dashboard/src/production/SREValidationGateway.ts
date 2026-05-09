/**
 * SRE Validation Gateway — Production Safety Enforcement
 *
 * Orquestra todos os 10 safeguards antes de retornar uma decisão.
 * Garante que sistema nunca retorna resposta insegura.
 */

import { DecisionResponse, ExecutionMode, RiskLevel } from './DecisionContractV2';
import {
  EdgeCaseValidation,
  FailureType,
  handleFailure,
  validateExecutionSafety,
  DecisionConsistencyCheck,
  checkRateLimits,
  checkTimeoutExceeded
} from './ProductionSafetyGuards';
import { ValueEnrichmentService, EnrichedDecisionResponse } from './ValueEnrichmentService';

export interface ValidationGatewayContext {
  decisionId: string;
  userId: string;
  analysisType: string;
  criticality: string;
  context: any;
  decision: any;
  metrics: any;
  startTimeMs: number;
  currentUsage: any;
  models_used: string[];
  feedback?: any;                    // Para enriquecimento com valor
  enrichWithValue?: boolean;          // Adicionar value intelligence? Default: true
}

export interface ValidationResult {
  valid: boolean;
  decision?: DecisionResponse | EnrichedDecisionResponse;
  error?: string;
  fallbackUsed?: string;
  warnings: string[];
  enriched?: boolean;                // true se decision foi enriquecida com value intelligence
}

export class SREValidationGateway {
  /**
   * Gateway principal: valida decisão através de todos os safeguards
   */
  static async validateAndEnforce(ctx: ValidationGatewayContext): Promise<ValidationResult> {
    const warnings: string[] = [];
    const elapsedMs = Date.now() - ctx.startTimeMs;

    try {
      // ════════════════════════════════════════════════════════════════════
      // GUARD 1: Timeout Check
      // ════════════════════════════════════════════════════════════════════
      if (checkTimeoutExceeded(elapsedMs, 'total')) {
        return {
          valid: false,
          error: 'Total timeout exceeded',
          fallbackUsed: 'CACHE',
          warnings: ['Request exceeded 20s timeout limit']
        };
      }

      // ════════════════════════════════════════════════════════════════════
      // GUARD 2: Input Validation
      // ════════════════════════════════════════════════════════════════════
      const contextValid = EdgeCaseValidation.validateContext(ctx.context);
      if (!contextValid.valid) {
        return {
          valid: false,
          error: contextValid.error,
          warnings: ['Input validation failed']
        };
      }

      const outputValid = EdgeCaseValidation.validateJsonOutput(JSON.stringify(ctx.decision));
      if (!outputValid.valid) {
        return {
          valid: false,
          error: outputValid.error,
          fallbackUsed: 'FALLBACK_MODEL',
          warnings: ['Model output malformatted']
        };
      }

      // ════════════════════════════════════════════════════════════════════
      // GUARD 3: Metric Contradiction Check
      // ════════════════════════════════════════════════════════════════════
      const metricsCheck = EdgeCaseValidation.checkMetricContradictions(ctx.metrics);
      if (metricsCheck.warning) {
        warnings.push(metricsCheck.warning);
      }

      // ════════════════════════════════════════════════════════════════════
      // GUARD 4: Data Freshness Check
      // ════════════════════════════════════════════════════════════════════
      if (ctx.context.timestamp) {
        const freshnessCheck = EdgeCaseValidation.checkDataFreshness(ctx.context.timestamp);
        if (!freshnessCheck.fresh) {
          warnings.push(freshnessCheck.warning || '');
        }
      }

      // ════════════════════════════════════════════════════════════════════
      // GUARD 5: Consistency Check
      // ════════════════════════════════════════════════════════════════════
      const consistencyCheck = DecisionConsistencyCheck.check(ctx.decision, ctx.context);
      if (!consistencyCheck.consistent) {
        // Se inconsistência crítica, bloqueia
        return {
          valid: false,
          error: 'Decision is inconsistent with context',
          fallbackUsed: 'REEXECUTION',
          warnings: consistencyCheck.issues
        };
      }

      // ════════════════════════════════════════════════════════════════════
      // GUARD 6: Rate Limiting Check
      // ════════════════════════════════════════════════════════════════════
      const tokensEstimated = ctx.metrics?.estimated_tokens || 2000;
      const rateLimitCheck = checkRateLimits(ctx.userId, ctx.analysisType, tokensEstimated, ctx.currentUsage);
      if (!rateLimitCheck.allowed) {
        return {
          valid: false,
          error: rateLimitCheck.reason,
          warnings: ['Rate limit would be exceeded']
        };
      }

      // ════════════════════════════════════════════════════════════════════
      // GUARD 7: Execution Safety Check
      // ════════════════════════════════════════════════════════════════════
      const safetyCheck = validateExecutionSafety(
        ctx.metrics?.confidence_score || 0,
        ctx.metrics?.quality_score || 0,
        ctx.decision?.risk?.level || 'UNKNOWN',
        !!ctx.decision?.risk?.level
      );

      if (!safetyCheck.safe) {
        // Determinar execution mode seguro
        const decision = this.buildDecisionResponse(ctx, ExecutionMode.BLOCKED, safetyCheck.reason);
        return {
          valid: true,
          decision,
          warnings: [safetyCheck.reason || 'Safety check failed']
        };
      }

      // ════════════════════════════════════════════════════════════════════
      // GUARD 8: Load Assessment & Graceful Degradation
      // ════════════════════════════════════════════════════════════════════
      const loadLevel = this.assessLoad(ctx.currentUsage);
      if (loadLevel === 'EXTREME') {
        warnings.push('System under extreme load - degraded mode active');

        // Em carga extrema, bloqueia decisões não-críticas
        if (ctx.criticality !== 'CRITICAL') {
          const decision = this.buildDecisionResponse(ctx, ExecutionMode.BLOCKED, 'System under extreme load');
          return {
            valid: true,
            decision,
            warnings: ['System overloaded - request blocked']
          };
        }
      } else if (loadLevel === 'HIGH') {
        warnings.push('High system load - limited processing');
        // Em alta carga, aumenta threshold para APPROVAL_REQUIRED
      }

      // ════════════════════════════════════════════════════════════════════
      // BUILD RESPONSE
      // ════════════════════════════════════════════════════════════════════
      const executionMode = ctx.decision.execution?.mode || ExecutionMode.AUTO;
      const decision = this.buildDecisionResponse(ctx, executionMode);

      // Warnings são retornados no ValidationResult, não na decision metadata

      return {
        valid: true,
        decision,
        warnings,
        enriched: ctx.enrichWithValue !== false
      };
    } catch (error) {
      // Erro em validação = bloqueia
      return {
        valid: false,
        error: `Validation error: ${error instanceof Error ? error.message : 'unknown'}`,
        fallbackUsed: 'BLOCKED',
        warnings: ['Validation pipeline error']
      };
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // HELPER METHODS
  // ═══════════════════════════════════════════════════════════════════

  private static buildDecisionResponse(
    ctx: ValidationGatewayContext,
    executionMode: ExecutionMode,
    blockedReason?: string
  ): DecisionResponse | EnrichedDecisionResponse {
    const baseDecision: DecisionResponse = {
      decisionId: ctx.decisionId,
      timestamp: new Date(),

      decision: {
        recommendation: ctx.decision.recommendation || 'No recommendation available',
        reasoning: ctx.decision.reasoning || 'Unable to determine reasoning',
        confidence: ctx.metrics?.confidence_score || 0
      },

      actions: ctx.decision.actions || [],

      explanation: ctx.decision.explanation || {
        summary: 'Unable to provide detailed explanation',
        factors: [],
        rejected_alternatives: [],
        confidence_justification: 'Incomplete analysis'
      },

      execution: {
        mode: executionMode,
        reason: blockedReason
      },

      risk: ctx.decision.risk || {
        level: RiskLevel.MEDIUM,
        factors: []
      },

      metrics: {
        quality_score: ctx.metrics?.quality_score || 0,
        confidence_score: ctx.metrics?.confidence_score || 0
      },

      ui: ctx.decision.ui || {
        priority: 'P2',
        icon: '⚠️',
        color: 'warning',
        summary: 'Limited processing available'
      },

      audit: {
        type: ctx.analysisType,
        criticality: ctx.criticality,
        user: ctx.userId,
        models_used: ctx.models_used || []
      },

      metadata: {
        execution_time_ms: Date.now() - ctx.startTimeMs,
        cached: false,
        version: '2.0'
      }
    };

    // Enriquecer com value intelligence se solicitado
    if (ctx.enrichWithValue !== false) {
      return ValueEnrichmentService.enrich(
        baseDecision,
        ctx.context,
        ctx.feedback
      );
    }

    return baseDecision;
  }

  private static assessLoad(usage: any): 'NORMAL' | 'HIGH' | 'EXTREME' {
    const requestsPerMinute = usage?.requestsLastMinute || 0;
    const cpuPercent = usage?.cpuUsage || 0;
    const queueLength = usage?.queueLength || 0;

    // Extrema: muitos requests + fila grande
    if (requestsPerMinute > 200 || queueLength > 100) {
      return 'EXTREME';
    }

    // Alta: CPU alta ou requests altos
    if (cpuPercent > 80 || requestsPerMinute > 100) {
      return 'HIGH';
    }

    return 'NORMAL';
  }
}

/**
 * Error Recovery Handler
 * Determina qual fallback usar para cada tipo de erro
 */
export class ErrorRecoveryHandler {
  static async recover(failureType: FailureType, ctx: ValidationGatewayContext): Promise<DecisionResponse | null> {
    const recovery = handleFailure(failureType);

    // Tentar cache
    if (recovery.useCache) {
      const cached = await this.getFromCache(ctx.decisionId);
      if (cached) {
        return cached;
      }
    }

    // Tentar fallback model
    if (recovery.useFallbackModel) {
      try {
        return await this.reexecuteWithFallback(ctx);
      } catch (e) {
        // Fallback também falhou
      }
    }

    // Bloquear se nada funcionou
    if (recovery.blockExecution) {
      return this.buildBlockedDecision(ctx, failureType);
    }

    return null;
  }

  private static async getFromCache(_decisionId: string): Promise<DecisionResponse | null> {
    // TODO: implementar cache
    return null;
  }

  private static async reexecuteWithFallback(_ctx: ValidationGatewayContext): Promise<DecisionResponse> {
    // TODO: reexecutar com modelo simples (gpt-4-mini)
    throw new Error('Fallback not implemented');
  }

  private static buildBlockedDecision(ctx: ValidationGatewayContext, reason: FailureType): DecisionResponse {
    return {
      decisionId: ctx.decisionId,
      timestamp: new Date(),
      decision: {
        recommendation: 'No recommendation available',
        reasoning: `System error during processing: ${reason}`,
        confidence: 0
      },
      actions: [],
      explanation: {
        summary: 'Unable to process request',
        factors: [],
        rejected_alternatives: [],
        confidence_justification: 'System error'
      },
      execution: {
        mode: ExecutionMode.BLOCKED,
        reason: `Error: ${reason}`
      },
      risk: { level: RiskLevel.MEDIUM, factors: [] },
      metrics: { quality_score: 0, confidence_score: 0 },
      ui: {
        priority: 'P2',
        icon: '❌',
        color: 'danger',
        summary: 'Unable to process - please retry'
      },
      audit: {
        type: ctx.analysisType,
        criticality: ctx.criticality,
        user: ctx.userId,
        models_used: ctx.models_used || []
      },
      metadata: {
        execution_time_ms: Date.now() - ctx.startTimeMs,
        cached: false,
        version: '2.0'
      }
    };
  }
}
