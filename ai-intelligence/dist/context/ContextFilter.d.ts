import { CollectedMetrics, AllureTestResult, GitHubWorkflowRun } from '../types/metrics.types';
import { ContextChunk } from './ContextBudgetManager';
/**
 * Decomposes raw collected data into scored ContextChunks.
 *
 * Each chunk carries:
 *  - key: semantic label (matched by ContextBudgetManager relevance boosts)
 *  - data: the actual payload, already cleaned of raw/noisy fields
 *  - baseRelevance: how important this chunk is regardless of analysis type [0–1]
 *
 * The ContextBudgetManager then picks which chunks to include based on
 * the specific analysis focus and the available token budget.
 */
export declare class ContextFilter {
    static metricsToChunks(metrics: CollectedMetrics): ContextChunk[];
    static testResultsToChunks(results: AllureTestResult[], flakyNames?: string[]): ContextChunk[];
    static workflowRunsToChunks(runs: GitHubWorkflowRun[]): ContextChunk[];
    private static classifyHeapPressure;
    private static classifyLatency;
    private static classifyErrorRate;
    private static extractSuite;
}
//# sourceMappingURL=ContextFilter.d.ts.map