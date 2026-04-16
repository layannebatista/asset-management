"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentCoordinator = void 0;
const uuid_1 = require("uuid");
const PromptOptimizer_1 = require("../llm/PromptOptimizer");
const ContextFilter_1 = require("../context/ContextFilter");
const ContextPipeline_1 = require("../context/ContextPipeline");
const SensitiveDataMasker_1 = require("../context/SensitiveDataMasker");
const logger_1 = require("../api/logger");
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
class AgentCoordinator {
    llm;
    repository;
    prometheus;
    allure;
    github;
    backend;
    // Agents use a tighter budget (1200 tokens) – 4 run in parallel, keep quota low.
    // Jaccard threshold 0.65 is slightly more aggressive for agent calls.
    agentPipeline = new ContextPipeline_1.ContextPipeline(1200, 0.65);
    constructor(llm, repository, prometheus, allure, github, backend) {
        this.llm = llm;
        this.repository = repository;
        this.prometheus = prometheus;
        this.allure = allure;
        this.github = github;
        this.backend = backend;
    }
    async runAll() {
        const analysisId = (0, uuid_1.v4)();
        const start = Date.now();
        logger_1.logger.info('Starting multi-agent analysis', { analysisId });
        // All agents run concurrently
        const [devops, qa, backendAgent, architecture] = await Promise.allSettled([
            this.runDevOpsAgent(),
            this.runQAAgent(),
            this.runBackendAgent(),
            this.runArchitectureAgent(),
        ]);
        const agentReports = [
            devops.status === 'fulfilled' ? devops.value : this.failedReport('DevOps', devops.reason),
            qa.status === 'fulfilled' ? qa.value : this.failedReport('QA', qa.reason),
            backendAgent.status === 'fulfilled' ? backendAgent.value : this.failedReport('Backend', backendAgent.reason),
            architecture.status === 'fulfilled' ? architecture.value : this.failedReport('Architecture', architecture.reason),
        ];
        // Synthesis agent produces cross-cutting insights
        const { system, user } = PromptOptimizer_1.PromptOptimizer.agentSynthesis(agentReports);
        const synthesis = await this.llm.call({ systemPrompt: system, userPrompt: user });
        const synthesized = JSON.parse(synthesis.content);
        const result = {
            ...synthesized,
            agentReports,
            metadata: {
                analysisId,
                type: 'multi-agent',
                status: 'completed',
                model: synthesis.model,
                tokensUsed: synthesis.tokensUsed,
                durationMs: Date.now() - start,
                createdAt: new Date().toISOString(),
            },
        };
        await this.repository.save(result);
        logger_1.logger.info('Multi-agent analysis completed', { analysisId, durationMs: result.metadata.durationMs });
        return result;
    }
    async runDevOpsAgent() {
        const runs = await this.github.collectWorkflowRuns(7);
        const chunks = ContextFilter_1.ContextFilter.workflowRunsToChunks(runs);
        const budgetResult = this.agentPipeline.run(chunks, 'agent', 'devops-agent');
        const context = JSON.parse(budgetResult.contextJson);
        const response = await this.llm.call({
            systemPrompt: `You are a DevOps agent. Analyze CI/CD pipeline health and infrastructure.
Return JSON: {"agentName":"DevOps","domain":"CI/CD + Infrastructure","summary":"string","findings":[{"id":"string","severity":"critical|high|medium|low|info","title":"string","description":"string","affectedComponent":"string","evidence":"string"}],"recommendations":[{"priority":"immediate|short-term|long-term","action":"string","rationale":"string","estimatedImpact":"string"}],"confidence":number}`,
            userPrompt: `CI/CD data:\n${JSON.stringify(context)}`,
            useFallback: true,
            budgetStats: { estimatedTokens: budgetResult.estimatedTokens, droppedChunks: budgetResult.droppedChunks },
        });
        return JSON.parse(response.content);
    }
    async runQAAgent() {
        const [results, flakyNames] = await Promise.all([
            this.allure.collectResults(),
            this.allure.detectFlakyTests(),
        ]);
        const chunks = ContextFilter_1.ContextFilter.testResultsToChunks(results, flakyNames);
        const budgetResult = this.agentPipeline.run(chunks, 'agent', 'qa-agent');
        const context = JSON.parse(budgetResult.contextJson);
        const response = await this.llm.call({
            systemPrompt: `You are a QA agent specializing in Playwright and Cucumber test quality.
Return JSON: {"agentName":"QA","domain":"Test Automation","summary":"string","findings":[{"id":"string","severity":"critical|high|medium|low|info","title":"string","description":"string","affectedComponent":"string","evidence":"string"}],"recommendations":[{"priority":"immediate|short-term|long-term","action":"string","rationale":"string","estimatedImpact":"string"}],"confidence":number}`,
            userPrompt: `Test results:\n${JSON.stringify(context)}`,
            useFallback: true,
            budgetStats: { estimatedTokens: budgetResult.estimatedTokens, droppedChunks: budgetResult.droppedChunks },
        });
        return JSON.parse(response.content);
    }
    async runBackendAgent() {
        const metrics = await this.prometheus.collect(30);
        const chunks = ContextFilter_1.ContextFilter.metricsToChunks(metrics);
        const budgetResult = this.agentPipeline.run(chunks, 'agent', 'backend-agent');
        const context = JSON.parse(budgetResult.contextJson);
        const response = await this.llm.call({
            systemPrompt: `You are a Backend agent specializing in Spring Boot JVM performance and API health.
Return JSON: {"agentName":"Backend","domain":"Spring Boot + JVM","summary":"string","findings":[{"id":"string","severity":"critical|high|medium|low|info","title":"string","description":"string","affectedComponent":"string","evidence":"string"}],"recommendations":[{"priority":"immediate|short-term|long-term","action":"string","rationale":"string","estimatedImpact":"string"}],"confidence":number}`,
            userPrompt: `System metrics:\n${JSON.stringify(context)}`,
            useFallback: true,
            budgetStats: { estimatedTokens: budgetResult.estimatedTokens, droppedChunks: budgetResult.droppedChunks },
        });
        return JSON.parse(response.content);
    }
    async runArchitectureAgent() {
        const rawDomainData = await this.backend.collectDomainRiskData();
        const context = SensitiveDataMasker_1.SensitiveDataMasker.maskObject(rawDomainData);
        const response = await this.llm.call({
            systemPrompt: `You are an Architecture agent specializing in DDD, Clean Architecture, and domain consistency for an asset management system.
Return JSON: {"agentName":"Architecture","domain":"DDD + Clean Architecture","summary":"string","findings":[{"id":"string","severity":"critical|high|medium|low|info","title":"string","description":"string","affectedComponent":"string","evidence":"string"}],"recommendations":[{"priority":"immediate|short-term|long-term","action":"string","rationale":"string","estimatedImpact":"string"}],"confidence":number}`,
            userPrompt: `Domain statistics:\n${JSON.stringify(context, null, 2)}`,
            useFallback: true,
        });
        return JSON.parse(response.content);
    }
    failedReport(agentName, error) {
        logger_1.logger.error(`${agentName} agent failed`, { error });
        return {
            agentName,
            domain: 'unknown',
            summary: `Agent failed: ${error instanceof Error ? error.message : String(error)}`,
            findings: [],
            recommendations: [],
            confidence: 0,
        };
    }
}
exports.AgentCoordinator = AgentCoordinator;
//# sourceMappingURL=AgentCoordinator.js.map