import { AllureTestResult, AllureSummary } from '../types/metrics.types';
/**
 * Pulls test results from the Allure Docker Service API.
 * Endpoint docs: http://allure:5050/allure-docker-service
 */
export declare class AllureCollector {
    private readonly baseUrl;
    constructor();
    collectResults(projectId?: string): Promise<AllureTestResult[]>;
    collectSummary(projectId?: string): Promise<AllureSummary | null>;
    /**
     * Detects flaky tests by comparing the last N result sets.
     * A test is flaky if it has both passed and failed in recent runs.
     */
    detectFlakyTests(projectId?: string): Promise<string[]>;
}
//# sourceMappingURL=AllureCollector.d.ts.map