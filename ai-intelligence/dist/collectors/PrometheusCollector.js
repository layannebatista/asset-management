"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrometheusCollector = void 0;
const axios_1 = __importDefault(require("axios"));
const config_1 = require("../config");
const logger_1 = require("../api/logger");
/**
 * Pulls structured metrics from Prometheus using instant queries.
 * All queries are read-only and pull pre-computed metrics – no raw code needed.
 */
class PrometheusCollector {
    baseUrl;
    constructor() {
        this.baseUrl = config_1.config.services.prometheusUrl;
    }
    async collect(windowMinutes = 30) {
        logger_1.logger.info('Collecting Prometheus metrics', { windowMinutes });
        const [jvm, http, system] = await Promise.all([
            this.collectJVMMetrics(windowMinutes),
            this.collectHTTPMetrics(windowMinutes),
            this.collectSystemMetrics(),
        ]);
        return {
            collectedAt: new Date().toISOString(),
            windowMinutes,
            jvm,
            http,
            system,
        };
    }
    async collectJVMMetrics(windowMinutes) {
        const window = `${windowMinutes}m`;
        const [heapUsed, heapMax, nonHeap, gcPause, gcCount, threads, peakThreads, classes] = await Promise.all([
            this.query('jvm_memory_used_bytes{area="heap"}'),
            this.query('jvm_memory_max_bytes{area="heap"}'),
            this.query('jvm_memory_used_bytes{area="nonheap"}'),
            this.query(`increase(jvm_gc_pause_seconds_sum[${window}])`),
            this.query(`increase(jvm_gc_pause_seconds_count[${window}])`),
            this.query('jvm_threads_live_threads'),
            this.query('jvm_threads_peak_threads'),
            this.query('jvm_classes_loaded_classes'),
        ]);
        const heapUsedBytes = this.firstValue(heapUsed);
        const heapMaxBytes = this.firstValue(heapMax);
        return {
            heapUsedBytes,
            heapMaxBytes,
            heapUsagePct: heapMaxBytes > 0 ? (heapUsedBytes / heapMaxBytes) * 100 : 0,
            nonHeapUsedBytes: this.firstValue(nonHeap),
            gcPauseSeconds: this.firstValue(gcPause),
            gcCollections: this.firstValue(gcCount),
            liveThreads: this.firstValue(threads),
            peakThreads: this.firstValue(peakThreads),
            loadedClasses: this.firstValue(classes),
        };
    }
    async collectHTTPMetrics(windowMinutes) {
        const window = `${windowMinutes}m`;
        const [requests, errors, p50, p95, p99, connections, perEndpoint] = await Promise.all([
            this.query(`increase(http_server_requests_seconds_count[${window}])`),
            this.query(`increase(http_server_requests_seconds_count{status=~"5.."}[${window}])`),
            this.query(`histogram_quantile(0.50, rate(http_server_requests_seconds_bucket[${window}]))`),
            this.query(`histogram_quantile(0.95, rate(http_server_requests_seconds_bucket[${window}]))`),
            this.query(`histogram_quantile(0.99, rate(http_server_requests_seconds_bucket[${window}]))`),
            this.query('tomcat_connections_current_connections'),
            this.query(`topk(5, histogram_quantile(0.95, rate(http_server_requests_seconds_bucket{uri!~"/(actuator|favicon).*"}[${window}]))) by (uri, method, status)`),
        ]);
        const requestsTotal = this.sumValues(requests);
        const errorsTotal = this.sumValues(errors);
        const errorRatePct = requestsTotal > 0 ? (errorsTotal / requestsTotal) * 100 : 0;
        const slowestEndpoints = perEndpoint.data.result
            .slice(0, 10)
            .map((r) => ({
            uri: r.metric['uri'] ?? 'unknown',
            method: r.metric['method'] ?? 'GET',
            status: r.metric['status'] ?? '200',
            p95LatencyMs: parseFloat(r.value?.[1] ?? '0') * 1000,
            requestCount: 0,
        }))
            .filter((e) => e.p95LatencyMs > 0);
        return {
            requestsTotal,
            errorsTotal,
            errorRatePct,
            p50LatencyMs: this.firstValue(p50) * 1000,
            p95LatencyMs: this.firstValue(p95) * 1000,
            p99LatencyMs: this.firstValue(p99) * 1000,
            activeConnections: this.firstValue(connections),
            slowestEndpoints,
        };
    }
    async collectSystemMetrics() {
        const [cpu, mem, disk, uptime] = await Promise.all([
            this.query('system_cpu_usage'),
            this.query('jvm_memory_used_bytes / jvm_memory_max_bytes'),
            this.query('disk_free_bytes / disk_total_bytes'),
            this.query('process_uptime_seconds'),
        ]);
        return {
            cpuUsagePct: this.firstValue(cpu) * 100,
            memoryUsagePct: this.firstValue(mem) * 100,
            diskUsagePct: (1 - this.firstValue(disk)) * 100,
            uptime: this.firstValue(uptime),
        };
    }
    async query(promQL) {
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/api/v1/query`, {
                params: { query: promQL },
                timeout: 10000,
            });
            return response.data;
        }
        catch (error) {
            logger_1.logger.warn('Prometheus query failed, returning empty result', { promQL, error });
            return { status: 'error', data: { resultType: 'vector', result: [] } };
        }
    }
    firstValue(result) {
        const val = result.data.result[0]?.value?.[1];
        if (!val)
            return 0;
        const parsed = parseFloat(val);
        return isNaN(parsed) ? 0 : parsed;
    }
    sumValues(result) {
        return result.data.result.reduce((sum, r) => {
            const val = parseFloat(r.value?.[1] ?? '0');
            return sum + (isNaN(val) ? 0 : val);
        }, 0);
    }
}
exports.PrometheusCollector = PrometheusCollector;
//# sourceMappingURL=PrometheusCollector.js.map