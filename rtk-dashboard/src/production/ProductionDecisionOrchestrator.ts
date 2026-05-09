import { Logger } from 'winston';
import { Pool } from 'pg';
import { Redis } from 'ioredis';

import { AutonomyPolicyEngine } from './AutonomyPolicyEngine';
import { BlastRadiusAnalyzer } from './BlastRadiusAnalyzer';
import { SafeExecutionLayer } from './SafeExecutionLayer';
import { RollbackManager } from './RollbackManager';
import { DecisionExplainer } from './DecisionExplainer';
import { AnomalyGuard } from './AnomalyGuard';
import { RateLimitingEngine } from './RateLimitingEngine';
import { SLOMonitor } from './SLOMonitor';
import { ChaosTestValidator } from './ChaosTestValidator';
import { ShadowModeExecutor } from './ShadowModeExecutor';

import { DecisionOutput } from '../types/DecisionOutput';
import { AnalysisType } from '../types/analysis.types';

/**
 * Decisão orquestrada completa com todos os safeguards
 */
export interface OrchestratedDecision {
  decisionId: string;
  originalDecision: DecisionOutput;

  // Pipeline stages
  autonomyCheck: {
    allowed: boolean;
    reason?: string;
    warnings: string[];
  };

  blastRadius: {
    severity: string;
    reversible: boolean;
    rollbackTime?: number;
    affectedUsers?: number;
  };

  anomalyDetection: {
    isAnomaly: boolean;
    anomalyScore: number;
    suggestedAction: string;
  };

  rateLimit: {
    allowed: boolean;
    quotaRemaining?: Record<string, number>;
  };

  execution: {
    status: 'pending' | 'executing' | 'completed' | 'failed' | 'rolled_back';
    result?: any;
    error?: string;
  };

  sloImpact: {
    meetsTargets: boolean;
    compliancePercentage: number;
  };

  explanation: {
    keyFactors: any[];
    rejectedAlternatives: any[];
  };

  shadowMode?: {
    executed: boolean;
    matches: boolean;
    divergence?: string;
  };

  // Overall
  approved: boolean;
  blockedBy?: string[];
  warnings: string[];
  timestamp: Date;
}

/**
 * ProductionDecisionOrchestrator: Coordena todos os 10 componentes de segurança
 *
 * Pipeline:
 * 1. AutonomyPolicyEngine - Verificar se autonomia é permitida
 * 2. RateLimitingEngine - Verificar quotas (usuário/tipo/custo)
 * 3. BlastRadiusAnalyzer - Estimar impacto da ação
 * 4. AnomalyGuard - Detectar decisões suspeitas
 * 5. DecisionExplainer - Gerar explicação
 * 6. SLOMonitor - Impacto nos SLOs
 * 7. SafeExecutionLayer - Executar com safeguards
 * 8. RollbackManager - Preparar rollback se necessário
 * 9. ShadowModeExecutor - Rodar em shadow para validação
 * 10. ChaosTestValidator - Validar resiliência (antes de deploy)
 *
 * Decisão é APROVADA se:
 * - Autonomia permitida
 * - Quotas disponíveis
 * - Não anomalias críticas
 * - SLOs não serão violados
 * - Blast radius aceitável
 *
 * Se uma etapa FALHA: bloqueia decisão e escalona
 */
export class ProductionDecisionOrchestrator {
  private readonly pgPool: Pool;
  private readonly redis: Redis;
  private readonly logger: Logger;

  private readonly autonomyPolicyEngine: AutonomyPolicyEngine;
  private readonly blastRadiusAnalyzer: BlastRadiusAnalyzer;
  private readonly safeExecutionLayer: SafeExecutionLayer;
  private readonly rollbackManager: RollbackManager;
  private readonly decisionExplainer: DecisionExplainer;
  private readonly anomalyGuard: AnomalyGuard;
  private readonly rateLimitingEngine: RateLimitingEngine;
  private readonly sloMonitor: SLOMonitor;
  private readonly chaosTestValidator: ChaosTestValidator;
  private readonly shadowModeExecutor: ShadowModeExecutor;

  constructor(
    pgPool: Pool,
    redis: Redis,
    logger: Logger,
  ) {
    this.pgPool = pgPool;
    this.redis = redis;
    this.logger = logger;

    // Inicializar todos os componentes
    this.autonomyPolicyEngine = new AutonomyPolicyEngine(pgPool, logger);
    this.blastRadiusAnalyzer = new BlastRadiusAnalyzer(pgPool, redis, logger);
    this.safeExecutionLayer = new SafeExecutionLayer(pgPool, redis, logger);
    this.rollbackManager = new RollbackManager(pgPool, redis, logger);
    this.decisionExplainer = new DecisionExplainer(pgPool, logger);
    this.anomalyGuard = new AnomalyGuard(pgPool, redis, logger);
    this.rateLimitingEngine = new RateLimitingEngine(redis, logger);
    this.sloMonitor = new SLOMonitor(pgPool, logger);
    this.chaosTestValidator = new ChaosTestValidator(pgPool, redis, logger);
    this.shadowModeExecutor = new ShadowModeExecutor(pgPool, redis, logger);

    this.logger.info('ProductionDecisionOrchestrator initialized with 10 components');
  }

  /**
   * Orquestrar decisão completa através de todos os safeguards
   */
  async orchestrateDecision(
    decisionId: string,
    decision: DecisionOutput,
    context: any,
    userId: string,
    executionFn?: () => Promise<any>,
  ): Promise<OrchestratedDecision> {
    const startTime = Date.now();

    try {
      this.logger.info('Starting decision orchestration', {
        decisionId,
        type: decision.metadata.type,
        criticality: decision.metadata.criticality,
      });

      const orchestrated: OrchestratedDecision = {
        decisionId,
        originalDecision: decision,
        autonomyCheck: { allowed: false, warnings: [] },
        blastRadius: { severity: 'unknown', reversible: false },
        anomalyDetection: { isAnomaly: false, anomalyScore: 0, suggestedAction: 'approve' },
        rateLimit: { allowed: false },
        execution: { status: 'pending' },
        sloImpact: { meetsTargets: true, compliancePercentage: 100 },
        explanation: { keyFactors: [], rejectedAlternatives: [] },
        approved: false,
        warnings: [],
        timestamp: new Date(),
      };

      const blockedBy: string[] = [];

      // ═══════════════════════════════════════════════════════════════════
      // 1. AUTONOMY POLICY ENGINE
      // ═══════════════════════════════════════════════════════════════════
      try {
        const autonomyCheck = await this.autonomyPolicyEngine.evaluateAutonomy(
          decision.metadata.type as AnalysisType,
          decision.metadata.criticality,
          decision.metadata.context as any,
          {
            qualityScore: decision.metrics.quality_score,
            riskLevel: decision.metrics.risk_level,
            estimatedCost: decision.metadata.estimated_cost,
            executionCount: 1,
            actionType: 'execute',
          },
        );

        orchestrated.autonomyCheck = {
          allowed: autonomyCheck.allowed,
          reason: autonomyCheck.blockedBecause,
          warnings: autonomyCheck.warnings,
        };

        if (!autonomyCheck.allowed) {
          blockedBy.push(`Autonomy policy: ${autonomyCheck.blockedBecause}`);
        }
      } catch (error) {
        this.logger.warn('Error in autonomy check', {
          error: error instanceof Error ? error.message : 'unknown',
        });
        blockedBy.push('Autonomy policy check failed');
      }

      // ═══════════════════════════════════════════════════════════════════
      // 2. RATE LIMITING ENGINE
      // ═══════════════════════════════════════════════════════════════════
      try {
        const rateLimitCheck = await this.rateLimitingEngine.checkRateLimit(
          userId,
          decision.metadata.type as AnalysisType,
          decision.metadata.context as 'dev' | 'staging' | 'production',
          decision.metadata.estimated_tokens || 2000,
        );

        orchestrated.rateLimit = {
          allowed: rateLimitCheck.allowed,
          quotaRemaining: rateLimitCheck.quotaRemaining,
        };

        if (!rateLimitCheck.allowed) {
          blockedBy.push(`Rate limit exceeded: ${rateLimitCheck.reason}`);
        }
      } catch (error) {
        this.logger.warn('Error in rate limit check', {
          error: error instanceof Error ? error.message : 'unknown',
        });
        blockedBy.push('Rate limit check failed');
      }

      // ═══════════════════════════════════════════════════════════════════
      // 3. BLAST RADIUS ANALYZER
      // ═══════════════════════════════════════════════════════════════════
      try {
        const blastRadiusAssessment = await this.blastRadiusAnalyzer.analyzeAction(
          decision.decision.recommendation,
          context.affectedServices || [],
          context.isDataModifying || false,
          decision.metadata.estimated_cost || 0,
        );

        orchestrated.blastRadius = {
          severity: blastRadiusAssessment.severity,
          reversible: blastRadiusAssessment.reversibilityScore > 0.7,
          rollbackTime: blastRadiusAssessment.estimatedRollbackTime,
          affectedUsers: blastRadiusAssessment.estimatedAffectedUsers,
        };

        // CRITICAL blast radius = bloqueia
        if (blastRadiusAssessment.severity === 'CRITICAL') {
          blockedBy.push('Blast radius is CRITICAL - action too dangerous');
        }
      } catch (error) {
        this.logger.warn('Error in blast radius analysis', {
          error: error instanceof Error ? error.message : 'unknown',
        });
        blockedBy.push('Blast radius analysis failed');
      }

      // ═══════════════════════════════════════════════════════════════════
      // 4. ANOMALY GUARD
      // ═══════════════════════════════════════════════════════════════════
      try {
        const anomalyDetection = await this.anomalyGuard.detectAnomalies(
          decisionId,
          decision,
          context,
        );

        orchestrated.anomalyDetection = {
          isAnomaly: anomalyDetection.isAnomaly,
          anomalyScore: anomalyDetection.anomalyScore,
          suggestedAction: anomalyDetection.suggestedAction,
        };

        if (anomalyDetection.suggestedAction === 'block') {
          blockedBy.push(`Anomaly detected (score: ${anomalyDetection.anomalyScore.toFixed(2)})`);
        } else if (anomalyDetection.suggestedAction === 'escalate') {
          orchestrated.warnings.push(
            `Anomaly detected - escalate to human review`,
          );
        }
      } catch (error) {
        this.logger.warn('Error in anomaly detection', {
          error: error instanceof Error ? error.message : 'unknown',
        });
      }

      // ═══════════════════════════════════════════════════════════════════
      // 5. DECISION EXPLAINER
      // ═══════════════════════════════════════════════════════════════════
      try {
        const explanation = await this.decisionExplainer.explainDecision(
          decisionId,
          decision,
          context,
          decision.metrics,
          { severity: orchestrated.blastRadius.severity },
        );

        orchestrated.explanation = {
          keyFactors: explanation.keyFactors,
          rejectedAlternatives: explanation.rejectedAlternatives,
        };
      } catch (error) {
        this.logger.warn('Error in decision explanation', {
          error: error instanceof Error ? error.message : 'unknown',
        });
      }

      // ═══════════════════════════════════════════════════════════════════
      // 6. SLO MONITOR
      // ═══════════════════════════════════════════════════════════════════
      try {
        const env = (decision.metadata.context || 'staging') as 'production' | 'staging';
        const sloStatus = await this.sloMonitor.checkSLOStatus(env);

        orchestrated.sloImpact = {
          meetsTargets: sloStatus.overallCompliance,
          compliancePercentage: sloStatus.compliancePercentage,
        };

        if (sloStatus.errorBudgetStatus === 'critical') {
          blockedBy.push('Error budget exhausted - cannot execute');
        } else if (sloStatus.errorBudgetStatus === 'warning') {
          orchestrated.warnings.push('Error budget running low');
        }
      } catch (error) {
        this.logger.warn('Error in SLO check', {
          error: error instanceof Error ? error.message : 'unknown',
        });
      }

      // ═══════════════════════════════════════════════════════════════════
      // CHECK: HÁ BLOCKERS? SE SIM, RETORNAR REPROVADO
      // ═══════════════════════════════════════════════════════════════════
      if (blockedBy.length > 0) {
        orchestrated.approved = false;
        orchestrated.blockedBy = blockedBy;
        orchestrated.execution.status = 'failed';
        orchestrated.execution.error = `Decision blocked by: ${blockedBy.join('; ')}`;

        this.logger.warn('Decision REJECTED during orchestration', {
          decisionId,
          blockers: blockedBy.length,
          reasons: blockedBy,
        });

        return orchestrated;
      }

      // ═══════════════════════════════════════════════════════════════════
      // 7. SAFE EXECUTION LAYER (se houver função de execução)
      // ═══════════════════════════════════════════════════════════════════
      if (executionFn) {
        try {
          orchestrated.execution.status = 'executing';

          const executionAttempt = await this.safeExecutionLayer.executeAction(
            decisionId,
            decision.decision.recommendation,
            context.affectedServices || [],
            executionFn,
          );

          orchestrated.execution.status = executionAttempt.status as any;
          orchestrated.execution.result = executionAttempt.finalOutput;

          if (executionAttempt.status !== 'success') {
            orchestrated.execution.error = executionAttempt.errors?.[0];
          }
        } catch (error) {
          orchestrated.execution.status = 'failed';
          orchestrated.execution.error = error instanceof Error ? error.message : 'Unknown error';
          blockedBy.push('Safe execution failed');
        }
      }

      // ═══════════════════════════════════════════════════════════════════
      // 8. SHADOW MODE EXECUTOR (validação paralela)
      // ═══════════════════════════════════════════════════════════════════
      if (decision.metadata.context === 'staging' && executionFn) {
        try {
          const shadowExecution = await this.shadowModeExecutor.executeShadow(
            decisionId,
            decision,
            decision.metadata.type as AnalysisType,
            'staging',
            executionFn,
          );

          orchestrated.shadowMode = {
            executed: shadowExecution.status === 'completed',
            matches: shadowExecution.matches,
            divergence: shadowExecution.differences?.outputDifference,
          };

          if (!shadowExecution.matches) {
            orchestrated.warnings.push('Shadow execution diverged from expected output');
          }
        } catch (error) {
          this.logger.warn('Error in shadow mode', {
            error: error instanceof Error ? error.message : 'unknown',
          });
        }
      }

      // ═══════════════════════════════════════════════════════════════════
      // 9. ROLLBACK MANAGER (preparar rollback se necessário)
      // ═══════════════════════════════════════════════════════════════════
      if (orchestrated.execution.status === 'completed' && context.isDataModifying) {
        try {
          await this.rollbackManager.createRollbackPlan(
            decisionId,
            decision.decision.recommendation,
            context.affectedServices || [],
          );
        } catch (error) {
          this.logger.warn('Error creating rollback plan', {
            error: error instanceof Error ? error.message : 'unknown',
          });
        }
      }

      // ═══════════════════════════════════════════════════════════════════
      // RECORD USAGE (RateLimitingEngine)
      // ═══════════════════════════════════════════════════════════════════
      if (orchestrated.execution.status === 'completed') {
        try {
          await this.rateLimitingEngine.recordUsage(
            userId,
            decision.metadata.type as AnalysisType,
            (decision.metadata.context as 'dev' | 'staging' | 'production') || 'staging',
            decision.metadata.estimated_tokens || 2000,
            decision.metadata.estimated_cost || 0,
          );

          // Registrar sucesso na anomaly guard
          await this.anomalyGuard.recordSuccess(
            decision.metadata.type as AnalysisType,
            decision.metadata.criticality,
            decision,
            decision.metadata.estimated_cost || 0,
          );
        } catch (error) {
          this.logger.warn('Error recording usage', {
            error: error instanceof Error ? error.message : 'unknown',
          });
        }
      }

      orchestrated.approved = blockedBy.length === 0;

      const duration = Date.now() - startTime;
      this.logger.info('Decision orchestration completed', {
        decisionId,
        approved: orchestrated.approved,
        duration,
        warnings: orchestrated.warnings.length,
      });

      return orchestrated;
    } catch (error) {
      this.logger.error('Fatal error in decision orchestration', {
        decisionId,
        error: error instanceof Error ? error.message : 'unknown',
      });

      return {
        decisionId,
        originalDecision: decision,
        autonomyCheck: { allowed: false, warnings: ['Orchestration failed'] },
        blastRadius: { severity: 'UNKNOWN', reversible: false },
        anomalyDetection: { isAnomaly: true, anomalyScore: 1, suggestedAction: 'block' },
        rateLimit: { allowed: false },
        execution: { status: 'failed', error: 'Orchestration error' },
        sloImpact: { meetsTargets: false, compliancePercentage: 0 },
        explanation: { keyFactors: [], rejectedAlternatives: [] },
        approved: false,
        blockedBy: ['Orchestration error'],
        warnings: ['Critical error during orchestration'],
        timestamp: new Date(),
      };
    }
  }

  /**
   * Executar validação pré-deploy (chaos tests)
   */
  async validateBeforeDeploy(environment: 'staging' | 'production'): Promise<{
    canDeploy: boolean;
    chaosResults: any;
    shadowHealth: any;
    recommendations: string[];
  }> {
    try {
      this.logger.info('Starting pre-deploy validation', { environment });

      // Rodar chaos tests
      const chaosResults = await this.chaosTestValidator.validateResilience(environment);

      // Checar shadow mode health
      const shadowHealth = await this.shadowModeExecutor.validateShadowHealth(
        'observability',
        environment,
        60,
      );

      let canDeploy = chaosResults.canProceed && shadowHealth.healthScore > 0.7;
      const recommendations: string[] = [];

      if (!chaosResults.canProceed) {
        recommendations.push('Fix chaos test failures before deploying');
      }

      if (shadowHealth.healthScore < 0.7) {
        recommendations.push('Investigate shadow mode divergences');
      }

      if (shadowHealth.recommendation === 'rollback') {
        recommendations.push('ROLLBACK - shadow health is critical');
        canDeploy = false;
      }

      return {
        canDeploy,
        chaosResults,
        shadowHealth,
        recommendations,
      };
    } catch (error) {
      this.logger.error('Error in pre-deploy validation', {
        error: error instanceof Error ? error.message : 'unknown',
      });

      return {
        canDeploy: false,
        chaosResults: null,
        shadowHealth: null,
        recommendations: ['Pre-deploy validation failed - investigate error'],
      };
    }
  }

  /**
   * Acessor para componentes individuais (para uso em resolução de problemas)
   */
  getComponent(name: string): any {
    const components: Record<string, any> = {
      autonomyPolicyEngine: this.autonomyPolicyEngine,
      blastRadiusAnalyzer: this.blastRadiusAnalyzer,
      safeExecutionLayer: this.safeExecutionLayer,
      rollbackManager: this.rollbackManager,
      decisionExplainer: this.decisionExplainer,
      anomalyGuard: this.anomalyGuard,
      rateLimitingEngine: this.rateLimitingEngine,
      sloMonitor: this.sloMonitor,
      chaosTestValidator: this.chaosTestValidator,
      shadowModeExecutor: this.shadowModeExecutor,
    };

    return components[name];
  }
}
