import { Router, Request, Response } from 'express';
import { Logger } from 'winston';
import { Pool } from 'pg';
import { Redis } from 'ioredis';

import { AutonomousDecisionOrchestrator } from '../../autonomous/AutonomousDecisionOrchestrator';
import { LearningEngineOrchestrator } from '../../learning/LearningEngineOrchestrator';
import { HistoricalSuccessTracker } from '../../learning/HistoricalSuccessTracker';
import { DecisionRequest, FeedbackSignal } from '../../types/DecisionOutput';

function toSingleString(value: unknown): string {
  if (Array.isArray(value)) return String(value[0] ?? '');
  return String(value ?? '');
}

function toDecisionType(value: unknown): DecisionRequest['type'] {
  const raw = toSingleString(value);
  if (raw === 'observability' || raw === 'test-intelligence' || raw === 'cicd' || raw === 'incident' || raw === 'risk') {
    return raw;
  }
  return 'observability';
}

/**
 * Autonomous Decision Routes
 * Integrates AutonomousDecisionOrchestrator with learning and governance capabilities
 */
export function createAutonomousDecisionRouter(
  pgPool: Pool,
  redis: Redis,
  logger: Logger,
  learningEngine: LearningEngineOrchestrator,
  historicalTracker: HistoricalSuccessTracker,
): Router {
  const router = Router();

  // Initialize autonomous orchestrator
  const autonomousOrchestrator = new AutonomousDecisionOrchestrator(
    pgPool,
    redis,
    logger,
    learningEngine,
    historicalTracker,
  );

  /**
   * POST /api/v1/decision
   * Execute autonomous decision pipeline with full validation, risk assessment, and governance
   */
  router.post('/', async (req: Request, res: Response) => {
    try {
      const request: DecisionRequest = {
        type: toDecisionType(req.body.type),
        criticality: (req.body.criticality || 'NORMAL') as 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL',
        context: req.body.context,
        privacy_level: (req.body.privacy_level || 'PUBLIC') as any,
        min_quality_threshold: req.body.min_quality_threshold || 0.7,
        request_id: req.headers['x-request-id'] as string,
      };

      const userId = (req.headers['x-user-id'] as string) || 'anonymous';

      logger.info('Autonomous decision request received', {
        request_id: request.request_id,
        type: request.type,
        criticality: request.criticality,
        user: userId,
      });

      // Execute autonomous pipeline
      const flow = await autonomousOrchestrator.executeAutonomous(
        request.type,
        request.context,
        request.criticality,
        userId,
      );

      // Prepare response
      const response = {
        decision: flow.finalDecision.decision,
        metrics: flow.finalDecision.metrics,
        metadata: flow.finalDecision.metadata,
        tracing: flow.finalDecision.tracing,
        autonomy: {
          executionRecommended: flow.executionRecommended,
          requiredApprovals: flow.requiredApprovals,
          pipeline: {
            multiStrategy: flow.step1_MultiStrategy,
            validation: flow.step2_Validation,
            riskAssessment: flow.step3_RiskAssessment,
            healthCheck: flow.step4_HealthCheck,
            audit: flow.step5_Audit,
          },
        },
        feedback_eligible: flow.finalDecision.feedback_eligible,
      };

      logger.info('Autonomous decision pipeline completed', {
        request_id: request.request_id,
        executionRecommended: flow.executionRecommended,
        approvals: flow.requiredApprovals.length,
      });

      res.json(response);
    } catch (error) {
      logger.error('Autonomous decision request failed', {
        error: error instanceof Error ? error.message : 'unknown',
        stack: error instanceof Error ? error.stack : undefined,
      });
      res.status(500).json({
        error: 'Autonomous decision failed',
        message: error instanceof Error ? error.message : 'unknown error',
      });
    }
  });

  /**
   * POST /api/v1/decision/:id/feedback
   * Process feedback and trigger learning loop
   */
  router.post('/:id/feedback', async (req: Request, res: Response) => {
    try {
      const feedback: FeedbackSignal = {
        decision_id: toSingleString(req.params.id),
        feedback_type: req.body.feedback_type as 'positive' | 'negative' | 'partial',
        user_id: (req.headers['x-user-id'] as string) || 'anonymous',
        actual_outcome: req.body.actual_outcome,
        notes: req.body.notes,
        timestamp: new Date(),
      };

      logger.info('Feedback received', {
        decision_id: feedback.decision_id,
        feedback_type: feedback.feedback_type,
        user: feedback.user_id,
      });

      // Process feedback and trigger learning
      // TODO: Get previous decision from database and pass to processFeedbackAndEvolve
      // For now, create a placeholder
      const previousDecision = {
        metadata: { analysisId: feedback.decision_id },
      };

      await autonomousOrchestrator.processFeedbackAndEvolve(feedback, previousDecision);

      logger.info('Feedback processed and learning triggered', {
        decision_id: feedback.decision_id,
      });

      res.json({
        success: true,
        message: 'Feedback processed',
        decision_id: feedback.decision_id,
      });
    } catch (error) {
      logger.error('Feedback processing failed', {
        error: error instanceof Error ? error.message : 'unknown',
        decision_id: req.params.id,
      });
      res.status(500).json({
        error: 'Feedback processing failed',
        message: error instanceof Error ? error.message : 'unknown error',
      });
    }
  });

  /**
   * GET /api/v1/decision/metrics
   * Return autonomous decision engine metrics and health status
   */
  router.get('/metrics', async (req: Request, res: Response) => {
    try {
      const days = parseInt(req.query.days as string) || 30;

      logger.info('Metrics request', { days });

      // Get autonomy report
      const autonomyReport = await autonomousOrchestrator.generateAutonomyReport(days);

      // Get drift history (pass days as parameter)
      const driftDetector = autonomousOrchestrator.getComponents().driftDetector;
      const driftHistory = await driftDetector.getDriftHistory(days);

      // Format comprehensive metrics response
      const metrics = {
        autonomy: {
          totalDecisions: autonomyReport.autonomousDecisions,
          autoExecutionRate: autonomyReport.autoExecutionRate,
          approvalRate: autonomyReport.approvalRate,
          avgQuality: autonomyReport.avgQuality,
          systemHealth: autonomyReport.systemHealth,
          riskProfile: autonomyReport.riskProfile,
          drift: autonomyReport.drift,
        },
        trends: {
          driftHistory,
        },
        period: {
          days,
          startDate: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
          endDate: new Date(),
        },
      };

      logger.debug('Metrics generated', {
        autoExecutionRate: autonomyReport.autoExecutionRate,
        systemHealth: autonomyReport.systemHealth,
      });

      res.json(metrics);
    } catch (error) {
      logger.error('Metrics retrieval failed', {
        error: error instanceof Error ? error.message : 'unknown',
      });
      res.status(500).json({
        error: 'Metrics retrieval failed',
        message: error instanceof Error ? error.message : 'unknown error',
      });
    }
  });

  /**
   * GET /api/v1/decision/audit/:id
   * Retrieve complete audit trail for a decision
   */
  router.get('/audit/:id', async (req: Request, res: Response) => {
    try {
      const auditLayer = autonomousOrchestrator.getComponents().auditLayer;
      const auditTrail = await auditLayer.getAuditTrail(toSingleString(req.params.id));

      if (!auditTrail) {
        return res.status(404).json({
          error: 'Decision not found',
          decision_id: req.params.id,
        });
      }

      logger.info('Audit trail retrieved', {
        decision_id: req.params.id,
      });

      res.json(auditTrail);
    } catch (error) {
      logger.error('Audit trail retrieval failed', {
        error: error instanceof Error ? error.message : 'unknown',
        decision_id: req.params.id,
      });
      res.status(500).json({
        error: 'Audit trail retrieval failed',
        message: error instanceof Error ? error.message : 'unknown error',
      });
    }
  });

  /**
   * GET /api/v1/decision/compliance
   * Generate compliance report for governance
   */
  router.get('/compliance', async (req: Request, res: Response) => {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

      const auditLayer = autonomousOrchestrator.getComponents().auditLayer;
      const complianceReport = await auditLayer.generateComplianceReport(startDate, endDate);

      logger.info('Compliance report generated', {
        period: `${days} days`,
        status: complianceReport.complianceStatus,
      });

      res.json(complianceReport);
    } catch (error) {
      logger.error('Compliance report generation failed', {
        error: error instanceof Error ? error.message : 'unknown',
      });
      res.status(500).json({
        error: 'Compliance report generation failed',
        message: error instanceof Error ? error.message : 'unknown error',
      });
    }
  });

  return router;
}
