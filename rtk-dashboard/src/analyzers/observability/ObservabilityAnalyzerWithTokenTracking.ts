import { v4 as uuidv4 } from 'uuid';
import { LLMClient } from '../../llm/LLMClient';
import { PromptOptimizer } from '../../llm/PromptOptimizer';
import { ContextFilter } from '../../context/ContextFilter';
import { ContextPipeline } from '../../context/ContextPipeline';
import { PrometheusCollector } from '../../collectors/PrometheusCollector';
import { AnalysisRepository } from '../../storage/AnalysisRepository';
import { ObservabilityAnalysis, ObservabilityRequest } from '../../types/analysis.types';
import { TokenSavingsRecorder } from '../../observability/TokenSavingsRecorder';
import { logger } from '../../api/logger';

/**
 * Extended ObservabilityAnalyzer that tracks token savings.
 * This is an example of how to integrate TokenSavingsRecorder into analyzers.
 */
export class ObservabilityAnalyzerWithTokenTracking {
  private readonly pipeline = new ContextPipeline(2000);

  constructor(
    private readonly llm: LLMClient,
    private readonly collector: PrometheusCollector,
    private readonly repository: AnalysisRepository,
    private readonly savingsRecorder: TokenSavingsRecorder,
  ) {}

  async analyze(request: ObservabilityRequest = {}): Promise<ObservabilityAnalysis> {
    const analysisId = uuidv4();
    const windowMinutes = request.windowMinutes ?? 30;
    const start = Date.now();

    logger.info('Starting observability analysis (with token tracking)', { analysisId, windowMinutes });

    // 1. Collect raw metrics from Prometheus
    const rawMetrics = await this.collector.collect(windowMinutes);

    // 2. Decompose into scored context chunks
    const chunks = ContextFilter.metricsToChunks(rawMetrics);

    // 3. SDD → RTK budget
    const budgetResult = this.pipeline.run(chunks, 'observability', analysisId);

    // 4. Build optimized prompt
    const context = JSON.parse(budgetResult.contextJson) as Record<string, unknown>;
    const { system, user } = PromptOptimizer.observability(context);

    // 5. Call LLM
    const llmResponse = await this.llm.call({
      systemPrompt: system,
      userPrompt: user,
      budgetStats: {
        estimatedTokens: budgetResult.estimatedTokens,
        droppedChunks: budgetResult.droppedChunks,
      },
    });

    // 6. Parse structured response
    const parsed = JSON.parse(llmResponse.content) as Omit<ObservabilityAnalysis, 'metadata'>;

    const result: ObservabilityAnalysis = {
      ...parsed,
      metadata: {
        analysisId,
        type: 'observability',
        status: 'completed',
        model: llmResponse.model,
        tokensUsed: llmResponse.tokensUsed,
        durationMs: Date.now() - start,
        createdAt: new Date().toISOString(),
        dataWindowMinutes: windowMinutes,
      },
    };

    await this.repository.save(result);

    // 7. Record token savings (NEW)
    await this.savingsRecorder.recordAnalysis({
      analysisId,
      analysisType: 'observability',
      rawChunks: chunks,
      budgetResult,
      llmResponse,
    });

    logger.info('Observability analysis completed', {
      analysisId,
      durationMs: result.metadata.durationMs,
      contextTokensEstimated: budgetResult.estimatedTokens,
    });

    return result;
  }
}
