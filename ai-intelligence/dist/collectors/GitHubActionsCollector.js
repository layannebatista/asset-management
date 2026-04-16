"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitHubActionsCollector = void 0;
const axios_1 = __importDefault(require("axios"));
const config_1 = require("../config");
const logger_1 = require("../api/logger");
/**
 * Collects CI/CD data from the GitHub Actions REST API.
 * Uses read-only scope – only requires `repo` read permission.
 */
class GitHubActionsCollector {
    headers;
    repoBase;
    constructor() {
        this.headers = {
            Authorization: `Bearer ${config_1.config.github.token}`,
            Accept: 'application/vnd.github.v3+json',
            'X-GitHub-Api-Version': '2022-11-28',
        };
        this.repoBase = `https://api.github.com/repos/${config_1.config.github.owner}/${config_1.config.github.repo}`;
    }
    async collectWorkflowRuns(lookbackDays = 7, maxRuns = 50) {
        if (!config_1.config.github.token || !config_1.config.github.owner || !config_1.config.github.repo) {
            logger_1.logger.warn('GitHub config missing – skipping CI/CD collection');
            return [];
        }
        const since = new Date(Date.now() - lookbackDays * 86_400_000).toISOString();
        logger_1.logger.info('Collecting GitHub Actions workflow runs', { lookbackDays, since });
        try {
            const response = await axios_1.default.get(`${this.repoBase}/actions/runs`, {
                headers: this.headers,
                params: { per_page: maxRuns, created: `>=${since}` },
                timeout: 15000,
            });
            const rawRuns = response.data.workflow_runs;
            const runs = await Promise.all(rawRuns.slice(0, 20).map((run) => this.enrichRun(run)));
            return runs;
        }
        catch (error) {
            logger_1.logger.warn('Failed to collect GitHub Actions data', { error });
            return [];
        }
    }
    async enrichRun(raw) {
        const createdAt = new Date(raw['created_at']).getTime();
        const updatedAt = new Date(raw['updated_at']).getTime();
        const run = {
            id: raw['id'],
            name: raw['name'],
            status: raw['status'],
            conclusion: raw['conclusion'],
            createdAt: raw['created_at'],
            updatedAt: raw['updated_at'],
            runAttempt: raw['run_attempt'],
            durationMs: updatedAt - createdAt,
        };
        try {
            const jobsResponse = await axios_1.default.get(`${this.repoBase}/actions/runs/${run.id}/jobs`, { headers: this.headers, timeout: 10000 });
            run.jobs = jobsResponse.data.jobs.map((j) => this.mapJob(j));
        }
        catch {
            // Job enrichment is best-effort
        }
        return run;
    }
    mapJob(raw) {
        const startedAt = raw['started_at'] ? new Date(raw['started_at']).getTime() : 0;
        const completedAt = raw['completed_at'] ? new Date(raw['completed_at']).getTime() : 0;
        return {
            id: raw['id'],
            name: raw['name'],
            status: raw['status'],
            conclusion: raw['conclusion'],
            startedAt: raw['started_at'],
            completedAt: raw['completed_at'],
            durationMs: completedAt > startedAt ? completedAt - startedAt : 0,
        };
    }
}
exports.GitHubActionsCollector = GitHubActionsCollector;
//# sourceMappingURL=GitHubActionsCollector.js.map