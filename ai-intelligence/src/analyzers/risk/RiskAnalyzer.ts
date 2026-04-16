import { v4 as uuidv4 } from 'uuid';
import { LLMClient } from '../../llm/LLMClient';
import { PromptOptimizer } from '../../llm/PromptOptimizer';
import { BackendDataCollector } from '../../collectors/BackendDataCollector';
import { AnalysisRepository } from '../../storage/AnalysisRepository';
import { RiskAnalysis, RiskRequest } from '../../types/analysis.types';
import { logger } from '../../api/logger';

export class RiskAnalyzer {
  constructor(
    private readonly llm: LLMClient,
    private readonly collector: BackendDataCollector,
    private readonly repository: AnalysisRepository,
  ) {}

  async analyze(request: RiskRequest = {}): Promise<RiskAnalysis> {
    const analysisId = uuidv4();
    const start = Date.now();

    logger.info('Starting domain risk analysis', { analysisId });

    // Collect structured domain metadata (already masked at collection time)
    const domainData = await this.collector.collectDomainRiskData();

    const context = {
      ...domainData,
      requestedDomains: request.domains ?? ['asset', 'transfer', 'maintenance', 'depreciation', 'insurance', 'inventory'],
      focusedAssetIds: request.assetIds?.slice(0, 10) ?? [],
      systemContext: {
        assetStatuses: ['AVAILABLE', 'ASSIGNED', 'MAINTENANCE', 'DISPOSED'],
        lifecycle: 'assets move through statuses via transfers and maintenance orders',
        financialRules: 'depreciation is computed monthly; insurance must cover active assets',
      },
    };

    const { system, user } = PromptOptimizer.risk(context);

    const llmResponse = await this.llm.call({
      systemPrompt: system,
      userPrompt: user,
    });

    const parsed = JSON.parse(llmResponse.content) as Omit<RiskAnalysis, 'metadata'>;

    const result: RiskAnalysis = {
      ...parsed,
      metadata: {
        analysisId,
        type: 'risk',
        status: 'completed',
        model: llmResponse.model,
        tokensUsed: llmResponse.tokensUsed,
        durationMs: Date.now() - start,
        createdAt: new Date().toISOString(),
      },
    };

    await this.repository.save(result);
    logger.info('Risk analysis completed', {
      analysisId,
      riskScore: result.overallRiskScore,
      riskLevel: result.riskLevel,
    });

    return result;
  }
}
