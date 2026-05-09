import { Logger } from 'winston';
import { Pool } from 'pg';
import { Redis } from 'ioredis';

import { DecisionEngineOrchestrator } from './DecisionEngineOrchestrator';
import { AutonomousDecisionOrchestrator } from '../autonomous/AutonomousDecisionOrchestrator';
import { LearningEngineOrchestrator } from '../learning/LearningEngineOrchestrator';
import { HistoricalSuccessTracker } from '../learning/HistoricalSuccessTracker';
import { DecisionRequest, DecisionOutput, FeedbackSignal } from '../types/DecisionOutput';

/**
 * Unified Decision Orchestrator
 *
 * Integra DecisionEngineOrchestrator (básico) com AutonomousDecisionOrchestrator (avançado)
 *
 * Fluxo:
 * 1. Se mode=autonomous → execute autonomous pipeline (validation, risk, drift, governance)
 * 2. Se mode=basic → execute basic pipeline (privacy, routing, agents, feedback)
 * 3. Se mode=hybrid → execute basic + autonomous enhancements
 *
 * Permite transição gradual (A/B testing) entre pipelines
 */
export class UnifiedDecisionOrchestrator {
  private readonly basicOrchestrator: DecisionEngineOrchestrator;
  private readonly autonomousOrchestrator: AutonomousDecisionOrchestrator;
  private readonly logger: Logger;

  constructor(
    basicOrchestrator: DecisionEngineOrchestrator,
    autonomousOrchestrator: AutonomousDecisionOrchestrator,
    logger: Logger,
  ) {
    this.basicOrchestrator = basicOrchestrator;
    this.autonomousOrchestrator = autonomousOrchestrator;
    this.logger = logger;

    this.logger.info('UnifiedDecisionOrchestrator initialized', {
      pipelines: ['basic', 'autonomous', 'hybrid'],
    });
  }

  /**
   * Execute decision com seleção de pipeline
   */
  async executeDecision(
    request: DecisionRequest,
    userId: string,
    mode: 'basic' | 'autonomous' | 'hybrid' = 'autonomous',
  ): Promise<DecisionOutput & { orchestration_metadata?: Record<string, any> }> {
    const start = Date.now();

    this.logger.info('Unified decision execution', {
      type: request.type,
      criticality: request.criticality,
      mode,
      user: userId,
    });

    try {
      if (mode === 'basic') {
        return await this.basicOrchestrator.executeDecision(request);
      }

      if (mode === 'autonomous') {
        const flow = await this.autonomousOrchestrator.executeAutonomous(
          request.type,
          request.context,
          request.criticality,
          userId,
        );

        return {
          ...flow.finalDecision,
          orchestration_metadata: {
            pipeline: 'autonomous',
            executionRecommended: flow.executionRecommended,
            requiredApprovals: flow.requiredApprovals,
            steps: {
              multiStrategy: flow.step1_MultiStrategy,
              validation: flow.step2_Validation,
              riskAssessment: flow.step3_RiskAssessment,
              healthCheck: flow.step4_HealthCheck,
              audit: flow.step5_Audit,
            },
            execution_time_ms: Date.now() - start,
          },
        };
      }

      if (mode === 'hybrid') {
        // Execute basic first, then enhance with autonomous validation
        const basicDecision = await this.basicOrchestrator.executeDecision(request);

        const autonomousFlow = await this.autonomousOrchestrator.executeAutonomous(
          request.type,
          request.context,
          request.criticality,
          userId,
        );

        // Merge results: keep basic decision but enhance with autonomous metadata
        return {
          ...basicDecision,
          orchestration_metadata: {
            pipeline: 'hybrid',
            basic_decision_id: basicDecision.metadata.analysisId,
            autonomous_validation: autonomousFlow.step2_Validation,
            autonomous_risk_assessment: autonomousFlow.step3_RiskAssessment,
            autonomous_health_check: autonomousFlow.step4_HealthCheck,
            execution_time_ms: Date.now() - start,
            warning:
              'Hybrid mode: basic decision returned; autonomous validation available in metadata',
          },
        };
      }

      throw new Error(`Unknown orchestration mode: ${mode}`);
    } catch (error) {
      this.logger.error('Unified decision execution failed', {
        error: error instanceof Error ? error.message : 'unknown',
        mode,
      });
      throw error;
    }
  }

  /**
   * Process feedback na pipeline autônoma
   */
  async processFeedback(feedback: FeedbackSignal, previousDecision: any): Promise<void> {
    await this.autonomousOrchestrator.processFeedbackAndEvolve(feedback, previousDecision);
  }

  /**
   * Get orchestration status and metrics
   */
  async getOrchestrationStatus(days: number = 30): Promise<{
    basic_pipeline: {
      status: 'available' | 'degraded' | 'unavailable';
      metrics: Record<string, any>;
    };
    autonomous_pipeline: {
      status: 'available' | 'degraded' | 'unavailable';
      metrics: Record<string, any>;
    };
    recommendation: string;
  }> {
    try {
      const autonomousMetrics = await this.autonomousOrchestrator.generateAutonomyReport(days);

      return {
        basic_pipeline: {
          status: 'available',
          metrics: {
            description: 'Original pipeline with privacy, routing, and agent execution',
          },
        },
        autonomous_pipeline: {
          status: autonomousMetrics.systemHealth === 'excellent' ? 'available' : 'degraded',
          metrics: {
            auto_execution_rate: autonomousMetrics.autoExecutionRate,
            avg_quality: autonomousMetrics.avgQuality,
            system_health: autonomousMetrics.systemHealth,
            drift_status: autonomousMetrics.drift,
          },
        },
        recommendation:
          autonomousMetrics.autoExecutionRate > 0.75
            ? 'Autonomous pipeline is stable and performing well - suitable for production'
            : 'Monitor autonomous pipeline - consider gradual rollout with A/B testing',
      };
    } catch (error) {
      this.logger.error('Failed to get orchestration status', {
        error: error instanceof Error ? error.message : 'unknown',
      });
      throw error;
    }
  }
}
