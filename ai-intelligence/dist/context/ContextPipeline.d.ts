import { ContextChunk, AnalysisFocus, BudgetResult } from './ContextBudgetManager';
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
export declare class ContextPipeline {
    private readonly deduplicator;
    private readonly budgetManager;
    constructor(tokenBudget?: number, jaccardThreshold?: number);
    /**
     * Runs SDD → budget selection and returns a result ready for the prompt.
     *
     * @param chunks  Raw chunks from ContextFilter.*ToChunks()
     * @param focus   Analysis type — drives relevance boosting in the budget manager
     * @param label   Log label (e.g. analysisId) for traceability
     */
    run(chunks: ContextChunk[], focus: AnalysisFocus, label?: string): BudgetResult;
}
//# sourceMappingURL=ContextPipeline.d.ts.map