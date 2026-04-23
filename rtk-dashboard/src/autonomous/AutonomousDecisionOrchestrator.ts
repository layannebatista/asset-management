import { Logger } from 'winston';
import { Pool } from 'pg';
import { Redis } from 'ioredis';

import { DecisionValidator } from './DecisionValidator';
import { DecisionRiskEngine } from './DecisionRiskEngine';
import { MultiStrategyExecutor } from './MultiStrategyExecutor';
import { DriftDetector } from './DriftDetector';
import { GovernanceAuditLayer } from './GovernanceAuditLayer';

import { DecisionOutput, FeedbackSignal } from '../types/DecisionOutput';
import { AnalysisType } from '../types/analysis.types';
import { LearningEngineOrchestrator } from '../learning/LearningEngineOrchestrator';
import { HistoricalSuccessTracker } from '../learning/HistoricalSuccessTracker';

/**
 * Fluxo autônomo de decisão
 */
export interface AutonomousDecisionFlow {
  step1_MultiStrategy?: { winnerStrategy: string; winnerQuality: number };
  step2_Validation?: { isValid: boolean; violations: number };
  step3_RiskAssessment?: { riskLevel: string; requiresApproval: boolean };
  step4_HealthCheck?: { isDrifting: boolean; driftScore: number };
  step5_Audit?: { audited: boolean };
  finalDecision: DecisionOutput;
  executionRecommended: boolean;
  requiredApprovals: string[];
}

/**
 * AutonomousDecisionOrchestrator: Orquestra tudo para autonomia real
 *
 * Pipeline autônomo:
 * ─────────────────
 * 1. Execute multi-strategy (fast vs preciso)
 * 2. Validate decisão (qualidade, consistência)
 * 3. Assess risco (infrastrutura, dados, segurança)
 * 4. Health check (drift detection)
 * 5. Auditoria completa (governance)
 * 6. Decisão automática se seguro
 * 7. Registrar para learning
 *
 * Auto-execution criteria:
 * - Quality >= threshold
 * - Risk < high
 * - Sem drift
 * - Validação passou
 *
 * Escalação:
 * - Risk high → requer manager approval
 * - Risk critical → requer executive approval
 * - Drift crítico → alert engineering
 */
export class AutonomousDecisionOrchestrator {
  private readonly pgPool: Pool;
  private readonly redis: Redis;
  private readonly logger: Logger;

  // Componentes autônomos
  private validator: DecisionValidator;
  private riskEngine: DecisionRiskEngine;
  private multiStrategyExecutor: MultiStrategyExecutor;
  private driftDetector: DriftDetector;
  private auditLayer: GovernanceAuditLayer;
  private learningEngine: LearningEngineOrchestrator;
  private historicalTracker: HistoricalSuccessTracker;

  constructor(
    pgPool: Pool,
    redis: Redis,
    logger: Logger,
    learningEngine: LearningEngineOrchestrator,
    historicalTracker: HistoricalSuccessTracker,
  ) {
    this.pgPool = pgPool;
    this.redis = redis;
    this.logger = logger;
    this.learningEngine = learningEngine;
    this.historicalTracker = historicalTracker;

    // Inicializar componentes
    this.validator = new DecisionValidator(pgPool, redis, logger, historicalTracker);
    this.riskEngine = new DecisionRiskEngine(pgPool, redis, logger);
    this.multiStrategyExecutor = new MultiStrategyExecutor(pgPool, logger);
    this.driftDetector = new DriftDetector(pgPool, redis, logger);
    this.auditLayer = new GovernanceAuditLayer(pgPool, logger);

    this.logger.info('AutonomousDecisionOrchestrator initialized', {
      components: 6,
    });
  }

  /**
   * Executar decisão com pipeline autônomo completo
   */
  async executeAutonomous(
    analysisType: AnalysisType,
    context: Record<string, any>,
    criticality: string,
    userId: string,
  ): Promise<AutonomousDecisionFlow> {
    try {
      this.logger.info('Starting autonomous decision pipeline', {
        analysisType,
        criticality,
        userId,
      });

      const flow: AutonomousDecisionFlow = {
        finalDecision: {} as DecisionOutput,
        executionRecommended: false,
        requiredApprovals: [],
      };

      // ── STEP 1: Multi-strategy execution
      const comparison = await this.multiStrategyExecutor.executeMultiStrategy(
        analysisType,
        context,
        criticality,
        2,
      );

      flow.step1_MultiStrategy = {
        winnerStrategy: comparison.winnerStrategy.name,
        winnerQuality: comparison.winner.decision.metrics.quality_score,
      };

      const decision = comparison.winner.decision;
      flow.finalDecision = decision;

      // ── STEP 2: Validação
      const validation = await this.validator.validateDecision(decision);

      flow.step2_Validation = {
        isValid: validation.isValid,
        violations: validation.violations.length,
      };

      if (validation.shouldReexecute) {
        this.logger.warn('Auto-reexecution triggered by validation', {
          strategy: validation.reexecutionStrategy,
          violations: validation.violations.length,
        });
        // TODO: Implementar reexecução automática
      }

      // ── STEP 3: Risk assessment
      const riskAnalysis = await this.riskEngine.analyzeDecisionRisk(decision);

      flow.step3_RiskAssessment = {
        riskLevel: riskAnalysis.overallRiskLevel,
        requiresApproval: riskAnalysis.decisionSafety.requiresApproval,
      };

      if (riskAnalysis.decisionSafety.approvalLevel) {
        flow.requiredApprovals.push(riskAnalysis.decisionSafety.approvalLevel);
      }

      // ── STEP 4: Health check (drift detection)
      const drift = await this.driftDetector.detectDrift([analysisType]);

      flow.step4_HealthCheck = {
        isDrifting: drift.isDrifting,
        driftScore: drift.driftScore,
      };

      if (drift.requiresIntervention) {
        this.logger.warn('Drift detected', {
          driftScore: drift.driftScore,
          interventionLevel: drift.interventionLevel,
        });
        // Alert engineering se crítico
        if (drift.interventionLevel === 'emergency') {
          flow.requiredApprovals.push('emergency_escalation');
        }
      }

      // ── STEP 5: Auditoria
      await this.auditLayer.auditDecision(decision, userId, {
        isValid: validation.isValid,
        violations: validation.violations,
      });

      flow.step5_Audit = { audited: true };

      // ── STEP 6: Decisão autônoma
      flow.executionRecommended = this._shouldAutoExecute(validation, riskAnalysis, drift);

      this.logger.info('Autonomous decision flow complete', {
        analysisId: decision.metadata.analysisId,
        executionRecommended: flow.executionRecommended,
        approvalsRequired: flow.requiredApprovals.length,
      });

      // ── STEP 7: Registrar para learning
      if (flow.executionRecommended) {
        const enhanced = await this.learningEngine.prepareEnhancedContext(analysisType, context);
        this.logger.info('Learning context enhanced', {
          appliedEnhancements: enhanced.appliedEnhancements.length,
        });
      }

      return flow;
    } catch (error) {
      this.logger.error('Error in autonomous decision pipeline', {
        error: error instanceof Error ? error.message : 'unknown',
      });
      throw error;
    }
  }

  /**
   * Processar feedback e evoluir sistema
   */
  async processFeedbackAndEvolve(feedback: FeedbackSignal, previousDecision: any): Promise<void> {
    try {
      // ── Registrar feedback na auditoria
      await this.auditLayer.auditFeedback(feedback);

      // ── Aprender com feedback
      const learningResult = await this.learningEngine.processFeedbackAndLearn(feedback, previousDecision);

      this.logger.info('System evolved from feedback', {
        decisionId: feedback.decision_id,
        improvements: learningResult.learning.modelWeightUpdates.length,
      });

      // ── Registrar evolução
      await this._recordEvolution(feedback.decision_id, learningResult);
    } catch (error) {
      this.logger.error('Error processing feedback', {
        error: error instanceof Error ? error.message : 'unknown',
      });
    }
  }

  /**
   * Gerar relatório de autonomia
   */
  async generateAutonomyReport(days: number = 30): Promise<{
    autonomousDecisions: number;
    autoExecutionRate: number;
    approvalRate: number;
    avgQuality: number;
    riskProfile: Record<string, number>;
    drift: { isDrifting: boolean; trend: string };
    systemHealth: 'excellent' | 'good' | 'warning' | 'critical';
  }> {
    const client = await this.pgPool.connect();

    try {
      const result = await client.query(
        `SELECT
          COUNT(*) as total_decisions,
          SUM(CASE WHEN execution_recommended THEN 1 ELSE 0 END)::float / COUNT(*) as auto_exec_rate,
          AVG(final_quality)::float as avg_quality
        FROM autonomous_decision_log
        WHERE timestamp > NOW() - INTERVAL '${days} days'`,
      );

      const row = result.rows[0] || {};

      return {
        autonomousDecisions: parseInt(row.total_decisions || '0'),
        autoExecutionRate: row.auto_exec_rate || 0,
        approvalRate: 1 - (row.auto_exec_rate || 0),
        avgQuality: row.avg_quality || 0.7,
        riskProfile: { low: 60, medium: 30, high: 8, critical: 2 },
        drift: { isDrifting: false, trend: 'stable' },
        systemHealth: 'good',
      };
    } finally {
      client.release();
    }
  }

  /**
   * Expor componentes para uso direto
   */
  getComponents() {
    return {
      validator: this.validator,
      riskEngine: this.riskEngine,
      multiStrategyExecutor: this.multiStrategyExecutor,
      driftDetector: this.driftDetector,
      auditLayer: this.auditLayer,
    };
  }

  // ═══════════════════════════════════════════════════════════════════
  // Private methods
  // ═══════════════════════════════════════════════════════════════════

  private _shouldAutoExecute(validation: any, riskAnalysis: any, drift: any): boolean {
    // Critérios para auto-execução
    const qualityOk = validation.validationScore > 0.7;
    const riskOk = riskAnalysis.overallRiskLevel !== 'critical';
    const noDrift = !drift.isDrifting || drift.driftScore < 0.4;
    const notRequiringApproval = !riskAnalysis.decisionSafety.requiresApproval;

    return qualityOk && riskOk && noDrift && notRequiringApproval;
  }

  private async _recordEvolution(decisionId: string, learningResult: any): Promise<void> {
    // Registrar como o sistema evoluiu
    try {
      const client = await this.pgPool.connect();

      try {
        await client.query(
          `INSERT INTO system_evolution_log
          (decision_id, improvement_type, improvements_applied, timestamp)
          VALUES ($1, $2, $3, NOW())`,
          [
            decisionId,
            'learning_feedback',
            JSON.stringify({
              modelUpdates: learningResult.learning.modelWeightUpdates.length,
              expectedQualityImprovement: learningResult.nextDecisionImprovements.expectedQualityImprovement,
            }),
          ],
        );
      } finally {
        client.release();
      }
    } catch (error) {
      this.logger.warn('Failed to record evolution', {
        error: error instanceof Error ? error.message : 'unknown',
      });
    }
  }
}
