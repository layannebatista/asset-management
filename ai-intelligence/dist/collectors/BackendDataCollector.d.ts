/**
 * Pulls structured domain metadata from the Spring Boot backend.
 * Uses internal service-to-service calls (no user JWT needed).
 * All data is masked before storage or LLM dispatch.
 */
export declare class BackendDataCollector {
    private readonly baseUrl;
    private readonly internalApiKey;
    constructor();
    collectDomainRiskData(): Promise<Record<string, unknown>>;
    collectAuditLogs(limit?: number): Promise<Record<string, unknown>[]>;
    collectRecentErrors(limit?: number): Promise<Record<string, unknown>[]>;
    private safeGet;
}
//# sourceMappingURL=BackendDataCollector.d.ts.map