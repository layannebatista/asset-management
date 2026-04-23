import express, { Express, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { Pool } from 'pg';
import { createLogger } from 'winston';
import winston from 'winston';
import dotenv from 'dotenv';

import path from 'path';
import fs from 'fs';
import { AllureCollector } from '../collectors/AllureCollector';
import { AIIntelligenceCICDCollector } from '../collectors/AIIntelligenceCICDCollector';
import { AIIntelligenceMetricsCollector } from '../collectors/AIIntelligenceMetricsCollector';
import { PostgreSQLCollector } from '../collectors/PostgreSQLCollector';
import { K6Collector } from '../collectors/K6Collector';
import { DataAggregator } from '../aggregators/DataAggregator';
import { ReportGenerator } from '../generators/ReportGenerator';
import { JSONFormatter } from '../generators/JSONFormatter';
import { HTMLFormatter } from '../generators/HTMLFormatter';
import { PowerPointFormatter } from '../generators/PowerPointFormatter';
import { SprintPeriod, SprintReport } from '../types/report.types';

dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config();

const logger = createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'sprint-reporter' },
  transports: [new winston.transports.Console()],
});

interface ReportRequest {
  startDate: string;
  endDate: string;
  projectName: string;
  format?: 'json' | 'html';
}

interface ReportResponse {
  success: boolean;
  data?: any;
  error?: string;
  timestamp?: Date;
}

function getAllureResultsPath(): string {
  const envPath = process.env.ALLURE_RESULTS_PATH;
  if (envPath && envPath.trim().length > 0) {
    if (path.isAbsolute(envPath)) {
      return envPath;
    }

    const fromCwd = path.resolve(process.cwd(), envPath);
    if (fs.existsSync(fromCwd)) {
      return fromCwd;
    }

    const projectRoot = path.resolve(__dirname, '../../');
    const fromProjectRoot = path.resolve(projectRoot, envPath);
    if (fs.existsSync(fromProjectRoot)) {
      return fromProjectRoot;
    }
  }

  const candidates = [
    path.resolve(process.cwd(), 'allure-results'),
    path.resolve(process.cwd(), '../allure-results'),
    path.resolve(__dirname, '../../../allure-results'),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return path.resolve(process.cwd(), 'allure-results');
}

function getK6SummaryPath(): string {
  const envPath = process.env.K6_SUMMARY_PATH;
  if (envPath && envPath.trim().length > 0) {
    if (path.isAbsolute(envPath)) return envPath;
    const fromCwd = path.resolve(process.cwd(), envPath);
    if (fs.existsSync(fromCwd)) return fromCwd;
  }
  // Tenta localizar o arquivo padrão
  const candidates = [
    path.resolve(process.cwd(), 'k6/k6-summary.json'),
    path.resolve(process.cwd(), 'k6-summary.json'),
    path.resolve(__dirname, '../../../k6/k6-summary.json'),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return path.resolve(process.cwd(), 'k6/k6-summary.json');
}

export async function createServer(): Promise<Express> {
  const app = express();

  // ─── Middleware ───────────────────────────────────────────────────────────
  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));

  // Serve static files from public directory
  app.use(express.static(path.join(__dirname, '../../public')));

  // ─── Health Check ─────────────────────────────────────────────────────────
  app.get('/health', async (req: Request, res: Response<ReportResponse>) => {
    try {
      const pgPool = new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5433'),
        database: process.env.DB_NAME || 'asset_management',
        user: process.env.DB_USER || 'asset_user',
        password: process.env.DB_PASSWORD || 'asset123',
      });

      const client = await pgPool.connect();
      await client.query('SELECT 1');
      client.release();
      await pgPool.end();

      res.json({ success: true, timestamp: new Date() });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      res.status(503).json({ success: false, error: errorMsg });
    }
  });

  // ─── Generate Report Endpoint ──────────────────────────────────────────────
  app.post('/api/reports/sprint', async (req: Request<{}, ReportResponse, ReportRequest>, res: Response<ReportResponse>) => {
    try {
      const { startDate, endDate, projectName, format = 'json' } = req.body;

      // Validações
      const startParts = startDate?.split('-').map((v) => parseInt(v, 10));
      const endParts = endDate?.split('-').map((v) => parseInt(v, 10));

      const start =
        startParts?.length === 3
          ? new Date(startParts[0], startParts[1] - 1, startParts[2], 0, 0, 0, 0)
          : new Date(NaN);
      const end =
        endParts?.length === 3
          ? new Date(endParts[0], endParts[1] - 1, endParts[2], 23, 59, 59, 999)
          : new Date(NaN);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({
          success: false,
          error: 'Formato de data inválido. Use YYYY-MM-DD',
        });
      }

      if (start >= end) {
        return res.status(400).json({
          success: false,
          error: 'A data inicial deve ser anterior à data final',
        });
      }

      if (!projectName || projectName.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Nome do projeto é obrigatório',
        });
      }

      logger.info('Gerando relatório', { projectName, startDate, endDate });

      // ─── Setup Collectors ──────────────────────────────────────────────────
      const pgPool = new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5433'),
        database: process.env.DB_NAME || 'asset_management',
        user: process.env.DB_USER || 'asset_user',
        password: process.env.DB_PASSWORD || 'asset123',
      });

      const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:3100';
      const aiServiceKey = process.env.AI_SERVICE_API_KEY || 'local-ai-service-key';

      const collectors = [
        new AllureCollector(getAllureResultsPath(), logger),
        new AIIntelligenceCICDCollector(aiServiceUrl, aiServiceKey, logger),
        new AIIntelligenceMetricsCollector(aiServiceUrl, aiServiceKey, logger),
        new PostgreSQLCollector(pgPool, logger),
        new K6Collector(getK6SummaryPath(), logger),
      ];

      // ─── Validate Collectors ──────────────────────────────────────────────
      const aggregator = new DataAggregator(collectors, logger);
      const validation = await aggregator.validateAll();

      const validCount = Array.from(validation.values()).filter((v) => v).length;
      logger.info(`Coletores validados: ${validCount}/${validation.size}`);

      // ─── Period ───────────────────────────────────────────────────────────
      const period: SprintPeriod = {
        startDate: start,
        endDate: end,
        projectName,
        daysCount: Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)),
      };

      // ─── Aggregate Data ───────────────────────────────────────────────────
      const collectedData = await aggregator.aggregate(period);

      // ─── Generate Report ──────────────────────────────────────────────────
      const generator = new ReportGenerator(logger);
      const report = generator.generate(period, collectedData);

      const sourceStatus = {
        allure: validation.get('AllureCollector') ?? false,
        github: validation.get('AIIntelligenceCICDCollector') ?? false,
        aiapi: validation.get('AIIntelligenceMetricsCollector') ?? false,
        postgres: validation.get('PostgreSQLCollector') ?? false,
        k6: validation.get('K6Collector') ?? false,
      };

      const sourceWarnings: string[] = [];
      if (!sourceStatus.allure) {
        sourceWarnings.push('Fonte Allure indisponível: métricas de testes podem estar vazias.');
      }
      if (!sourceStatus.github) {
        sourceWarnings.push('Serviço ai-intelligence indisponível: métricas de CI/CD podem estar vazias.');
      }
      if (!sourceStatus.aiapi) {
        sourceWarnings.push('API de métricas da IA indisponível: alguns dados avançados podem ficar incompletos.');
      }
      if (!sourceStatus.postgres) {
        sourceWarnings.push('Fonte PostgreSQL indisponível: dados legados podem ficar incompletos (API de IA é a fonte principal).');
      }

      if (sourceStatus.aiapi && report.ai.analysesExecuted === 0) {
        sourceWarnings.push('Sem dados de IA no período selecionado: execute análises no serviço ai-intelligence para preencher as métricas.');
      }
      if (!sourceStatus.k6) {
        sourceWarnings.push('Métricas de performance K6 indisponíveis: execute k6 run --summary-export=./k6/k6-summary.json k6/test.js para preencher.');
      }

      (report as any).sourceStatus = sourceStatus;
      (report as any).sourceWarnings = sourceWarnings;

      // ─── Format Output ───────────────────────────────────────────────────
      let output: string;
      let contentType = 'application/json';

      if (format === 'html') {
        output = HTMLFormatter.format(report);
        contentType = 'text/html; charset=utf-8';
      } else {
        output = JSONFormatter.format(report);
      }

      // ─── Close DB Connection ───────────────────────────────────────────────
      await pgPool.end();

      // ─── Return Response ──────────────────────────────────────────────────
      if (format === 'html') {
        res.setHeader('Content-Type', contentType);
        (res as any).send(output);
      } else {
        res.setHeader('Content-Type', contentType);
        res.json(JSON.parse(output));
      }

      logger.info('Relatório gerado com sucesso', {
        projectName,
        format,
        status: report.health.status,
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
      logger.error('Falha ao gerar relatório', { error: errorMsg });
      res.status(500).json({
        success: false,
        error: errorMsg,
      });
    }
  });

  // ─── Export PowerPoint Endpoint ────────────────────────────────────────────
  app.post('/api/reports/export/powerpoint', async (req: Request<{}, any, SprintReport>, res: Response) => {
    try {
      const report = req.body;

      // Validação básica
      if (!report || !report.period || !report.health) {
        return res.status(400).json({
          success: false,
          error: 'Formato de relatório inválido',
        });
      }

      logger.info('Gerando exportação PowerPoint', {
        projectName: report.period.projectName,
        startDate: report.period.startDate,
        endDate: report.period.endDate,
      });

      // Gerar PowerPoint
      const pptxBuffer = await PowerPointFormatter.format(report);

      // Definir cabeçalhos para download de arquivo
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
      res.setHeader('Content-Disposition', 'attachment; filename="relatorio-sprint.pptx"');
      res.setHeader('Content-Length', pptxBuffer.length);

      res.send(pptxBuffer);

      logger.info('Exportação PowerPoint gerada com sucesso', {
        projectName: report.period.projectName,
        size: pptxBuffer.length,
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
      logger.error('Falha na exportação PowerPoint', { error: errorMsg });
      res.status(500).json({
        success: false,
        error: errorMsg,
      });
    }
  });

  // ─── Root Route ────────────────────────────────────────────────────────────
  app.get('/', (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, '../../public/index.html'));
  });

  // ─── Tratador de Erros ────────────────────────────────────────────────────
  app.use((err: any, req: Request, res: Response, next: Function) => {
    logger.error('Erro não tratado', { error: err });
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    });
  });

  return app;
}

// ─── Bootstrap ────────────────────────────────────────────────────────────
async function bootstrap() {
  try {
    const app = await createServer();
    const port = parseInt(process.env.PORT || '3200', 10);

    app.listen(port, '0.0.0.0', () => {
      logger.info(`Sprint Reporter em execução`, { port });
    });
  } catch (error) {
    logger.error('Falha ao iniciar servidor', { error });
    process.exit(1);
  }
}

if (require.main === module) {
  bootstrap();
}

export default createServer;
