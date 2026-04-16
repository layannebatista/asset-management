"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CICDAnalyzer = void 0;
const uuid_1 = require("uuid");
const PromptOptimizer_1 = require("../../llm/PromptOptimizer");
const ContextFilter_1 = require("../../context/ContextFilter");
const ContextPipeline_1 = require("../../context/ContextPipeline");
const logger_1 = require("../../api/logger");
class CICDAnalyzer {
    llm;
    collector;
    repository;
    pipeline = new ContextPipeline_1.ContextPipeline(2000);
    constructor(llm, collector, repository) {
        this.llm = llm;
        this.collector = collector;
        this.repository = repository;
    }
    async analyze(request = {}) {
        const analysisId = (0, uuid_1.v4)();
        const lookbackDays = request.lookbackDays ?? 7;
        const start = Date.now();
        logger_1.logger.info('Starting CI/CD analysis', { analysisId, lookbackDays });
        const runs = await this.collector.collectWorkflowRuns(lookbackDays);
        if (runs.length === 0) {
            logger_1.logger.warn('No CI/CD runs found', { analysisId });
            return this.emptyResult(analysisId, Date.now() - start);
        }
        // Decompose into scored chunks
        const chunks = ContextFilter_1.ContextFilter.workflowRunsToChunks(runs);
        // SDD → RTK budget: dedup duplicate job entries, then rank by relevance
        const budgetResult = this.pipeline.run(chunks, 'cicd', analysisId);
        const context = JSON.parse(budgetResult.contextJson);
        const { system, user } = PromptOptimizer_1.PromptOptimizer.cicd(context);
        const llmResponse = await this.llm.call({
            systemPrompt: system,
            userPrompt: user,
            useFallback: runs.length < 5,
            budgetStats: {
                estimatedTokens: budgetResult.estimatedTokens,
                droppedChunks: budgetResult.droppedChunks,
            },
        });
        const parsed = JSON.parse(llmResponse.content);
        const result = {
            ...parsed,
            metadata: {
                analysisId,
                type: 'cicd',
                status: 'completed',
                model: llmResponse.model,
                tokensUsed: llmResponse.tokensUsed,
                durationMs: Date.now() - start,
                createdAt: new Date().toISOString(),
            },
        };
        await this.repository.save(result);
        logger_1.logger.info('CI/CD analysis completed', {
            analysisId,
            runsAnalyzed: runs.length,
            contextTokensEstimated: budgetResult.estimatedTokens,
        });
        return result;
    }
    emptyResult(analysisId, durationMs) {
        return {
            metadata: {
                analysisId,
                type: 'cicd',
                status: 'completed',
                model: 'none',
                durationMs,
                createdAt: new Date().toISOString(),
            },
            summary: 'No CI/CD runs found in the requested time window.',
            averagePipelineDurationMinutes: 0,
            successRate: 0,
            slowJobs: [],
            failureTrends: [],
            optimizationOpportunities: [],
        };
    }
}
exports.CICDAnalyzer = CICDAnalyzer;
//# sourceMappingURL=CICDAnalyzer.js.map