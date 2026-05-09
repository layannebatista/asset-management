import { Router, Request, Response } from 'express';
import { Logger } from 'winston';
import { DecisionEngineOrchestrator } from '../../orchestrator/DecisionEngineOrchestrator';
import { DecisionRequest, FeedbackSignal } from '../../types/DecisionOutput';

function toSingleString(value: unknown): string {
  if (Array.isArray(value)) return String(value[0] ?? '');
  return String(value ?? '');
}

export function createDecisionEngineRouter(
  orchestrator: DecisionEngineOrchestrator,
  logger: Logger
): Router {
  const router = Router();

  // POST /api/v1/decision → ExecuteDecision
  router.post('/', async (req: Request, res: Response) => {
    try {
      const request: DecisionRequest = {
        type: req.body.type,
        criticality: req.body.criticality || 'NORMAL',
        context: req.body.context,
        privacy_level: req.body.privacy_level || 'PUBLIC',
        min_quality_threshold: req.body.min_quality_threshold || 0.7,
        request_id: req.headers['x-request-id'] as string,
      };

      const decision = await orchestrator.executeDecision(request);
      res.json(decision);
    } catch (error) {
      logger.error('Decision request failed', { error });
      res.status(500).json({ error: String(error) });
    }
  });

  // POST /api/v1/decision/:id/feedback → ProcessFeedback
  router.post('/:id/feedback', async (req: Request, res: Response) => {
    try {
      const feedback: FeedbackSignal = {
        decision_id: toSingleString(req.params.id),
        feedback_type: req.body.feedback_type,
        user_id: req.body.user_id,
        actual_outcome: req.body.actual_outcome,
        notes: req.body.notes,
        timestamp: new Date(),
      };

      await orchestrator.processFeedback(toSingleString(req.params.id), feedback);
      res.json({ success: true, message: 'Feedback processed' });
    } catch (error) {
      logger.error('Feedback processing failed', { error });
      res.status(500).json({ error: String(error) });
    }
  });

  // GET /api/v1/decision/metrics → GetMetrics
  router.get('/metrics', (req: Request, res: Response) => {
    try {
      const metrics = orchestrator.getMetrics();
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  return router;
}
