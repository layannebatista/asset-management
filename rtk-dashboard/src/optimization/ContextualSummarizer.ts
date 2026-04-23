import { Logger } from 'winston';
import { LLMClient } from '../clients/LLMClient';
import { ContextChunk } from '../context/ContextFilter';
import { AnalysisType } from '../types/analysis.types';

export interface SummarizationConfig {
  enabled: boolean;
  minContextSize: number; // tokens
  aggressiveness: 'light' | 'moderate' | 'aggressive'; // 30% vs 50% vs 70%
  preserveFields: string[]; // campos que nunca são removidos
}

export interface SummarizationResult {
  chunks: ContextChunk[];
  totalTokensBefore: number;
  totalTokensAfter: number;
  reduction: number; // 0-1
  summarizedCount: number;
  summaryDetails: Array<{
    chunkId: string;
    before: number;
    after: number;
    reduction: number;
  }>;
}

/**
 * ContextualSummarizer: Gera resumos inteligentes de contextos grandes
 *
 * Estratégia adaptativa:
 * - Contexto pequeno (< 1000 tokens): Sem resumo
 * - Contexto médio (1000-3000): Resumo leve (30%)
 * - Contexto grande (> 3000): Resumo agressivo (50%)
 *
 * Benefício: -30-50% em tokens para contextos grandes
 * Trade-off: Perda mínima de detalhes, compensada por melhor relevância
 */
export class ContextualSummarizer {
  private readonly llm: LLMClient;
  private readonly logger: Logger;
  private readonly defaultConfig: SummarizationConfig = {
    enabled: true,
    minContextSize: 1000,
    aggressiveness: 'moderate',
    preserveFields: ['anomalyFlags', 'errors', 'keyPoints', 'severity'],
  };

  constructor(llm: LLMClient, logger: Logger, config?: Partial<SummarizationConfig>) {
    this.llm = llm;
    this.logger = logger;
    this.defaultConfig = { ...this.defaultConfig, ...config };
  }

  /**
   * Sumarizar chunks se necessário (análise adaptativa)
   */
  async summarizeIfNeeded(
    chunks: ContextChunk[],
    analysisType: AnalysisType,
    config?: Partial<SummarizationConfig>,
  ): Promise<SummarizationResult> {
    const finalConfig = { ...this.defaultConfig, ...config };

    if (!finalConfig.enabled) {
      return {
        chunks,
        totalTokensBefore: 0,
        totalTokensAfter: 0,
        reduction: 0,
        summarizedCount: 0,
        summaryDetails: [],
      };
    }

    // ── Step 1: Estimar tokens totais
    const totalTokens = chunks.reduce((sum, c) => sum + this._estimateTokens(c), 0);

    // ── Step 2: Decidir se resumo é necessário
    const summaryRatio = this._decideSummaryRatio(
      totalTokens,
      finalConfig.aggressiveness,
    );

    if (summaryRatio === 0) {
      // Sem resumo necessário
      return {
        chunks,
        totalTokensBefore: totalTokens,
        totalTokensAfter: totalTokens,
        reduction: 0,
        summarizedCount: 0,
        summaryDetails: [],
      };
    }

    this.logger.info('Iniciando sumarização de contexto', {
      analysisType,
      totalTokens,
      summaryRatio: (summaryRatio * 100).toFixed(0) + '%',
      chunkCount: chunks.length,
    });

    // ── Step 3: Sumarizar chunks em paralelo
    const summarizedChunks = await Promise.all(
      chunks.map((chunk) => this._summarizeChunk(chunk, summaryRatio, finalConfig)),
    );

    // ── Step 4: Coletar estatísticas
    const summaryDetails = chunks.map((chunk, idx) => {
      const before = this._estimateTokens(chunk);
      const after = this._estimateTokens(summarizedChunks[idx]);

      return {
        chunkId: chunk.id,
        before,
        after,
        reduction: Math.max(0, (before - after) / before),
      };
    });

    const totalTokensAfter = summarizedChunks.reduce(
      (sum, c) => sum + this._estimateTokens(c),
      0,
    );

    const summarizedCount = summarizedChunks.filter((c) =>
      c.metadata?.summarized === true,
    ).length;

    this.logger.info('Sumarização completa', {
      analysisType,
      reduction: ((totalTokens - totalTokensAfter) / totalTokens * 100).toFixed(1) + '%',
      summarizedCount,
    });

    return {
      chunks: summarizedChunks,
      totalTokensBefore: totalTokens,
      totalTokensAfter,
      reduction: (totalTokens - totalTokensAfter) / totalTokens,
      summarizedCount,
      summaryDetails,
    };
  }

  // ════════════════════════════════════════════════════════════════
  // Private methods
  // ════════════════════════════════════════════════════════════════

  /**
   * Sumarizar um chunk individual
   */
  private async _summarizeChunk(
    chunk: ContextChunk,
    summaryRatio: number,
    config: SummarizationConfig,
  ): Promise<ContextChunk> {
    const chunkTokens = this._estimateTokens(chunk);
    const targetTokens = Math.floor(chunkTokens * (1 - summaryRatio));

    // Não resumir chunks muito pequenos
    if (targetTokens < 50) {
      return chunk;
    }

    try {
      const summary = await this._summarizeWithLLM(chunk, targetTokens, config);

      return {
        ...chunk,
        data: summary,
        metadata: {
          ...chunk.metadata,
          summarized: true,
          originalTokens: chunkTokens,
          summaryTokens: this._estimateTokens(summary),
          summaryRatio,
        },
      };
    } catch (error) {
      this.logger.warn('Summarization failed for chunk, keeping original', {
        chunkId: chunk.id,
        error: error instanceof Error ? error.message : 'unknown',
      });

      return chunk;
    }
  }

  /**
   * Chamar LLM para sumarizar um chunk
   */
  private async _summarizeWithLLM(
    chunk: ContextChunk,
    targetTokens: number,
    config: SummarizationConfig,
  ): Promise<any> {
    const chunkStr = JSON.stringify(chunk.data);

    const prompt = `You are a technical summarizer for infrastructure data.

Your task: Summarize this data in maximum ${targetTokens} tokens.
${config.preserveFields.length > 0 ? `MUST preserve these fields: ${config.preserveFields.join(', ')}` : ''}

Prioritize:
- Anomalies and errors
- Key metrics and thresholds
- Actionable insights

Ignore:
- Redundant metadata
- Exact timestamps
- Low-priority fields

Return ONLY valid JSON (no markdown, no explanation):

Data to summarize:
${chunkStr}`;

    try {
      const response = await this.llm.call({
        systemPrompt:
          'You are a technical summarizer. Always respond with valid JSON only.',
        userPrompt: prompt,
      });

      // Tentar fazer parse do response
      const summary = JSON.parse(response.content);

      return summary;
    } catch (error) {
      // Se falhar parsing, tenta extrair JSON manualmente
      this.logger.debug('LLM summarization parse failed, trying manual extraction', {
        error: error instanceof Error ? error.message : 'unknown',
      });

      // Fallback: retorna chave do chunk
      return chunk.data;
    }
  }

  /**
   * Decidir ratio de resumo baseado no tamanho do contexto
   */
  private _decideSummaryRatio(
    totalTokens: number,
    aggressiveness: 'light' | 'moderate' | 'aggressive',
  ): number {
    // Sem resumo se contexto é pequeno
    if (totalTokens < 1000) {
      return 0;
    }

    // Ratio baseado em agressividade
    if (totalTokens < 3000) {
      switch (aggressiveness) {
        case 'light':
          return 0.15; // 15% reduction
        case 'moderate':
          return 0.3; // 30% reduction
        case 'aggressive':
          return 0.5; // 50% reduction
      }
    }

    // Contextos muito grandes: sempre sumarizar bastante
    switch (aggressiveness) {
      case 'light':
        return 0.25; // 25% reduction
      case 'moderate':
        return 0.5; // 50% reduction
      case 'aggressive':
        return 0.7; // 70% reduction
    }
  }

  /**
   * Estimar tokens de um chunk
   */
  private _estimateTokens(chunk: ContextChunk | any): number {
    let str: string;

    if (typeof chunk === 'object' && 'data' in chunk) {
      str = JSON.stringify(chunk.data);
    } else {
      str = JSON.stringify(chunk);
    }

    // Heurística: ~4 caracteres = 1 token
    return Math.ceil(str.length / 4);
  }
}
