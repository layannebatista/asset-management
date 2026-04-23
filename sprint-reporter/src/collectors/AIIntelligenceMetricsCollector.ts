import axios, { AxiosInstance } from 'axios';
import { Logger } from 'winston';
import { CollectionResult, ICollector } from './ICollector';

export interface AIApiCollectedData {
  dashboard: any;
  tokenSavingsSummary: any;
  recentTokenSavings: any[];
  analysisHistory: any[];
}

export class AIIntelligenceMetricsCollector implements ICollector {
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

  async collect(startDate: Date, endDate: Date): Promise<CollectionResult> {
    const start = Date.now();

    try {
      const days = this.resolveDays(startDate, endDate);

      const [dashboardResp, tokenSavingsResp, recentResp, historyResp] = await Promise.all([
        this.client.get(`/api/v1/metrics/dashboard?days=${days}`),
        this.client.get(`/api/v1/metrics/token-savings?days=${days}`),
        this.client.get('/api/v1/metrics/token-savings/recent?limit=20'),
        this.client.get('/api/v1/analysis/history?limit=200'),
      ]);

      const data: AIApiCollectedData = {
        dashboard: dashboardResp.data?.data ?? dashboardResp.data ?? null,
        tokenSavingsSummary: tokenSavingsResp.data?.data ?? tokenSavingsResp.data ?? null,
        recentTokenSavings: recentResp.data?.data ?? [],
        analysisHistory: historyResp.data?.data ?? [],
      };

      this.logger.info('AIIntelligenceMetricsCollector: dados de IA coletados', {
        days,
        analysesHistoryCount: data.analysisHistory.length,
        recentTokenSamples: data.recentTokenSavings.length,
      });

      return {
        source: 'AIAPI',
        success: true,
        data,
        itemsCollected: data.analysisHistory.length,
        duration: Date.now() - start,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error('AIIntelligenceMetricsCollector error', { error: errorMsg });

      return {
        source: 'AIAPI',
        success: false,
        error: errorMsg,
        itemsCollected: 0,
        duration: Date.now() - start,
      };
    }
  }

  getName(): string {
    return 'AIIntelligenceMetricsCollector';
  }

  async validate(): Promise<boolean> {
    try {
      await this.client.get('/health');
      await this.client.get('/api/v1/metrics/token-savings?days=1');
      return true;
    } catch {
      return false;
    }
  }

  private resolveDays(startDate: Date, endDate: Date): number {
    const diffMs = endDate.getTime() - startDate.getTime();
    const msPerDay = 24 * 60 * 60 * 1000;
    const days = Number.isFinite(diffMs) && diffMs > 0 ? Math.ceil(diffMs / msPerDay) : 7;
    return Math.max(1, Math.min(30, days));
  }
}
