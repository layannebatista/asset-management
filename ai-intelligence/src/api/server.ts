import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { Pool } from 'pg';
import Redis from 'ioredis';
import path from 'path';

import { config } from '../config';
import { logger } from './logger';
import { requireApiKey } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';
import healthRouter from './routes/health.routes';
import { createAnalysisRouter } from './routes/analysis.routes';
import { createAutonomousDecisionRouter } from './routes/autonomous-decision.routes';
import { createUnifiedDecisionRouter } from './routes/unified-decision.routes';
import { AnalysisRepository } from '../storage/AnalysisRepository';
import { AIOrchestrator } from '../orchestrator/AIOrchestrator';
import { AgentCoordinator } from '../agents/AgentCoordinator';
import { LLMClient } from '../llm/LLMClient';
import { PrometheusCollector } from '../collectors/PrometheusCollector';
import { AllureCollector } from '../collectors/AllureCollector';
import { GitHubActionsCollector } from '../collectors/GitHubActionsCollector';
import { BackendDataCollector } from '../collectors/BackendDataCollector';
import { LearningEngineOrchestrator } from '../learning/LearningEngineOrchestrator';
import { HistoricalSuccessTracker } from '../learning/HistoricalSuccessTracker';
import { DecisionEngineOrchestrator } from '../orchestrator/DecisionEngineOrchestrator';
import { PrivacyClassifier } from '../privacy/PrivacyClassifier';
import { ModelRouter } from '../routing/ModelRouter';
import { FeedbackProcessor } from '../feedback/FeedbackProcessor';
import { AIMetricsCollector } from '../observability/AIMetricsCollector';
import { TokenSavingsAnalyzer } from '../observability/TokenSavingsAnalyzer';
import { DashboardAggregator } from '../observability/DashboardAggregator';
import { AgentGraphExecutor } from '../agents/AgentGraphExecutor';
import { createMetricsRouter } from './routes/metrics.routes';
import { createInsightsRouter } from './routes/insights.routes';

function optional(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

async function bootstrap(): Promise<void> {
  // ─── Create Express app first (always needed for dashboard) ─────────────────
  const app = express();
  logger.info('Setting up middleware and routes...');

  app.use(helmet());
  app.use(cors({ origin: config.service.nodeEnv === 'development' ? '*' : false }));
  app.use(express.json({ limit: '2mb' }));

  // Serve dashboard on root path (BEFORE static middleware)
  app.get('/', (_req, res) => {
    logger.info('GET / handler called');
    res.sendFile(path.join(__dirname, '../../public/index.html'));
  });

  app.get('/test', (_req, res) => {
    logger.info('GET /test handler called');
    res.json({ message: 'Test route works!' });
  });

  logger.info('Middleware and routes configured');

  // Serve static files from public directory (AFTER specific routes)
  app.use(express.static(path.join(__dirname, '../../public')));

  // Health endpoints (no auth) - mount at root
  app.use('/', healthRouter);

  // Database & Cache Infrastructure
  const pgPool = new Pool({
    host: config.db.host,
    port: config.db.port,
    database: config.db.database,
    user: config.db.user,
    password: config.db.password,
  });

  const redis = new Redis({
    host: optional('REDIS_HOST', 'localhost'),
    port: parseInt(optional('REDIS_PORT', '6379'), 10),
    lazyConnect: true,
    enableOfflineQueue: false,
    retryStrategy: () => null, // não tentar reconectar
  });

  // Impede que erros de conexão Redis derrubem o processo
  redis.on('error', (err) => {
    logger.warn('Redis connection error (non-fatal)', {
      error: err.message,
    });
  });

  // Test connections (non-blocking)
  try {
    await pgPool.query('SELECT 1');
    logger.info('PostgreSQL pool connected', { host: config.db.host, port: config.db.port });
  } catch (error) {
    logger.warn('PostgreSQL connection failed', {
      error: error instanceof Error ? error.message : 'unknown',
    });
  }

  try {
    await redis.ping();
    logger.info('Redis connected', { host: optional('REDIS_HOST', 'localhost') });
  } catch (error) {
    logger.warn('Redis connection failed', {
      error: error instanceof Error ? error.message : 'unknown',
    });
  }

  // Infrastructure
  const repository = new AnalysisRepository();
  try {
    await repository.initialize();
  } catch (error) {
    logger.warn('Repository initialization failed', {
      error: error instanceof Error ? error.message : 'unknown',
    });
  }

  // Shared dependencies
  const llm = new LLMClient();
  const prometheus = new PrometheusCollector();
  const allure = new AllureCollector();
  const github = new GitHubActionsCollector();
  const backend = new BackendDataCollector();
  const tokenSavingsAnalyzer = new TokenSavingsAnalyzer(pgPool, logger);
  try {
    await tokenSavingsAnalyzer.initialize();
  } catch (error) {
    logger.warn('TokenSavingsAnalyzer initialization failed', {
      error: error instanceof Error ? error.message : 'unknown',
    });
  }
  const dashboardAggregator = new DashboardAggregator(pgPool, logger, tokenSavingsAnalyzer);

  // Learning Engine Components
  const historicalTracker = new HistoricalSuccessTracker(redis, pgPool, logger);
  const learningEngine = new LearningEngineOrchestrator(pgPool, redis, logger);

  // Decision Engine Components
  const privacyClassifier = new PrivacyClassifier(logger);
  const modelRouter = new ModelRouter(logger, []);
  const feedbackProcessor = new FeedbackProcessor(logger);
  const metricsCollector = new AIMetricsCollector(logger);
  const agentExecutor = new AgentGraphExecutor(logger);

  const decisionEngineOrchestrator = new DecisionEngineOrchestrator(
    logger,
    privacyClassifier,
    modelRouter,
    feedbackProcessor,
    metricsCollector,
    agentExecutor,
  );

  // Application layer
  const orchestrator = new AIOrchestrator(repository);
  const agentCoordinator = new AgentCoordinator(llm, repository, prometheus, allure, github, backend);

  // Rate limiting for AI endpoints
  const limiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please slow down.' },
  });

  // Protected AI analysis routes (wrapped in try-catch)
  try {
    app.use('/api/v1/analysis', limiter, requireApiKey, createAnalysisRouter(orchestrator, agentCoordinator));

    // Protected unified decision routes
    app.use(
      '/api/v1/decision',
      limiter,
      requireApiKey,
      createUnifiedDecisionRouter(pgPool, redis, logger, decisionEngineOrchestrator, learningEngine, historicalTracker),
    );

    // Metrics routes
    app.use(
      '/api/v1/metrics',
      requireApiKey,
      createMetricsRouter(tokenSavingsAnalyzer, dashboardAggregator),
    );

    // Insights routes (real business metrics)
    app.use(
      '/api/v1/insights',
      requireApiKey,
      createInsightsRouter(pgPool, logger),
    );

    logger.info('API routes initialized', {
      routes: ['/api/v1/analysis', '/api/v1/decision', '/api/v1/insights'],
      ab_test: {
        enabled: process.env.AB_TEST_ENABLED === 'true',
        autonomous_percentage: process.env.AB_TEST_AUTONOMOUS_PERCENTAGE || '50%',
      },
    });
  } catch (error) {
    logger.warn('Failed to initialize API routes', {
      error: error instanceof Error ? error.message : 'unknown',
    });
  }

  // Global error handler
  logger.info('Registering error handler');
  app.use(errorHandler);

  // Start server
  logger.info('Starting server on port', { port: config.service.port });
  const server = app.listen(config.service.port, () => {
    logger.info(`AI Intelligence Service started`, {
      port: config.service.port,
      env: config.service.nodeEnv,
      model: config.openai.model,
      llmProviders: config.llm.providerOrder,
    });
  });

  server.on('error', (err) => {
    logger.error('Server error', { error: err.message });
  });

  // Graceful shutdown
  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`${signal} received – shutting down gracefully`);
    server.close(async () => {
      await repository.close();
      await pgPool.end();
      await redis.quit();
      logger.info('All connections closed');
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((error) => {
  logger.error('Failed to start AI Intelligence Service', {
    error: error instanceof Error ? error.message : 'unknown',
  });
  process.exit(1);
});
