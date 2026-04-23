import axios, { AxiosInstance } from 'axios';
import { Logger } from 'winston';
import { ICollector, CollectionResult } from './ICollector';
import { GitHubData } from '../types/report.types';

/**
 * AIIntelligenceCICDCollector: Coleta métricas de CI/CD do serviço ai-intelligence
 * usando o modo localfree (sem necessidade de GITHUB_TOKEN).
 */
export class AIIntelligenceCICDCollector implements ICollector {
  private readonly client: AxiosInstance;
  private readonly logger: Logger;

  constructor(serviceUrl: string, apiKey: string, logger: Logger) {
    this.logger = logger;
    this.client = axios.create({
      baseURL: serviceUrl,
      headers: {
        'X-AI-Service-Key': apiKey,
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    });
  }

  async collect(_startDate: Date, _endDate: Date): Promise<CollectionResult> {
    const start = Date.now();
    try {
      const lookbackDays = this.resolveLookbackDays(_startDate, _endDate);
      const response = await this.client.post('/api/v1/analysis/cicd', { lookbackDays });
      const payload = response.data as any;
      const ai = (payload && typeof payload === 'object' && payload.data && typeof payload.data === 'object')
        ? payload.data
        : payload;

      const totalRuns = this.resolveTotalRuns(ai);
      const successRate = typeof ai?.successRate === 'number' ? ai.successRate : 0;
      const avgDurationMs = (ai?.averagePipelineDurationMinutes ?? 0) * 60 * 1000;

      const successfulRuns = Math.round((successRate / 100) * totalRuns);
      const failedRuns = Math.max(0, totalRuns - successfulRuns);

      // Mapeia slowJobs para o formato byJob esperado pelo ReportGenerator
      const byJob: Record<string, any> = {};
      for (const job of (ai?.slowJobs ?? [])) {
        byJob[job.name] = {
          name: job.name,
          runs: 1,
          succeeded: job.conclusion === 'success' ? 1 : 0,
          failed: job.conclusion === 'success' ? 0 : 1,
          avgDuration: (job.durationSeconds ?? 0) * 1000,
          status: job.durationSeconds > 600 ? 'degraded' : 'healthy',
        };
      }

      const githubData: GitHubData = {
        runs: [],
        jobs: [],
        summary: {
          totalRuns,
          totalDuration: avgDurationMs * totalRuns,
          // successRate stored as decimal (0–1) para compatibilidade com ReportGenerator
          successRate: successRate / 100,
          successfulRuns,
          failedRuns,
          avgDuration: avgDurationMs,
          byJob,
          // Metadados extras da IA para enriquecer o relatório
          aiSummary: ai?.summary ?? '',
          estimatedTimeSavingsMinutes: ai?.estimatedTimeSavingsMinutes ?? 0,
          optimizationOpportunities: ai?.optimizationOpportunities ?? [],
        } as any,
      };

      this.logger.info('AIIntelligenceCICDCollector: CI/CD data collected from ai-intelligence', {
        successRate: `${successRate.toFixed(1)}%`,
        totalRuns,
        lookbackDays,
        avgDurationMin: (avgDurationMs / 60000).toFixed(1),
      });

      return {
        source: 'GitHub',
        success: true,
        data: githubData,
        itemsCollected: totalRuns,
        duration: Date.now() - start,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error('AIIntelligenceCICDCollector error', { error: errorMsg });
      return {
        source: 'GitHub',
        success: false,
        error: errorMsg,
        itemsCollected: 0,
        duration: Date.now() - start,
      };
    }
  }

  getName(): string {
    return 'AIIntelligenceCICDCollector';
  }

  private resolveLookbackDays(startDate: Date, endDate: Date): number {
    const msPerDay = 24 * 60 * 60 * 1000;
    const diffMs = endDate.getTime() - startDate.getTime();
    const derivedDays = Number.isFinite(diffMs) && diffMs > 0
      ? Math.ceil(diffMs / msPerDay)
      : 7;
    return Math.max(1, Math.min(30, derivedDays));
  }

  private resolveTotalRuns(ai: any): number {
    if (typeof ai?.totalRuns === 'number') {
      return ai.totalRuns;
    }
    if (typeof ai?.runCount === 'number') {
      return ai.runCount;
    }
    if (Array.isArray(ai?.runs)) {
      return ai.runs.length;
    }
    if (Array.isArray(ai?.slowJobs) && ai.slowJobs.length > 0) {
      return ai.slowJobs.length;
    }
    return 0;
  }

  async validate(): Promise<boolean> {
    try {
      await this.client.get('/health');
      return true;
    } catch {
      return false;
    }
  }
}
