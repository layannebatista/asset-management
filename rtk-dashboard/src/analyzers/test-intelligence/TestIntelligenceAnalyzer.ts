import { v4 as uuidv4 } from 'uuid';
import { LLMClient } from '../../llm/LLMClient';
import { PromptOptimizer } from '../../llm/PromptOptimizer';
import { ContextFilter } from '../../context/ContextFilter';
import { ContextPipeline } from '../../context/ContextPipeline';
import { AllureCollector } from '../../collectors/AllureCollector';
import { AnalysisRepository } from '../../storage/AnalysisRepository';
import { TokenSavingsRecorder } from '../../observability/TokenSavingsRecorder';
import { TestIntelligenceAnalysis, TestIntelligenceRequest } from '../../types/analysis.types';
import { AllureTestResult } from '../../types/metrics.types';
import { logger } from '../../api/logger';

export class TestIntelligenceAnalyzer {
  private readonly pipeline = new ContextPipeline(1200, 0.75);

  constructor(
    private readonly llm: LLMClient,
    private readonly collector: AllureCollector,
    private readonly repository: AnalysisRepository,
    private readonly savingsRecorder: TokenSavingsRecorder,
  ) {}

  async analyze(request: TestIntelligenceRequest = {}): Promise<TestIntelligenceAnalysis> {
    const analysisId = uuidv4();
    const projectId = request.projectId ?? 'default';
    const start = Date.now();

    logger.info('Starting test intelligence analysis', { analysisId, projectId });

    const [allResults, flakyNames] = await Promise.all([
      this.collector.collectResults(projectId),
      this.collector.detectFlakyTests(projectId),
    ]);

    const results = request.suite && request.suite !== 'all'
      ? this.filterBySuite(allResults, request.suite)
      : allResults;

    // Decompose into scored chunks
    const chunks = ContextFilter.testResultsToChunks(results, flakyNames);

    // Add suite/project context as a cheap metadata chunk
    chunks.push({
      key: 'requestMeta',
      data: { projectId, suite: request.suite ?? 'all' },
      baseRelevance: 0.4,
    });

    // SDD → RTK budget: dedup near-duplicate error messages, then rank by relevance
    const budgetResult = this.pipeline.run(chunks, 'test-intelligence', analysisId);

    const context = JSON.parse(budgetResult.contextJson) as Record<string, unknown>;
    const { system, user } = PromptOptimizer.testIntelligence(context);

    const llmResponse = await this.llm.call({
      systemPrompt: system,
      userPrompt: user,
      useFallback: results.length < 20,
      budgetStats: {
        estimatedTokens: budgetResult.estimatedTokens,
        droppedChunks: budgetResult.droppedChunks,
      },
    });

    const parsed = JSON.parse(llmResponse.content) as Omit<TestIntelligenceAnalysis, 'metadata'>;

    const result: TestIntelligenceAnalysis = {
      ...parsed,
      metadata: {
        analysisId,
        type: 'test-intelligence',
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
      analysisType: 'test-intelligence',
      rawChunks: chunks,
      budgetResult,
      llmResponse,
    });

    logger.info('Test intelligence analysis completed', {
      analysisId,
      totalTests: result.totalTests,
      contextTokensEstimated: budgetResult.estimatedTokens,
    });

    return result;
  }

  private filterBySuite(results: AllureTestResult[], suite: 'backend' | 'frontend'): AllureTestResult[] {
    const parentSuiteLabel = suite === 'backend' ? 'Backend' : 'Frontend';
    return results.filter((r) =>
      r.labels.some(
        (l) => (l.name === 'parentSuite' || l.name === 'suite') && l.value.includes(parentSuiteLabel),
      ),
    );
  }
}
