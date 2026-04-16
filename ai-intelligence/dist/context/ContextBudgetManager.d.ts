/**
 * RTK-like context budget manager.
 *
 * Instead of sending everything and hoping it fits, this module:
 *  1. Counts tokens *before* the LLM call (using the GPT-4 tokenizer approximation)
 *  2. Splits context into scored chunks (ContextChunk)
 *  3. Ranks chunks by relevance score for the specific analysis type
 *  4. Fills the token budget greedily from highest to lowest score
 *  5. Returns a compact JSON string guaranteed to fit within the budget
 *
 * This is the "RTK-like approach" mentioned in the orchestrator spec.
 * Avoids: silent truncation by OpenAI, wasted tokens on irrelevant signals,
 * and hitting max_tokens mid-response.
 */
export type AnalysisFocus = 'observability' | 'test-intelligence' | 'cicd' | 'incident' | 'risk' | 'agent';
export interface ContextChunk {
    /** Semantic label used for relevance scoring */
    key: string;
    /** The actual data payload */
    data: unknown;
    /**
     * Base relevance score for this chunk [0–1].
     * Higher = more likely to be included when budget is tight.
     */
    baseRelevance: number;
}
export interface BudgetResult {
    /** Serialised JSON ready to embed in the user prompt */
    contextJson: string;
    /** Estimated token count of the assembled context */
    estimatedTokens: number;
    /** Keys of chunks that were dropped due to budget constraints */
    droppedChunks: string[];
    /** Keys of chunks that were included */
    includedChunks: string[];
}
export declare class ContextBudgetManager {
    private readonly tokenBudget;
    /**
     * @param tokenBudget  Maximum tokens to use for context (default: 2000).
     *                     Leave room for system prompt (~600) and output (~2000).
     *                     With gpt-4o (128k context), 2000 is conservative but safe.
     */
    constructor(tokenBudget?: number);
    /**
     * Assembles context chunks into a JSON string that fits within the token budget.
     *
     * @param chunks  Ordered list of context chunks (order matters for equal-score ties)
     * @param focus   The analysis type — drives relevance boosting
     */
    assemble(chunks: ContextChunk[], focus: AnalysisFocus): BudgetResult;
    /**
     * Estimates token count using the rule-of-thumb: ~1 token per 4 characters.
     * Accurate to within ±10% for English/code/JSON. Avoids the 40ms overhead
     * of loading a full WASM tokenizer on every call.
     *
     * For exact counting, replace with: import { encoding_for_model } from 'tiktoken'
     */
    static estimateTokens(text: string): number;
    /**
     * Attempts to truncate an array to fit within remainingBudget tokens.
     * Returns null if the type cannot be truncated or if even a single element is too big.
     */
    private static tryTruncate;
}
//# sourceMappingURL=ContextBudgetManager.d.ts.map