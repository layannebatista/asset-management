import { ContextChunk } from './ContextBudgetManager';
/**
 * Semantic Data Deduplication (SDD)
 *
 * Removes or merges context chunks that carry redundant information before
 * the ContextBudgetManager selects which chunks to send to the LLM.
 *
 * Why this matters:
 *   Without SDD, the same signal can appear in multiple chunks:
 *     - anomalyFlags: ['HIGH_LATENCY']       ← chunk 1
 *     - http.p95LatencyMs: 4800              ← chunk 2 (same fact, different form)
 *     - topSlowEndpoints: [...]              ← chunk 3 (consequence of same fact)
 *   The LLM receives 3 representations of the same problem → wasted tokens.
 *
 * Approach (no embeddings needed):
 *   1. Exact deduplication  – same key appears twice → keep highest score
 *   2. Numeric overlap      – two numeric signals within the same range → merge
 *   3. Text overlap         – error messages with Jaccard similarity > threshold → merge
 *   4. Flag-to-field merge  – if anomalyFlags already covers a signal, reduce the
 *                             baseRelevance of the raw numeric chunk (don't drop,
 *                             just demote so the budget manager ranks it lower)
 *   5. Array dedup          – remove duplicate entries within an array chunk
 */
export declare class SemanticDeduplicator {
    private readonly textSimilarityThreshold;
    /**
     * @param textSimilarityThreshold  Jaccard similarity above which two string
     *                                 entries are considered duplicates [0–1].
     *                                 Default 0.6 is aggressive enough to catch
     *                                 paraphrased error messages.
     */
    constructor(textSimilarityThreshold?: number);
    deduplicate(chunks: ContextChunk[]): ContextChunk[];
    private exactKeyDedup;
    private demoteRedundantNumericChunks;
    private deduplicateArrayEntries;
    /**
     * Removes near-duplicate strings using Jaccard similarity on word tokens.
     * Keeps the first occurrence of each semantic cluster.
     */
    private deduplicateStrings;
    /**
     * Removes exact duplicate objects and objects with the same primary key
     * (name, id, uri, fullName — whichever is present).
     */
    private deduplicateObjects;
    /**
     * Jaccard similarity between two strings, tokenised on whitespace and punctuation.
     * Range [0, 1]. Fast enough for short error messages (<500 chars).
     */
    private jaccardSimilarity;
}
//# sourceMappingURL=SemanticDeduplicator.d.ts.map