"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestIntelligenceAnalyzer = void 0;
const uuid_1 = require("uuid");
const PromptOptimizer_1 = require("../../llm/PromptOptimizer");
const ContextFilter_1 = require("../../context/ContextFilter");
const ContextPipeline_1 = require("../../context/ContextPipeline");
const logger_1 = require("../../api/logger");
class TestIntelligenceAnalyzer {
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
        const projectId = request.projectId ?? 'default';
        const start = Date.now();
        logger_1.logger.info('Starting test intelligence analysis', { analysisId, projectId });
        const [allResults, flakyNames] = await Promise.all([
            this.collector.collectResults(projectId),
            this.collector.detectFlakyTests(projectId),
        ]);
        const results = request.suite && request.suite !== 'all'
            ? this.filterBySuite(allResults, request.suite)
            : allResults;
        // Decompose into scored chunks
        const chunks = ContextFilter_1.ContextFilter.testResultsToChunks(results, flakyNames);
        // Add suite/project context as a cheap metadata chunk
        chunks.push({
            key: 'requestMeta',
            data: { projectId, suite: request.suite ?? 'all' },
            baseRelevance: 0.4,
        });
        // SDD → RTK budget: dedup near-duplicate error messages, then rank by relevance
        const budgetResult = this.pipeline.run(chunks, 'test-intelligence', analysisId);
        const context = JSON.parse(budgetResult.contextJson);
        const { system, user } = PromptOptimizer_1.PromptOptimizer.testIntelligence(context);
        const llmResponse = await this.llm.call({
            systemPrompt: system,
            userPrompt: user,
            useFallback: results.length < 20,
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
                type: 'test-intelligence',
                status: 'completed',
                model: llmResponse.model,
                tokensUsed: llmResponse.tokensUsed,
                durationMs: Date.now() - start,
                createdAt: new Date().toISOString(),
            },
        };
        await this.repository.save(result);
        logger_1.logger.info('Test intelligence analysis completed', {
            analysisId,
            totalTests: result.totalTests,
            contextTokensEstimated: budgetResult.estimatedTokens,
        });
        return result;
    }
    filterBySuite(results, suite) {
        const parentSuiteLabel = suite === 'backend' ? 'Backend' : 'Frontend';
        return results.filter((r) => r.labels.some((l) => (l.name === 'parentSuite' || l.name === 'suite') && l.value.includes(parentSuiteLabel)));
    }
}
exports.TestIntelligenceAnalyzer = TestIntelligenceAnalyzer;
//# sourceMappingURL=TestIntelligenceAnalyzer.js.map