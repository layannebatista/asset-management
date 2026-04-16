"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AllureCollector = void 0;
const axios_1 = __importDefault(require("axios"));
const config_1 = require("../config");
const logger_1 = require("../api/logger");
/**
 * Pulls test results from the Allure Docker Service API.
 * Endpoint docs: http://allure:5050/allure-docker-service
 */
class AllureCollector {
    baseUrl;
    constructor() {
        this.baseUrl = `${config_1.config.services.allureUrl}/allure-docker-service`;
    }
    async collectResults(projectId = 'default') {
        logger_1.logger.info('Collecting Allure test results', { projectId });
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/results`, { params: { project_id: projectId }, timeout: 15000 });
            return response.data?.data?.results ?? [];
        }
        catch (error) {
            logger_1.logger.warn('Failed to fetch Allure results, using empty dataset', { error });
            return [];
        }
    }
    async collectSummary(projectId = 'default') {
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/report/summary`, { params: { project_id: projectId }, timeout: 10000 });
            return response.data?.data ?? null;
        }
        catch (error) {
            logger_1.logger.warn('Failed to fetch Allure summary', { error });
            return null;
        }
    }
    /**
     * Detects flaky tests by comparing the last N result sets.
     * A test is flaky if it has both passed and failed in recent runs.
     */
    async detectFlakyTests(projectId = 'default') {
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/reports`, { params: { project_id: projectId }, timeout: 15000 });
            const reports = response.data?.data ?? [];
            const testHistory = {};
            for (const report of reports.slice(0, 10)) {
                for (const result of report.results ?? []) {
                    testHistory[result.fullName] = testHistory[result.fullName] ?? new Set();
                    testHistory[result.fullName].add(result.status);
                }
            }
            return Object.entries(testHistory)
                .filter(([, statuses]) => statuses.has('passed') && (statuses.has('failed') || statuses.has('broken')))
                .map(([name]) => name);
        }
        catch {
            return [];
        }
    }
}
exports.AllureCollector = AllureCollector;
//# sourceMappingURL=AllureCollector.js.map