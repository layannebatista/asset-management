/**
 * Enterprise Analysis routes: Integration point with API Gateway
 *
 * All requests flow through AIGateway for:
 * - quota management
 * - security classification
 * - model routing
 * - cache lookup
 * - memory augmentation
 */

import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from 'winston';

import { AIGateway } from '../../gateway/AIGateway';
import {
  EnterpriseAnalysisRequest,
  GatewayRequest,
  AnalysisType,
  Criticality,
} from '../../types/enterprise.types';

export function createEnterpriseAnalysisRoutes(gateway: AIGateway, logger: Logger): Router {
  const router = Router();

  /**
   * POST /api/v1/analysis
   *
   * Request body:
   * {
   *   "type": "incident" | "risk" | "observability" | "test-intelligence" | "cicd",
   *   "query": "What happened?",
   *   "context": [{ "data": {...}, "score": 0.8 }],
   *   "criticality": "low" | "normal" | "high" | "critical"
   * }
   *
   * Response:
   * {
   *   "data": {
   *     "id": "...",
   *     "keyPoints": [...],
   *     "recommendations": [...],
   *     "qualityScore": 0.88,
   *     "modelUsed": "gpt-4o",
   *     "costUsd": 0.08,
   *     "durationMs": 2500
   *   },
   *   "quota": {
   *     "remaining": 95,
   *     "budgetRemaining": 48.5,
   *     "throttled": false
   *   },
   *   "cached": false,
   *   "correlationId": "..."
   * }
   */
  router.post('/analysis', async (req: Request, res: Response, next: NextFunction) => {
    const correlationId = uuidv4();
    const startTime = Date.now();

    try {
      // ── Validate request body
      const { type, query, context, criticality } = req.body;

      if (!type || !Object.values(AnalysisType).includes(type)) {
        return res.status(400).json({ error: 'Invalid analysis type' });
      }

      if (!query || typeof query !== 'string' || query.trim().length === 0) {
        return res.status(400).json({ error: 'Query is required and must be non-empty' });
      }

      // ── Extract authentication
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing or invalid authorization header' });
      }

      const apiKey = authHeader.slice(7);
      const userId = (req as any).user?.id || 'anonymous';

      // ── Build gateway request
      const analysisRequest: EnterpriseAnalysisRequest = {
        id: uuidv4(),
        type,
        query,
        context: context || [],
        criticality: criticality as Criticality | undefined,
        userTier: (req as any).user?.tier || 'free',
        metadata: {
          clientIp: req.ip,
          userAgent: req.get('user-agent'),
        },
        timestamp: new Date(),
      };

      const gatewayRequest: GatewayRequest = {
        analysisRequest,
        userId,
        apiKey,
        correlationId,
      };

      logger.info('Analysis request received', {
        correlationId,
        userId,
        type,
        contextSize: context?.length || 0,
      });

      // ── Process through gateway
      const response = await gateway.process(gatewayRequest);

      // ── Return result
      return res.status(200).json({
        data: response.result,
        quota: response.quota,
        cached: response.cached,
        correlationId,
        processingTimeMs: Date.now() - startTime,
      });

    } catch (error) {
      logger.error('Analysis request failed', {
        correlationId,
        error,
        durationMs: Date.now() - startTime,
      });

      if (error instanceof Error) {
        if (error.message.includes('Quota exceeded')) {
          return res.status(429).json({
            error: error.message,
            correlationId,
          });
        }

        if (error.message.includes('Unauthorized')) {
          return res.status(401).json({
            error: error.message,
            correlationId,
          });
        }

        if (error.message.includes('Invalid request')) {
          return res.status(400).json({
            error: error.message,
            correlationId,
          });
        }
      }

      return res.status(500).json({
        error: 'Internal server error',
        correlationId,
      });
    }
  });

  /**
   * POST /api/v1/analysis/batch
   *
   * Submit multiple analyses for parallel processing
   */
  router.post('/analysis/batch', async (req: Request, res: Response) => {
    try {
      const { analyses } = req.body;

      if (!Array.isArray(analyses) || analyses.length === 0) {
        return res.status(400).json({ error: 'Batch must contain at least one analysis' });
      }

      if (analyses.length > 10) {
        return res.status(400).json({ error: 'Batch limit is 10 analyses' });
      }

      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing or invalid authorization header' });
      }

      const apiKey = authHeader.slice(7);
      const userId = (req as any).user?.id || 'anonymous';
      const correlationId = uuidv4();

      // Execute in parallel
      const results = await Promise.all(
        analyses.map((analysis, index) => {
          const request: EnterpriseAnalysisRequest = {
            id: uuidv4(),
            type: analysis.type,
            query: analysis.query,
            context: analysis.context || [],
            timestamp: new Date(),
          };

          return gateway.process({
            analysisRequest: request,
            userId,
            apiKey,
            correlationId: `${correlationId}-${index}`,
          });
        }),
      );

      return res.status(200).json({
        data: results.map((r) => r.result),
        correlationId,
        count: results.length,
      });

    } catch (error) {
      logger.error('Batch analysis failed', { error });
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  /**
   * GET /api/v1/quota
   *
   * Check current quota usage
   */
  router.get('/quota', async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id || 'anonymous';
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing or invalid authorization header' });
      }

      // Implementation would check redis quota
      return res.status(200).json({
        quota: {
          dailyRequests: {
            limit: 100,
            remaining: 95,
          },
          monthlyBudget: {
            limitUsd: 50,
            remainingUsd: 48.5,
          },
          throttled: false,
          resetsAt: new Date(Date.now() + 86400000).toISOString(),
        },
      });

    } catch (error) {
      logger.error('Failed to check quota', { error });
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
}

/**
 * Middleware: Authentication
 */
export function authMiddleware(redis: any, logger: Logger) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    try {
      const apiKey = authHeader.slice(7);
      const cached = await redis.get(`apikey:${apiKey}`);

      if (!cached) {
        return res.status(401).json({ error: 'Invalid API key' });
      }

      const user = JSON.parse(cached);

      if (new Date(user.expiresAt) < new Date()) {
        return res.status(401).json({ error: 'API key expired' });
      }

      (req as any).user = user;
      next();

    } catch (error) {
      logger.error('Auth middleware failed', { error });
      return res.status(401).json({ error: 'Unauthorized' });
    }
  };
}
