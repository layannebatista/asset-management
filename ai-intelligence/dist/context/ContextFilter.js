"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContextFilter = void 0;
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
class ContextFilter {
    static metricsToChunks(metrics) {
        const { jvm, http, system } = metrics;
        // Pre-compute anomaly flags as a high-value, tiny chunk
        const anomalyFlags = [];
        if (jvm.heapUsagePct > 80)
            anomalyFlags.push('HIGH_HEAP_USAGE');
        if (jvm.gcPauseSeconds > 1)
            anomalyFlags.push('GC_PAUSE_ALERT');
        if (http.errorRatePct > 5)
            anomalyFlags.push('HIGH_ERROR_RATE');
        if (http.p95LatencyMs > 2000)
            anomalyFlags.push('HIGH_LATENCY');
        if (system.cpuUsagePct > 85)
            anomalyFlags.push('HIGH_CPU');
        if (jvm.liveThreads > 200)
            anomalyFlags.push('THREAD_SATURATION');
        return [
            {
                key: 'anomalyFlags',
                data: anomalyFlags,
                baseRelevance: 0.95, // always include – tiny and highly informative
            },
            {
                key: 'jvm',
                data: {
                    heapUsagePct: jvm.heapUsagePct,
                    heapPressure: ContextFilter.classifyHeapPressure(jvm.heapUsagePct),
                    gcPauseSeconds: jvm.gcPauseSeconds,
                    gcCollections: jvm.gcCollections,
                    liveThreads: jvm.liveThreads,
                    peakThreads: jvm.peakThreads,
                },
                baseRelevance: 0.85,
            },
            {
                key: 'http',
                data: {
                    errorRatePct: http.errorRatePct,
                    errorRateClassification: ContextFilter.classifyErrorRate(http.errorRatePct),
                    p95LatencyMs: http.p95LatencyMs,
                    p99LatencyMs: http.p99LatencyMs,
                    latencyClassification: ContextFilter.classifyLatency(http.p95LatencyMs),
                    activeConnections: http.activeConnections,
                    requestsTotal: http.requestsTotal,
                    errorsTotal: http.errorsTotal,
                    topSlowEndpoints: http.slowestEndpoints.slice(0, 5).map((e) => ({
                        uri: e.uri,
                        method: e.method,
                        p95LatencyMs: e.p95LatencyMs,
                    })),
                },
                baseRelevance: 0.85,
            },
            {
                key: 'system',
                data: {
                    cpuUsagePct: system.cpuUsagePct,
                    memoryUsagePct: system.memoryUsagePct,
                },
                baseRelevance: 0.6,
            },
            {
                key: 'collectionMeta',
                data: {
                    collectedAt: metrics.collectedAt,
                    windowMinutes: metrics.windowMinutes,
                },
                baseRelevance: 0.3,
            },
        ];
    }
    static testResultsToChunks(results, flakyNames = []) {
        const failed = results.filter((r) => r.status === 'failed' || r.status === 'broken');
        const passed = results.filter((r) => r.status === 'passed');
        const skipped = results.filter((r) => r.status === 'skipped');
        const slowPassing = [...passed]
            .sort((a, b) => b.duration - a.duration)
            .slice(0, 15)
            .map((t) => ({
            name: t.name,
            suite: ContextFilter.extractSuite(t),
            durationMs: t.duration,
        }));
        const failedSummary = failed.slice(0, 30).map((t) => ({
            name: t.name,
            suite: ContextFilter.extractSuite(t),
            status: t.status,
            durationMs: t.duration,
            // Hard cap at 200 chars – error messages are the biggest token hog
            errorMessage: t.statusDetails?.message?.slice(0, 200),
        }));
        return [
            {
                key: 'totals',
                data: {
                    total: results.length,
                    passed: passed.length,
                    failed: failed.length,
                    skipped: skipped.length,
                    passRate: results.length > 0
                        ? `${((passed.length / results.length) * 100).toFixed(1)}%`
                        : '0%',
                    avgDurationMs: Math.round(results.reduce((s, r) => s + r.duration, 0) / (results.length || 1)),
                },
                baseRelevance: 0.9,
            },
            {
                key: 'failedTests',
                data: failedSummary,
                baseRelevance: 0.95,
            },
            {
                key: 'flakyTestNames',
                data: flakyNames.slice(0, 20),
                baseRelevance: 0.88,
            },
            {
                key: 'slowestPassingTests',
                data: slowPassing,
                baseRelevance: 0.65,
            },
        ];
    }
    static workflowRunsToChunks(runs) {
        const completed = runs.filter((r) => r.status === 'completed');
        const failed = completed.filter((r) => r.conclusion === 'failure');
        const successful = completed.filter((r) => r.conclusion === 'success');
        const avgDurationMs = completed.reduce((s, r) => s + (r.durationMs ?? 0), 0) / (completed.length || 1);
        const jobDurations = {};
        completed.forEach((run) => {
            run.jobs?.forEach((job) => {
                jobDurations[job.name] = jobDurations[job.name] ?? [];
                jobDurations[job.name].push(job.durationMs);
            });
        });
        const slowestJobs = Object.entries(jobDurations)
            .map(([name, durations]) => ({
            name,
            avgDurationMs: Math.round(durations.reduce((a, b) => a + b, 0) / durations.length),
            maxDurationMs: Math.max(...durations),
            runCount: durations.length,
        }))
            .sort((a, b) => b.avgDurationMs - a.avgDurationMs)
            .slice(0, 8);
        const recentFailures = failed.slice(0, 5).map((r) => ({
            id: r.id,
            name: r.name,
            createdAt: r.createdAt,
            failedJobs: r.jobs?.filter((j) => j.conclusion === 'failure').map((j) => j.name) ?? [],
        }));
        return [
            {
                key: 'summary',
                data: {
                    totalRuns: runs.length,
                    successRate: `${((successful.length / (completed.length || 1)) * 100).toFixed(1)}%`,
                    avgDurationMinutes: (avgDurationMs / 60_000).toFixed(1),
                    failedCount: failed.length,
                },
                baseRelevance: 0.9,
            },
            {
                key: 'slowestJobs',
                data: slowestJobs,
                baseRelevance: 0.92,
            },
            {
                key: 'recentFailures',
                data: recentFailures,
                baseRelevance: 0.88,
            },
        ];
    }
    // ─── Kept for internal use by BudgetManager and anomaly flags ────────────
    static classifyHeapPressure(pct) {
        if (pct > 85)
            return 'critical';
        if (pct > 70)
            return 'high';
        if (pct > 50)
            return 'moderate';
        return 'normal';
    }
    static classifyLatency(p95Ms) {
        if (p95Ms > 5000)
            return 'critical';
        if (p95Ms > 2000)
            return 'high';
        if (p95Ms > 500)
            return 'elevated';
        return 'normal';
    }
    static classifyErrorRate(pct) {
        if (pct > 10)
            return 'critical';
        if (pct > 5)
            return 'high';
        if (pct > 1)
            return 'moderate';
        return 'normal';
    }
    static extractSuite(result) {
        const suite = result.labels.find((l) => l.name === 'suite' || l.name === 'parentSuite');
        return suite?.value ?? 'unknown';
    }
}
exports.ContextFilter = ContextFilter;
//# sourceMappingURL=ContextFilter.js.map