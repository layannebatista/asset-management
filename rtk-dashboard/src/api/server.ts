import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import path from 'path';

import { RtkLocalDataSource } from '../observability/RtkLocalDataSource';
import { logger } from './logger';
import { errorHandler } from './middleware/errorHandler';
import { requireApiKey } from './middleware/auth';
import healthRouter from './routes/health.routes';
import { createInsightsRouter } from './routes/insights.routes';
import { createAnalysisRouter } from './routes/analysis.routes';
import { AIOrchestrator } from '../orchestrator/AIOrchestrator';
import { AgentCoordinator } from '../agents/AgentCoordinator';
import { LLMClient } from '../llm/LLMClient';
import { AnalysisRepository } from '../storage/AnalysisRepository';
import { PrometheusCollector } from '../collectors/PrometheusCollector';
import { AllureCollector } from '../collectors/AllureCollector';
import { GitHubActionsCollector } from '../collectors/GitHubActionsCollector';
import { BackendDataCollector } from '../collectors/BackendDataCollector';

async function bootstrap(): Promise<void> {
  const app = express();
  logger.info('Setting up RTK Dashboard service...');

  app.use(helmet());
  app.use(cors({ origin: true }));
  app.use(express.json({ limit: '2mb' }));

  app.get('/', (_req, res) => {
    res.sendFile(path.join(__dirname, '../../public/index.html'));
  });

  app.use(express.static(path.join(__dirname, '../../public')));
  app.use('/', healthRouter);

  const rtkDataSource = new RtkLocalDataSource(logger);
  logger.info('RTK local data source configured', rtkDataSource.getStatus());

  app.use(
    '/api/v1/insights',
    requireApiKey,
    createInsightsRouter(rtkDataSource, logger),
  );

  // Initialize dependencies for orchestrator and agents
  const repository = new AnalysisRepository();
  const orchestrator = new AIOrchestrator(repository);
  
  const llm = new LLMClient();
  const prometheus = new PrometheusCollector();
  const allure = new AllureCollector();
  const github = new GitHubActionsCollector();
  const backend = new BackendDataCollector();
  const agentCoordinator = new AgentCoordinator(llm, repository, prometheus, allure, github, backend);

  // Analysis routes (for running real analyses)
  app.use(
    '/api/v1/analysis',
    requireApiKey,
    createAnalysisRouter(orchestrator, agentCoordinator),
  );

  logger.info('API routes initialized', {
    routes: ['/api/v1/insights', '/api/v1/analysis'],
  });

  app.use(errorHandler);

  const port = parseInt(process.env.AI_SERVICE_PORT ?? '3100', 10);
  logger.info('Starting RTK Dashboard service', { port });
  const server = app.listen(port, () => {
    logger.info('RTK Dashboard Service started', {
      port,
      env: process.env.NODE_ENV ?? 'development',
    });
  });

  server.on('error', (err) => {
    logger.error('Server error', { error: err.message });
  });

  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`${signal} received - shutting down gracefully`);
    server.close(() => {
      logger.info('All connections closed');
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((error) => {
  logger.error('Failed to start RTK Dashboard Service', {
    error: error instanceof Error ? error.message : 'unknown',
  });
  process.exit(1);
});
