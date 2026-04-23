import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { Pool } from 'pg';
import path from 'path';

import { config } from '../config';
import { logger } from './logger';
import { requireApiKey } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';
import healthRouter from './routes/health.routes';
import { createInsightsRouter } from './routes/insights.routes';
import { TokenSavingsAnalyzer } from '../observability/TokenSavingsAnalyzer';

function optional(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

async function bootstrap(): Promise<void> {
  const app = express();
  logger.info('Setting up RTK Dashboard service...');

  app.use(helmet());
  app.use(cors({ origin: config.service.nodeEnv === 'development' ? '*' : false }));
  app.use(express.json({ limit: '2mb' }));

  // Serve dashboard on root path
  app.get('/', (_req, res) => {
    res.sendFile(path.join(__dirname, '../../public/index.html'));
  });

  logger.info('Dashboard route configured');

  // Serve static files from public directory
  app.use(express.static(path.join(__dirname, '../../public')));

  // Health endpoints (no auth)
  app.use('/', healthRouter);

  // Database setup
  const pgPool = new Pool({
    host: config.db.host,
    port: config.db.port,
    database: config.db.database,
    user: config.db.user,
    password: config.db.password,
  });

  // Test database connection
  try {
    await pgPool.query('SELECT 1');
    logger.info('PostgreSQL connected', { host: config.db.host, port: config.db.port });
  } catch (error) {
    logger.warn('PostgreSQL connection failed', {
      error: error instanceof Error ? error.message : 'unknown',
    });
  }

  // Initialize TokenSavingsAnalyzer for insights
  const tokenSavingsAnalyzer = new TokenSavingsAnalyzer(pgPool, logger);
  try {
    await tokenSavingsAnalyzer.initialize();
  } catch (error) {
    logger.warn('TokenSavingsAnalyzer initialization failed', {
      error: error instanceof Error ? error.message : 'unknown',
    });
  }

  // RTK Insights routes - protected by API key
  app.use(
    '/api/v1/insights',
    requireApiKey,
    createInsightsRouter(pgPool, logger),
  );

  logger.info('API routes initialized', {
    routes: ['/api/v1/insights'],
  });

  // Global error handler
  app.use(errorHandler);

  // Start server
  logger.info('Starting RTK Dashboard service', { port: config.service.port });
  const server = app.listen(config.service.port, () => {
    logger.info('RTK Dashboard Service started', {
      port: config.service.port,
      env: config.service.nodeEnv,
    });
  });

  server.on('error', (err) => {
    logger.error('Server error', { error: err.message });
  });

  // Graceful shutdown
  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`${signal} received – shutting down gracefully`);
    server.close(async () => {
      await pgPool.end();
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
