import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

import { config } from '../config';
import { logger } from './logger';
import { requireApiKey } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';
import healthRouter from './routes/health.routes';
import { createAnalysisRouter } from './routes/analysis.routes';
import { AnalysisRepository } from '../storage/AnalysisRepository';
import { AIOrchestrator } from '../orchestrator/AIOrchestrator';
import { AgentCoordinator } from '../agents/AgentCoordinator';
import { LLMClient } from '../llm/LLMClient';
import { PrometheusCollector } from '../collectors/PrometheusCollector';
import { AllureCollector } from '../collectors/AllureCollector';
import { GitHubActionsCollector } from '../collectors/GitHubActionsCollector';
import { BackendDataCollector } from '../collectors/BackendDataCollector';

async function bootstrap(): Promise<void> {
  // ─── Infrastructure ────────────────────────────────────────────────────────
  const repository = new AnalysisRepository();
  await repository.initialize();

  // ─── Shared dependencies ───────────────────────────────────────────────────
  const llm = new LLMClient();
  const prometheus = new PrometheusCollector();
  const allure = new AllureCollector();
  const github = new GitHubActionsCollector();
  const backend = new BackendDataCollector();

  // ─── Application layer ─────────────────────────────────────────────────────
  const orchestrator = new AIOrchestrator(repository);
  const agentCoordinator = new AgentCoordinator(llm, repository, prometheus, allure, github, backend);

  // ─── Express app ───────────────────────────────────────────────────────────
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: config.service.nodeEnv === 'development' ? '*' : false }));
  app.use(express.json({ limit: '2mb' }));

  // Health endpoints (no auth)
  app.use('/', healthRouter);

  // Rate limiting for AI endpoints
  const limiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please slow down.' },
  });

  // Protected AI analysis routes
  app.use('/api/v1/analysis', limiter, requireApiKey, createAnalysisRouter(orchestrator, agentCoordinator));

  // Global error handler
  app.use(errorHandler);

  // ─── Start ──────────────────────────────────────────────────────────────────
  const server = app.listen(config.service.port, () => {
    logger.info(`AI Intelligence Service started`, {
      port: config.service.port,
      env: config.service.nodeEnv,
      model: config.openai.model,
    });
  });

  // Graceful shutdown
  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`${signal} received – shutting down gracefully`);
    server.close(async () => {
      await repository.close();
      logger.info('Server closed');
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((error) => {
  console.error('Failed to start AI Intelligence Service:', error);
  process.exit(1);
});
