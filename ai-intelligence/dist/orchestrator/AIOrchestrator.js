"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIOrchestrator = void 0;
const LLMClient_1 = require("../llm/LLMClient");
const PrometheusCollector_1 = require("../collectors/PrometheusCollector");
const AllureCollector_1 = require("../collectors/AllureCollector");
const GitHubActionsCollector_1 = require("../collectors/GitHubActionsCollector");
const BackendDataCollector_1 = require("../collectors/BackendDataCollector");
const ObservabilityAnalyzer_1 = require("../analyzers/observability/ObservabilityAnalyzer");
const TestIntelligenceAnalyzer_1 = require("../analyzers/test-intelligence/TestIntelligenceAnalyzer");
const CICDAnalyzer_1 = require("../analyzers/cicd/CICDAnalyzer");
const IncidentAnalyzer_1 = require("../analyzers/incident/IncidentAnalyzer");
const RiskAnalyzer_1 = require("../analyzers/risk/RiskAnalyzer");
const logger_1 = require("../api/logger");
/**
 * Central orchestration entry point.
 *
 * Wires up all dependencies and delegates to the appropriate analyzer.
 * All analyzers share the same LLMClient and repository instances
 * to allow connection pooling and centralised rate-limiting.
 */
class AIOrchestrator {
    llm;
    repository;
    observabilityAnalyzer;
    testIntelligenceAnalyzer;
    cicdAnalyzer;
    incidentAnalyzer;
    riskAnalyzer;
    constructor(repository) {
        this.llm = new LLMClient_1.LLMClient();
        this.repository = repository;
        const prometheus = new PrometheusCollector_1.PrometheusCollector();
        const allure = new AllureCollector_1.AllureCollector();
        const github = new GitHubActionsCollector_1.GitHubActionsCollector();
        const backend = new BackendDataCollector_1.BackendDataCollector();
        this.observabilityAnalyzer = new ObservabilityAnalyzer_1.ObservabilityAnalyzer(this.llm, prometheus, repository);
        this.testIntelligenceAnalyzer = new TestIntelligenceAnalyzer_1.TestIntelligenceAnalyzer(this.llm, allure, repository);
        this.cicdAnalyzer = new CICDAnalyzer_1.CICDAnalyzer(this.llm, github, repository);
        this.incidentAnalyzer = new IncidentAnalyzer_1.IncidentAnalyzer(this.llm, repository);
        this.riskAnalyzer = new RiskAnalyzer_1.RiskAnalyzer(this.llm, backend, repository);
    }
    async analyze(request) {
        logger_1.logger.info('AIOrchestrator dispatching analysis', { type: request.type });
        switch (request.type) {
            case 'observability':
                return this.observabilityAnalyzer.analyze(request);
            case 'test-intelligence':
                return this.testIntelligenceAnalyzer.analyze(request);
            case 'cicd':
                return this.cicdAnalyzer.analyze(request);
            case 'incident':
                return this.incidentAnalyzer.analyze(request);
            case 'risk':
                return this.riskAnalyzer.analyze(request);
            default: {
                const exhaustive = request;
                throw new Error(`Unknown analysis type: ${exhaustive.type}`);
            }
        }
    }
    async getHistory(type, limit = 20) {
        return this.repository.findRecent(type, limit);
    }
    async getById(analysisId) {
        return this.repository.findById(analysisId);
    }
}
exports.AIOrchestrator = AIOrchestrator;
//# sourceMappingURL=AIOrchestrator.js.map