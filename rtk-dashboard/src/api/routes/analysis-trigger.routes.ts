import { Router, Request, Response } from 'express';
import { AIOrchestrator } from '../../orchestrator/AIOrchestrator';
import { Logger } from 'winston';

export function createAnalysisTriggerRouter(
  orchestrator: AIOrchestrator,
  logger: Logger,
): Router {
  const router = Router();

  router.post('/run-all', async (req: Request, res: Response) => {
    try {
      logger.info('Analysis trigger: run-all initiated');

      const results = await Promise.all([
        orchestrator.analyze({ type: 'observability', windowMinutes: 30 }),
        orchestrator.analyze({ type: 'test-intelligence', projectId: 'default' }),
        orchestrator.analyze({ type: 'cicd', lookbackDays: 7 }),
        orchestrator.analyze({ type: 'incident', logs: [] }),
        orchestrator.analyze({ type: 'risk' }),
      ]);

      logger.info('All analyses completed', { count: results.length });

      res.json({
        success: true,
        message: 'All analyses completed',
        results: results.map((r) => ({
          id: r.metadata.analysisId,
          type: r.metadata.type,
          status: r.metadata.status,
          durationMs: r.metadata.durationMs,
        })),
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Analysis trigger error', {
        error: error instanceof Error ? error.message : 'unknown',
      });

      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  router.get('/status', async (req: Request, res: Response) => {
    try {
      const limit = parseInt(String(req.query.limit ?? 5), 10);
      const recentAnalyses = await orchestrator.getHistory(undefined, limit);

      res.json({
        success: true,
        analyses: recentAnalyses.map((a) => ({
          id: a.metadata.analysisId,
          type: a.metadata.type,
          status: a.metadata.status,
          model: a.metadata.model,
          tokensUsed: a.metadata.tokensUsed,
          durationMs: a.metadata.durationMs,
          createdAt: a.metadata.createdAt,
        })),
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Status check error', {
        error: error instanceof Error ? error.message : 'unknown',
      });

      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  return router;
}
