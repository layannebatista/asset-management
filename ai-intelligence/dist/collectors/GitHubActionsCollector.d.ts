import { GitHubWorkflowRun } from '../types/metrics.types';
/**
 * Collects CI/CD data from the GitHub Actions REST API.
 * Uses read-only scope – only requires `repo` read permission.
 */
export declare class GitHubActionsCollector {
    private readonly headers;
    private readonly repoBase;
    constructor();
    collectWorkflowRuns(lookbackDays?: number, maxRuns?: number): Promise<GitHubWorkflowRun[]>;
    private enrichRun;
    private mapJob;
}
//# sourceMappingURL=GitHubActionsCollector.d.ts.map