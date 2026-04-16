import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AIOrchestrator } from '../../orchestrator/AIOrchestrator';
import { AgentCoordinator } from '../../agents/AgentCoordinator';
import { AnalysisType } from '../../types/analysis.types';
import { logger } from '../logger';

// ─── Request schemas ──────────────────────────────────────────────────────────

const ObservabilitySchema = z.object({
  windowMinutes: z.number().int().min(5).max(1440).optional(),
});

const TestIntelligenceSchema = z.object({
  projectId: z.string().optional(),
  suite: z.enum(['backend', 'frontend', 'all']).optional(),
});

const CICDSchema = z.object({
  workflowFile: z.string().optional(),
  lookbackDays: z.number().int().min(1).max(30).optional(),
});

const IncidentSchema = z.object({
  logs: z.array(z.string()).min(1).max(200),
  errorMessages: z.array(z.string()).max(50).optional(),
  timeWindowMinutes: z.number().int().min(1).max(1440).optional(),
});

const RiskSchema = z.object({
  domains: z
    .array(z.enum(['asset', 'transfer', 'maintenance', 'depreciation', 'insurance', 'inventory']))
    .optional(),
  assetIds: z.array(z.string().uuid()).max(10).optional(),
});

function getSingleQueryParam(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

// ─── Route factory ────────────────────────────────────────────────────────────

export function createAnalysisRouter(orchestrator: AIOrchestrator, agentCoordinator: AgentCoordinator): Router {
  const router = Router();

  // POST /api/v1/analysis/observability
  router.post('/observability', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = ObservabilitySchema.parse(req.body);
      logger.info('POST /analysis/observability', body);
      const result = await orchestrator.analyze({ type: 'observability', ...body });
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  // POST /api/v1/analysis/test-intelligence
  router.post('/test-intelligence', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = TestIntelligenceSchema.parse(req.body);
      const result = await orchestrator.analyze({ type: 'test-intelligence', ...body });
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  // POST /api/v1/analysis/cicd
  router.post('/cicd', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = CICDSchema.parse(req.body);
      const result = await orchestrator.analyze({ type: 'cicd', ...body });
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  // POST /api/v1/analysis/incident
  router.post('/incident', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = IncidentSchema.parse(req.body);
      const result = await orchestrator.analyze({ type: 'incident', ...body });
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  // POST /api/v1/analysis/risk
  router.post('/risk', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = RiskSchema.parse(req.body);
      const result = await orchestrator.analyze({ type: 'risk', ...body });
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  // POST /api/v1/analysis/multi-agent
  router.post('/multi-agent', async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await agentCoordinator.runAll();
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  // GET /api/v1/analysis/history?type=observability&limit=10
  router.get('/history', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const typeParam = getSingleQueryParam(req.query['type']);
      const type = typeParam as AnalysisType | undefined;
      const limitParam = getSingleQueryParam(req.query['limit']);
      const limit = Math.min(parseInt(limitParam ?? '20', 10), 100);
      const results = await orchestrator.getHistory(type, limit);
      res.json({ data: results, total: results.length });
    } catch (error) {
      next(error);
    }
  });

  // GET /api/v1/analysis/:id
  router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = getSingleQueryParam(req.params['id']);
      if (!id) {
        res.status(400).json({ error: 'Analysis id is required' });
        return;
      }
      const result = await orchestrator.getById(id);
      if (!result) {
        res.status(404).json({ error: 'Analysis not found' });
        return;
      }
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
