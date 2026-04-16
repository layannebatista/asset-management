export interface LLMCallOptions {
    systemPrompt: string;
    userPrompt: string;
    /** Use the cheaper/faster fallback model for non-critical analyses */
    useFallback?: boolean;
    maxRetries?: number;
    /** Pre-computed budget stats for observability logging */
    budgetStats?: {
        estimatedTokens: number;
        droppedChunks: string[];
    };
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
export declare class LLMClient {
    private readonly client;
    private static readonly JSON_MODE_INSTRUCTION;
    constructor();
    call(options: LLMCallOptions): Promise<LLMResponse>;
    private static sleep;
}
//# sourceMappingURL=LLMClient.d.ts.map