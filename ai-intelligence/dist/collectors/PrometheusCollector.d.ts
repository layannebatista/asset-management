import { CollectedMetrics } from '../types/metrics.types';
/**
 * Pulls structured metrics from Prometheus using instant queries.
 * All queries are read-only and pull pre-computed metrics – no raw code needed.
 */
export declare class PrometheusCollector {
    private readonly baseUrl;
    constructor();
    collect(windowMinutes?: number): Promise<CollectedMetrics>;
    private collectJVMMetrics;
    private collectHTTPMetrics;
    private collectSystemMetrics;
    private query;
    private firstValue;
    private sumValues;
}
//# sourceMappingURL=PrometheusCollector.d.ts.map