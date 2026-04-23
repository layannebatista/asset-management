import { Logger } from 'winston';
import { BudgetResult, ContextBudgetManager } from '../context/ContextBudgetManager';
import { LLMResponse } from '../llm/LLMClient';
import { TokenSavingsAnalyzer, TokenSavingsRecord } from './TokenSavingsAnalyzer';

export interface TokenSavingsContext {
  analysisId: string;
  analysisType: string;
  rawChunks: unknown[]; // Before any optimization
  budgetResult: BudgetResult;
  llmResponse: LLMResponse;
}

export class TokenSavingsRecorder {
  constructor(
    private readonly analyzer: TokenSavingsAnalyzer,
    private readonly logger: Logger,
  ) {}

  /**
   * Records token savings from a complete analysis flow.
   * Calculates savings metrics from raw chunks → optimized context → LLM call
   */
  async recordAnalysis(context: TokenSavingsContext): Promise<void> {
    try {
      // Estimate raw tokens if not already calculated
      const rawTokens = context.rawChunks.reduce(
        (sum: number, chunk: unknown) => sum + ContextBudgetManager.estimateTokens(JSON.stringify(chunk)),
        0,
      );

      // After SDD tokens - we can estimate from included chunks
      const afterSddTokens = context.budgetResult.includedChunks.reduce((sum: number) => sum + 1, 0) * 10; // rough estimate

      const finalTokens = context.budgetResult.estimatedTokens as number;
      const totalTokens = context.llmResponse.tokensUsed as number;
      const promptTokens = Math.round(totalTokens * 0.6); // rough estimate

      // Calculate reduction percentages
      const sddReductionPct = rawTokens > 0 ? ((rawTokens - afterSddTokens) / rawTokens) * 100 : 0;
      const totalReductionPct = rawTokens > 0 ? ((rawTokens - finalTokens) / rawTokens) * 100 : 0;
      const contextAccuracyPct = finalTokens > 0 ? (finalTokens / promptTokens) * 100 : 0;

      const record: TokenSavingsRecord = {
        analysisId: context.analysisId,
        analysisType: context.analysisType,
        model: context.llmResponse.model,
        rawTokens,
        afterSddTokens,
        finalTokens,
        promptTokens,
        totalTokens,
        sddReductionPct,
        totalReductionPct,
        contextAccuracyPct: Math.min(100, contextAccuracyPct), // Cap at 100%
        droppedChunksCount: context.budgetResult.droppedChunks.length,
        timestamp: new Date(),
      };

      await this.analyzer.recordTokenSavings(record);

      this.logger.debug('Token savings recorded', {
        analysisId: context.analysisId,
        totalReductionPct: totalReductionPct.toFixed(1),
        tokensSaved: rawTokens - finalTokens,
      });
    } catch (error) {
      this.logger.error('Failed to record token savings', {
        analysisId: context.analysisId,
        error: error instanceof Error ? error.message : 'unknown',
      });
    }
  }
}
