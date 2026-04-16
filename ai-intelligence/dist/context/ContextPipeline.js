"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContextPipeline = void 0;
const ContextBudgetManager_1 = require("./ContextBudgetManager");
const SemanticDeduplicator_1 = require("./SemanticDeduplicator");
const logger_1 = require("../api/logger");
/**
 * Orchestrates the full context preparation pipeline:
 *
 *   raw chunks
 *     → SemanticDeduplicator  (SDD: remove/merge redundant chunks)
 *     → ContextBudgetManager  (RTK-like: rank by relevance, fit in token budget)
 *     → BudgetResult          (contextJson ready for the prompt)
 *
 * This is the single entry point that all analyzers and agents should use.
 * Instantiate once per analyzer (shares the budget config).
 */
class ContextPipeline {
    deduplicator;
    budgetManager;
    constructor(tokenBudget = 2000, jaccardThreshold = 0.6) {
        this.deduplicator = new SemanticDeduplicator_1.SemanticDeduplicator(jaccardThreshold);
        this.budgetManager = new ContextBudgetManager_1.ContextBudgetManager(tokenBudget);
    }
    /**
     * Runs SDD → budget selection and returns a result ready for the prompt.
     *
     * @param chunks  Raw chunks from ContextFilter.*ToChunks()
     * @param focus   Analysis type — drives relevance boosting in the budget manager
     * @param label   Log label (e.g. analysisId) for traceability
     */
    run(chunks, focus, label) {
        const beforeCount = chunks.length;
        const beforeTokens = chunks.reduce((sum, c) => sum + ContextBudgetManager_1.ContextBudgetManager.estimateTokens(JSON.stringify(c.data)), 0);
        // ── Stage 1: Semantic Deduplication (SDD) ────────────────────────────────
        const deduplicated = this.deduplicator.deduplicate(chunks);
        const afterSddCount = deduplicated.length;
        const afterSddTokens = deduplicated.reduce((sum, c) => sum + ContextBudgetManager_1.ContextBudgetManager.estimateTokens(JSON.stringify(c.data)), 0);
        // ── Stage 2: RTK-like budget assembly ────────────────────────────────────
        const result = this.budgetManager.assemble(deduplicated, focus);
        logger_1.logger.debug('ContextPipeline completed', {
            label,
            focus,
            chunks: { before: beforeCount, afterSdd: afterSddCount },
            tokens: {
                rawEstimate: beforeTokens,
                afterSdd: afterSddTokens,
                sddReductionPct: beforeTokens > 0
                    ? `${(((beforeTokens - afterSddTokens) / beforeTokens) * 100).toFixed(1)}%`
                    : '0%',
                finalBudget: result.estimatedTokens,
                totalReductionPct: beforeTokens > 0
                    ? `${(((beforeTokens - result.estimatedTokens) / beforeTokens) * 100).toFixed(1)}%`
                    : '0%',
            },
            includedChunks: result.includedChunks,
            droppedChunks: result.droppedChunks,
        });
        return result;
    }
}
exports.ContextPipeline = ContextPipeline;
//# sourceMappingURL=ContextPipeline.js.map