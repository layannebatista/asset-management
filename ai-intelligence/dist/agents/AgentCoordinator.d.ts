import { LLMClient } from '../llm/LLMClient';
import { AnalysisRepository } from '../storage/AnalysisRepository';
import { PrometheusCollector } from '../collectors/PrometheusCollector';
import { AllureCollector } from '../collectors/AllureCollector';
import { GitHubActionsCollector } from '../collectors/GitHubActionsCollector';
import { BackendDataCollector } from '../collectors/BackendDataCollector';
import { MultiAgentAnalysis } from '../types/analysis.types';
/**
 * Coordinates 4 specialized agents that run in parallel, then synthesizes
 * their findings into a unified executive report.
 *
 * Agents:
 *  - DevOps Agent   → CI/CD + infrastructure metrics
 *  - QA Agent       → Playwright/Cucumber test intelligence
 *  - Backend Agent  → JVM, HTTP, error patterns
 *  - Architecture Agent → Domain risk + DDD consistency
 */
export declare class AgentCoordinator {
    private readonly llm;
    private readonly repository;
    private readonly prometheus;
    private readonly allure;
    private readonly github;
    private readonly backend;
    private readonly agentPipeline;
    constructor(llm: LLMClient, repository: AnalysisRepository, prometheus: PrometheusCollector, allure: AllureCollector, github: GitHubActionsCollector, backend: BackendDataCollector);
    runAll(): Promise<MultiAgentAnalysis>;
    private runDevOpsAgent;
    private runQAAgent;
    private runBackendAgent;
    private runArchitectureAgent;
    private failedReport;
}
//# sourceMappingURL=AgentCoordinator.d.ts.map