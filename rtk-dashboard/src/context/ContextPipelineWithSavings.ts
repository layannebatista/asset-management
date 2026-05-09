import { AnalysisFocus, ContextChunk, BudgetResult } from './ContextBudgetManager';
import { ContextPipeline } from './ContextPipeline';
import { TokenSavingsAnalyzer } from '../observability/TokenSavingsAnalyzer';
import { Logger } from 'winston';

/**
 * Wraps ContextPipeline to automatically record token savings metrics.
 * Pass this to analyzers instead of ContextPipeline directly.
 */
export class ContextPipelineWithSavings {
  private readonly pipeline: ContextPipeline;

  constructor(
    private readonly analyzer: TokenSavingsAnalyzer,
    private readonly logger: Logger,
    tokenBudget = 2000,
  ) {
    this.pipeline = new ContextPipeline(tokenBudget);
  }

  /**
   * Runs the pipeline and records token savings metrics for later retrieval.
   * Returns the budget result as usual.
   */
  run(chunks: ContextChunk[], focus: AnalysisFocus, label?: string): BudgetResult & { rawTokens: number } {
    const budgetResult = this.pipeline.run(chunks, focus, label);

    // Estimate raw tokens from all chunks
    const rawTokens = chunks.reduce(
      (sum, c) => sum + this._estimateTokens(JSON.stringify(c.data)),
      0,
    );

    // Store for later use when LLM response is available
    // The analyzing component can later call recordSavings() with the LLM response
    (budgetResult as any).rawTokens = rawTokens;

    return budgetResult as any;
  }

  /**
   * Call this after LLM response is available to record the complete savings metrics.
   */
  async recordSavings(
    analysisId: string,
    analysisType: string,
    model: string,
    rawTokens: number,
    budgetEstimate: number,
    actualPromptTokens: number,
    actualTotalTokens: number,
    droppedChunksCount: number,
  ): Promise<void> {
    try {
      const sddReductionPct = rawTokens > 0 ? ((rawTokens - budgetEstimate) / rawTokens) * 100 : 0;
      const contextAccuracyPct = actualPromptTokens > 0 ? (budgetEstimate / actualPromptTokens) * 100 : 0;

      await this.analyzer.recordTokenSavings({
        analysisId,
        analysisType,
        model,
        rawTokens,
        afterSddTokens: budgetEstimate, // Approximate - actual is after SDD
        finalTokens: budgetEstimate,
        promptTokens: actualPromptTokens,
        totalTokens: actualTotalTokens,
        sddReductionPct,
        totalReductionPct: rawTokens > 0 ? ((rawTokens - budgetEstimate) / rawTokens) * 100 : 0,
        contextAccuracyPct: Math.min(100, contextAccuracyPct),
        droppedChunksCount,
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.warn('Failed to record token savings', {
        analysisId,
        error: error instanceof Error ? error.message : 'unknown',
      });
    }
  }

  private _estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }
}
