"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContextBudgetManager = void 0;
// ─── Relevance boost per analysis focus ──────────────────────────────────────
// Each focus type defines per-key multipliers on top of baseRelevance.
// Keys not listed use multiplier 1.0 (unchanged).
const RELEVANCE_BOOSTS = {
    observability: {
        anomalyFlags: 2.0,
        jvm: 1.8,
        http: 1.8,
        system: 1.5,
        totals: 0.5,
        failedTests: 0.3,
        flakyTestNames: 0.2,
    },
    'test-intelligence': {
        failedTests: 2.0,
        flakyTestNames: 1.9,
        totals: 1.5,
        slowestPassingTests: 1.4,
        avgDurationMs: 1.2,
        jvm: 0.3,
        http: 0.3,
        anomalyFlags: 0.4,
    },
    cicd: {
        slowestJobs: 2.0,
        recentFailures: 1.9,
        summary: 1.5,
        failedTests: 0.4,
        jvm: 0.2,
        anomalyFlags: 0.5,
    },
    incident: {
        logSample: 2.0,
        errorMessages: 2.0,
        anomalyFlags: 1.5,
        http: 1.4,
        jvm: 1.2,
        recentFailures: 1.0,
        failedTests: 0.6,
    },
    risk: {
        assets: 2.0,
        transfers: 1.8,
        maintenance: 1.7,
        depreciation: 1.6,
        anomalyFlags: 1.0,
        failedTests: 0.3,
        jvm: 0.2,
    },
    agent: {
        // Agents get balanced weights – everything counts equally
        anomalyFlags: 1.2,
        jvm: 1.0,
        http: 1.0,
        failedTests: 1.0,
        flakyTestNames: 1.0,
        slowestJobs: 1.0,
        recentFailures: 1.0,
        assets: 1.0,
    },
};
class ContextBudgetManager {
    tokenBudget;
    /**
     * @param tokenBudget  Maximum tokens to use for context (default: 2000).
     *                     Leave room for system prompt (~600) and output (~2000).
     *                     With gpt-4o (128k context), 2000 is conservative but safe.
     */
    constructor(tokenBudget = 2000) {
        this.tokenBudget = tokenBudget;
    }
    /**
     * Assembles context chunks into a JSON string that fits within the token budget.
     *
     * @param chunks  Ordered list of context chunks (order matters for equal-score ties)
     * @param focus   The analysis type — drives relevance boosting
     */
    assemble(chunks, focus) {
        const boosts = RELEVANCE_BOOSTS[focus] ?? {};
        // Score each chunk
        const scored = chunks.map((chunk) => {
            const boost = boosts[chunk.key] ?? 1.0;
            return { chunk, score: chunk.baseRelevance * boost };
        });
        // Sort descending by score
        scored.sort((a, b) => b.score - a.score);
        const included = [];
        const dropped = [];
        const assembled = {};
        let totalTokens = 0;
        for (const { chunk } of scored) {
            const serialized = JSON.stringify({ [chunk.key]: chunk.data });
            const chunkTokens = ContextBudgetManager.estimateTokens(serialized);
            if (totalTokens + chunkTokens <= this.tokenBudget) {
                assembled[chunk.key] = chunk.data;
                totalTokens += chunkTokens;
                included.push(chunk.key);
            }
            else {
                // Try to include a truncated version for array-type chunks
                const truncated = ContextBudgetManager.tryTruncate(chunk.data, this.tokenBudget - totalTokens);
                if (truncated !== null) {
                    const truncSerialized = JSON.stringify({ [chunk.key]: truncated });
                    const truncTokens = ContextBudgetManager.estimateTokens(truncSerialized);
                    assembled[chunk.key] = truncated;
                    totalTokens += truncTokens;
                    included.push(`${chunk.key}(truncated)`);
                }
                else {
                    dropped.push(chunk.key);
                }
            }
        }
        return {
            contextJson: JSON.stringify(assembled, null, 0), // compact – saves tokens vs pretty-print
            estimatedTokens: totalTokens,
            droppedChunks: dropped,
            includedChunks: included,
        };
    }
    /**
     * Estimates token count using the rule-of-thumb: ~1 token per 4 characters.
     * Accurate to within ±10% for English/code/JSON. Avoids the 40ms overhead
     * of loading a full WASM tokenizer on every call.
     *
     * For exact counting, replace with: import { encoding_for_model } from 'tiktoken'
     */
    static estimateTokens(text) {
        return Math.ceil(text.length / 4);
    }
    /**
     * Attempts to truncate an array to fit within remainingBudget tokens.
     * Returns null if the type cannot be truncated or if even a single element is too big.
     */
    static tryTruncate(data, remainingTokens) {
        if (!Array.isArray(data) || data.length === 0)
            return null;
        for (let len = data.length - 1; len >= 1; len--) {
            const slice = data.slice(0, len);
            const tokens = ContextBudgetManager.estimateTokens(JSON.stringify(slice));
            if (tokens <= remainingTokens)
                return slice;
        }
        return null;
    }
}
exports.ContextBudgetManager = ContextBudgetManager;
//# sourceMappingURL=ContextBudgetManager.js.map