"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ObservabilityAnalyzer = void 0;
const uuid_1 = require("uuid");
const PromptOptimizer_1 = require("../../llm/PromptOptimizer");
const ContextFilter_1 = require("../../context/ContextFilter");
const ContextPipeline_1 = require("../../context/ContextPipeline");
const logger_1 = require("../../api/logger");
class ObservabilityAnalyzer {
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
        const windowMinutes = request.windowMinutes ?? 30;
        const start = Date.now();
        logger_1.logger.info('Starting observability analysis', { analysisId, windowMinutes });
        // 1. Collect raw metrics from Prometheus
        const rawMetrics = await this.collector.collect(windowMinutes);
        // 2. Decompose into scored context chunks
        const chunks = ContextFilter_1.ContextFilter.metricsToChunks(rawMetrics);
        // 3. SDD → RTK budget: deduplicate redundant chunks, then rank by relevance within 2000 tokens
        const budgetResult = this.pipeline.run(chunks, 'observability', analysisId);
        // 4. Build optimized prompt using the budget-controlled context
        const context = JSON.parse(budgetResult.contextJson);
        const { system, user } = PromptOptimizer_1.PromptOptimizer.observability(context);
        // 5. Call LLM (pass budget stats for token efficiency logging)
        const llmResponse = await this.llm.call({
            systemPrompt: system,
            userPrompt: user,
            budgetStats: {
                estimatedTokens: budgetResult.estimatedTokens,
                droppedChunks: budgetResult.droppedChunks,
            },
        });
        // 6. Parse structured response
        const parsed = JSON.parse(llmResponse.content);
        const result = {
            ...parsed,
            metadata: {
                analysisId,
                type: 'observability',
                status: 'completed',
                model: llmResponse.model,
                tokensUsed: llmResponse.tokensUsed,
                durationMs: Date.now() - start,
                createdAt: new Date().toISOString(),
                dataWindowMinutes: windowMinutes,
            },
        };
        await this.repository.save(result);
        logger_1.logger.info('Observability analysis completed', {
            analysisId,
            durationMs: result.metadata.durationMs,
            contextTokensEstimated: budgetResult.estimatedTokens,
        });
        return result;
    }
}
exports.ObservabilityAnalyzer = ObservabilityAnalyzer;
//# sourceMappingURL=ObservabilityAnalyzer.js.map