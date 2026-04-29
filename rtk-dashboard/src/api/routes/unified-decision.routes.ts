import { Router, Request, Response } from 'express';
import { Logger } from 'winston';
import { Pool } from 'pg';
import { Redis } from 'ioredis';

import { UnifiedDecisionOrchestrator } from '../../orchestrator/UnifiedDecisionOrchestrator';
import { DecisionEngineOrchestrator } from '../../orchestrator/DecisionEngineOrchestrator';
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
 * Unified Decision Routes
 * Supports basic, autonomous, and hybrid modes with A/B testing infrastructure
 */
export function createUnifiedDecisionRouter(
  pgPool: Pool,
  redis: Redis,
  logger: Logger,
  basicOrchestrator: DecisionEngineOrchestrator,
  learningEngine: LearningEngineOrchestrator,
  historicalTracker: HistoricalSuccessTracker,
): Router {
  const router = Router();

  // Initialize orchestrators
  const autonomousOrchestrator = new AutonomousDecisionOrchestrator(
    pgPool,
    redis,
    logger,
    learningEngine,
    historicalTracker,
  );

  const unifiedOrchestrator = new UnifiedDecisionOrchestrator(
    basicOrchestrator,
    autonomousOrchestrator,
    logger,
  );

  // A/B testing configuration
  const AB_TEST_CONFIG = {
    enabled: process.env.AB_TEST_ENABLED === 'true',
    autonomousPercentage: parseInt(process.env.AB_TEST_AUTONOMOUS_PERCENTAGE || '50', 10),
    trackingKey: 'ab_test_decision_mode',
  };

  /**
   * POST /api/v1/decision
   * Unified decision endpoint with A/B testing support
   */
  router.post('/', async (req: Request, res: Response) => {
    try {
      const request: DecisionRequest = {
        type: toDecisionType(req.body.type),
        criticality: (req.body.criticality || 'NORMAL') as any,
        context: req.body.context,
        privacy_level: (req.body.privacy_level || 'PUBLIC') as any,
        min_quality_threshold: req.body.min_quality_threshold || 0.7,
        request_id: req.headers['x-request-id'] as string,
      };

      const userId = (req.headers['x-user-id'] as string) || 'anonymous';

      // Determine execution mode
      let mode: 'basic' | 'autonomous' | 'hybrid' = 'autonomous';

      // Allow explicit mode override via query parameter
      if (req.query.mode === 'basic' || req.query.mode === 'hybrid') {
        mode = req.query.mode as any;
      } else if (AB_TEST_CONFIG.enabled) {
        // A/B test: randomly assign autonomous or basic based on percentage
        const random = Math.random() * 100;
        mode = random < AB_TEST_CONFIG.autonomousPercentage ? 'autonomous' : 'basic';

        // Store A/B test assignment for tracking
        req.headers[AB_TEST_CONFIG.trackingKey] = mode;
      }

      logger.info('Unified decision request', {
        request_id: request.request_id,
        type: request.type,
        criticality: request.criticality,
        user: userId,
        mode,
        ab_test_enabled: AB_TEST_CONFIG.enabled,
      });

      // Execute decision with selected mode
      const decision = await unifiedOrchestrator.executeDecision(request, userId, mode);

      const response = {
        ...decision,
        orchestration: {
          mode,
          ab_test: AB_TEST_CONFIG.enabled
            ? {
                enabled: true,
                autonomous_percentage: AB_TEST_CONFIG.autonomousPercentage,
                assigned_mode: mode,
              }
            : undefined,
        },
      };

      logger.info('Decision completed', {
        request_id: request.request_id,
        mode,
        quality: decision.metrics.quality_score,
      });

      res.json(response);
    } catch (error) {
      logger.error('Unified decision request failed', {
        error: error instanceof Error ? error.message : 'unknown',
      });
      res.status(500).json({
        error: 'Decision execution failed',
        message: error instanceof Error ? error.message : 'unknown error',
      });
    }
  });

  /**
   * POST /api/v1/decision/:id/feedback
   * Process feedback in autonomous pipeline
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
        type: feedback.feedback_type,
      });

      const previousDecision = {
        metadata: { analysisId: feedback.decision_id },
      };

      await unifiedOrchestrator.processFeedback(feedback, previousDecision);

      res.json({
        success: true,
        message: 'Feedback processed',
        decision_id: feedback.decision_id,
      });
    } catch (error) {
      logger.error('Feedback processing failed', {
        error: error instanceof Error ? error.message : 'unknown',
      });
      res.status(500).json({
        error: 'Feedback processing failed',
        message: error instanceof Error ? error.message : 'unknown error',
      });
    }
  });

  /**
   * GET /api/v1/decision/metrics
   * Get unified metrics for both pipelines
   */
  router.get('/metrics', async (req: Request, res: Response) => {
    try {
      const days = parseInt(req.query.days as string) || 30;

      const orchestrationStatus = await unifiedOrchestrator.getOrchestrationStatus(days);

      const metrics = {
        period: {
          days,
          startDate: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
          endDate: new Date(),
        },
        orchestration: orchestrationStatus,
        ab_test: AB_TEST_CONFIG.enabled
          ? {
              enabled: true,
              autonomous_percentage: AB_TEST_CONFIG.autonomousPercentage,
              note: 'Metrics above show both pipelines; autonomous % affects routing',
            }
          : {
              enabled: false,
              note: 'Only autonomous pipeline is being used',
            },
      };

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
   * GET /api/v1/decision/status
   * Get orchestration status and recommendation
   */
  router.get('/status', async (req: Request, res: Response) => {
    try {
      const orchestrationStatus = await unifiedOrchestrator.getOrchestrationStatus();

      res.json({
        status: 'operational',
        orchestration: orchestrationStatus,
        ab_test: {
          enabled: AB_TEST_CONFIG.enabled,
          configuration: AB_TEST_CONFIG.enabled
            ? {
                autonomous_percentage: AB_TEST_CONFIG.autonomousPercentage,
                basic_percentage: 100 - AB_TEST_CONFIG.autonomousPercentage,
              }
            : null,
        },
      });
    } catch (error) {
      logger.error('Status check failed', {
        error: error instanceof Error ? error.message : 'unknown',
      });
      res.status(500).json({
        error: 'Status check failed',
        message: error instanceof Error ? error.message : 'unknown error',
      });
    }
  });

  return router;
}
