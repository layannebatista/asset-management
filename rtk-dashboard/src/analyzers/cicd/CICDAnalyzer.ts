import { v4 as uuidv4 } from 'uuid';
import { LLMClient } from '../../llm/LLMClient';
import { PromptOptimizer } from '../../llm/PromptOptimizer';
import { ContextFilter } from '../../context/ContextFilter';
import { ContextPipeline } from '../../context/ContextPipeline';
import { GitHubActionsCollector } from '../../collectors/GitHubActionsCollector';
import { AnalysisRepository } from '../../storage/AnalysisRepository';
import { TokenSavingsRecorder } from '../../observability/TokenSavingsRecorder';
import { CICDAnalysis, CICDRequest } from '../../types/analysis.types';
import { logger } from '../../api/logger';

export class CICDAnalyzer {
  private readonly pipeline = new ContextPipeline(1200, 0.75);

  constructor(
    private readonly llm: LLMClient,
    private readonly collector: GitHubActionsCollector,
    private readonly repository: AnalysisRepository,
    private readonly savingsRecorder: TokenSavingsRecorder,
  ) {}

  async analyze(request: CICDRequest = {}): Promise<CICDAnalysis> {
    const analysisId = uuidv4();
    const lookbackDays = request.lookbackDays ?? 7;
    const start = Date.now();

    logger.info('Starting CI/CD analysis', { analysisId, lookbackDays });

    const runs = await this.collector.collectWorkflowRuns(lookbackDays);

    if (runs.length === 0) {
      logger.warn('No CI/CD runs found', { analysisId });
      return this.emptyResult(analysisId, Date.now() - start);
    }

    // Decompose into scored chunks
    const chunks = ContextFilter.workflowRunsToChunks(runs);

    // SDD → RTK budget: dedup duplicate job entries, then rank by relevance
    const budgetResult = this.pipeline.run(chunks, 'cicd', analysisId);

    const context = JSON.parse(budgetResult.contextJson) as Record<string, unknown>;
    const { system, user } = PromptOptimizer.cicd(context);

    const llmResponse = await this.llm.call({
      systemPrompt: system,
      userPrompt: user,
      useFallback: runs.length < 5,
      budgetStats: {
        estimatedTokens: budgetResult.estimatedTokens,
        droppedChunks: budgetResult.droppedChunks,
      },
    });

    const parsed = JSON.parse(llmResponse.content) as Omit<CICDAnalysis, 'metadata'>;

    const result: CICDAnalysis = {
      ...parsed,
      metadata: {
        analysisId,
        type: 'cicd',
        status: 'completed',
        model: llmResponse.model,
        tokensUsed: llmResponse.tokensUsed,
        durationMs: Date.now() - start,
        createdAt: new Date().toISOString(),
      },
    };

    await this.repository.save(result);

    // Record token savings metrics
    await this.savingsRecorder.recordAnalysis({
      analysisId,
      analysisType: 'cicd',
      rawChunks: chunks,
      budgetResult,
      llmResponse,
    });

    logger.info('CI/CD analysis completed', {
      analysisId,
      runsAnalyzed: runs.length,
      contextTokensEstimated: budgetResult.estimatedTokens,
    });

    return result;
  }

  private emptyResult(analysisId: string, durationMs: number): CICDAnalysis {
    return {
      metadata: {
        analysisId,
        type: 'cicd',
        status: 'completed',
        model: 'none',
        durationMs,
        createdAt: new Date().toISOString(),
      },
      summary: 'Nenhuma execução de CI/CD encontrada na janela de tempo solicitada.',
      averagePipelineDurationMinutes: 0,
      successRate: 0,
      slowJobs: [],
      failureTrends: [],
      optimizationOpportunities: [],
    };
  }
}
