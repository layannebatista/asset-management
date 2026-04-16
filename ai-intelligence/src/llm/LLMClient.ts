import OpenAI from 'openai';
import { config } from '../config';
import { logger } from '../api/logger';

export interface LLMCallOptions {
  systemPrompt: string;
  userPrompt: string;
  /** Use the cheaper/faster fallback model for non-critical analyses */
  useFallback?: boolean;
  maxRetries?: number;
  /** Pre-computed budget stats for observability logging */
  budgetStats?: { estimatedTokens: number; droppedChunks: string[] };
}

export interface LLMResponse {
  content: string;
  model: string;
  tokensUsed: number;
  durationMs: number;
}

/**
 * Thin wrapper around the OpenAI SDK.
 *
 * - Always uses JSON mode to guarantee parseable structured output
 * - Retries once on rate limit or transient errors
 * - Tracks token usage for cost monitoring
 */
export class LLMClient {
  private readonly client: OpenAI;
  private static readonly JSON_MODE_INSTRUCTION =
    'You must respond with a single valid JSON object. Do not include markdown code fences or any text outside the JSON object.';

  constructor() {
    this.client = new OpenAI({ apiKey: config.openai.apiKey });
  }

  async call(options: LLMCallOptions): Promise<LLMResponse> {
    const model = options.useFallback ? config.openai.fallbackModel : config.openai.model;
    const maxRetries = options.maxRetries ?? 2;
    const start = Date.now();

    let lastError: unknown;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.client.chat.completions.create({
          model,
          temperature: config.openai.temperature,
          max_tokens: config.openai.maxTokens,
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content: `${options.systemPrompt}\n\n${LLMClient.JSON_MODE_INSTRUCTION}`,
            },
            {
              role: 'user',
              content: options.userPrompt,
            },
          ],
        });

        const content = response.choices[0]?.message?.content ?? '{}';
        const tokensUsed = response.usage?.total_tokens ?? 0;
        const promptTokens = response.usage?.prompt_tokens ?? 0;
        const durationMs = Date.now() - start;

        // Log token efficiency metrics
        const estimatedContextTokens = options.budgetStats?.estimatedTokens ?? 0;
        const actualContextPct = promptTokens > 0
          ? ((estimatedContextTokens / promptTokens) * 100).toFixed(1)
          : 'n/a';

        logger.info(`LLM call completed`, {
          model,
          tokensUsed,
          promptTokens,
          estimatedContextTokens,
          contextAccuracyPct: actualContextPct,
          droppedChunks: options.budgetStats?.droppedChunks ?? [],
          durationMs,
          attempt,
        });

        return { content, model, tokensUsed, durationMs };

      } catch (error: unknown) {
        lastError = error;
        const isRateLimit = error instanceof OpenAI.RateLimitError;
        const isTimeout = error instanceof OpenAI.APIConnectionTimeoutError;

        if ((isRateLimit || isTimeout) && attempt < maxRetries) {
          const waitMs = attempt * 2000;
          logger.warn(`LLM call failed (attempt ${attempt}/${maxRetries}), retrying in ${waitMs}ms`, { error });
          await LLMClient.sleep(waitMs);
          continue;
        }

        logger.error('LLM call failed permanently', { error, attempt });
        throw error;
      }
    }

    throw lastError;
  }

  private static sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
