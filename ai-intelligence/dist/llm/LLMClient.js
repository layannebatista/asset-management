"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LLMClient = void 0;
const openai_1 = __importDefault(require("openai"));
const config_1 = require("../config");
const logger_1 = require("../api/logger");
/**
 * Thin wrapper around the OpenAI SDK.
 *
 * - Always uses JSON mode to guarantee parseable structured output
 * - Retries once on rate limit or transient errors
 * - Tracks token usage for cost monitoring
 */
class LLMClient {
    client;
    static JSON_MODE_INSTRUCTION = 'You must respond with a single valid JSON object. Do not include markdown code fences or any text outside the JSON object.';
    constructor() {
        this.client = new openai_1.default({ apiKey: config_1.config.openai.apiKey });
    }
    async call(options) {
        const model = options.useFallback ? config_1.config.openai.fallbackModel : config_1.config.openai.model;
        const maxRetries = options.maxRetries ?? 2;
        const start = Date.now();
        let lastError;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const response = await this.client.chat.completions.create({
                    model,
                    temperature: config_1.config.openai.temperature,
                    max_tokens: config_1.config.openai.maxTokens,
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
                logger_1.logger.info(`LLM call completed`, {
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
            }
            catch (error) {
                lastError = error;
                const isRateLimit = error instanceof openai_1.default.RateLimitError;
                const isTimeout = error instanceof openai_1.default.APIConnectionTimeoutError;
                if ((isRateLimit || isTimeout) && attempt < maxRetries) {
                    const waitMs = attempt * 2000;
                    logger_1.logger.warn(`LLM call failed (attempt ${attempt}/${maxRetries}), retrying in ${waitMs}ms`, { error });
                    await LLMClient.sleep(waitMs);
                    continue;
                }
                logger_1.logger.error('LLM call failed permanently', { error, attempt });
                throw error;
            }
        }
        throw lastError;
    }
    static sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
exports.LLMClient = LLMClient;
//# sourceMappingURL=LLMClient.js.map