import axios, { AxiosInstance } from 'axios';
import { Logger } from 'winston';
import { ICollector, CollectionResult } from './ICollector';

/**
 * RTKInsightsCollector: Coleta métricas de otimização de tokens do RTK Dashboard
 * Usa endpoints de /api/v1/insights/* do RTK Dashboard
 */
export class RTKInsightsCollector implements ICollector {
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

      // Coleta dados de RTK Dashboard
      const [executiveSummaryResp, tokenEconomyResp, modelEfficiencyResp, analysisRoiResp, historyResp] = await Promise.all([
        this.client.get(`/api/v1/insights/executive-summary?days=${days}`),
        this.client.get(`/api/v1/insights/token-economy?days=${days}`),
        this.client.get(`/api/v1/insights/model-efficiency?days=${days}`),
        this.client.get(`/api/v1/insights/analysis-roi?days=${days}`),
        this.client.get(`/api/v1/insights/history?months=3`),
      ]);

      const summary = executiveSummaryResp.data?.summary ?? {};
      const tokenEconomy = tokenEconomyResp.data?.tokenEconomy ?? {};
      const financial = tokenEconomyResp.data?.financialImpact ?? {};
      const models = modelEfficiencyResp.data?.models ?? [];
      const analyses = analysisRoiResp.data?.analyses ?? [];
      const history = historyResp.data ?? [];

      const rtkData = {
        summary: {
          period: `Últimos ${days} dias`,
          totalAnalysesExecuted: summary.metrics?.totalAnalysesExecuted ?? 0,
          metrics: {
            tokensSaved: tokenEconomy.totalTokensSaved ?? 0,
            usdSaved: financial.usdSaved ?? 0,
            savingsPercentage: tokenEconomy.savingsPercentage ?? 0,
            qualityScore: summary.metrics?.qualityScore ?? 0,
          },
          recommendation: summary.recommendation ?? '',
        },
        tokenEconomy: {
          tokensWithoutRTK: tokenEconomy.tokensWithoutRTK ?? 0,
          tokensWithRTK: tokenEconomy.tokensWithRTK ?? 0,
          savingsPercentage: tokenEconomy.savingsPercentage ?? 0,
          financialImpact: {
            costWithoutOptimization: financial.costWithoutOptimization ?? 0,
            costWithOptimization: financial.costWithOptimization ?? 0,
            usdSaved: financial.usdSaved ?? 0,
          },
        },
        models: models.map((m: any) => ({
          name: m.model,
          executions: m.executions,
          avgFinalTokens: m.avgFinalTokens,
          avgReductionPercentage: m.avgReductionPercentage,
          avgAccuracy: m.avgAccuracy,
          costPerAnalysis: m.costPerAnalysis,
          recommendation: m.recommendation,
        })),
        analyses: analyses.map((a: any) => ({
          type: a.type,
          executions: a.executions,
          avgEfficiency: a.avgEfficiency,
          avgAccuracy: a.avgAccuracy,
          totalUsdSaved: a.totalUsdSaved,
          roiPercentage: a.roiPercentage,
          recommendation: a.recommendation,
        })),
        history: history.map((h: any) => ({
          week: h.week,
          totalAnalyses: h.totalAnalyses,
          savingsPercentage: h.savingsPercentage,
          usdSaved: h.usdSaved,
          avgAccuracy: h.avgAccuracy,
        })),
      };

      this.logger.info('RTKInsightsCollector: RTK data collected successfully', {
        days,
        tokensSaved: rtkData.summary.metrics.tokensSaved,
        analysesExecuted: rtkData.summary.totalAnalysesExecuted,
        models: models.length,
        analyses: analyses.length,
      });

      return {
        source: 'RTKAPI',
        success: true,
        data: rtkData,
        itemsCollected: rtkData.summary.totalAnalysesExecuted,
        duration: Date.now() - start,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error('RTKInsightsCollector error', { error: errorMsg });

      return {
        source: 'RTKAPI',
        success: false,
        error: errorMsg,
        itemsCollected: 0,
        duration: Date.now() - start,
      };
    }
  }

  getName(): string {
    return 'RTKInsightsCollector';
  }

  async validate(): Promise<boolean> {
    try {
      // Tenta validar com o endpoint de insights
      await this.client.get('/api/v1/insights/executive-summary?days=1');
      return true;
    } catch {
      // Se falhar, apenas registra e retorna true (permite operação sem validação)
      // pois o collect() pode ter sucesso mesmo assim
      this.logger.warn('RTKInsightsCollector validation check failed, but will continue');
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
