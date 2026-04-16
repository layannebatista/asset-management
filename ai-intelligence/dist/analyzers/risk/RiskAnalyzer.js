"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RiskAnalyzer = void 0;
const uuid_1 = require("uuid");
const PromptOptimizer_1 = require("../../llm/PromptOptimizer");
const logger_1 = require("../../api/logger");
class RiskAnalyzer {
    llm;
    collector;
    repository;
    constructor(llm, collector, repository) {
        this.llm = llm;
        this.collector = collector;
        this.repository = repository;
    }
    async analyze(request = {}) {
        const analysisId = (0, uuid_1.v4)();
        const start = Date.now();
        logger_1.logger.info('Starting domain risk analysis', { analysisId });
        // Collect structured domain metadata (already masked at collection time)
        const domainData = await this.collector.collectDomainRiskData();
        const context = {
            ...domainData,
            requestedDomains: request.domains ?? ['asset', 'transfer', 'maintenance', 'depreciation', 'insurance', 'inventory'],
            focusedAssetIds: request.assetIds?.slice(0, 10) ?? [],
            systemContext: {
                assetStatuses: ['AVAILABLE', 'ASSIGNED', 'MAINTENANCE', 'DISPOSED'],
                lifecycle: 'assets move through statuses via transfers and maintenance orders',
                financialRules: 'depreciation is computed monthly; insurance must cover active assets',
            },
        };
        const { system, user } = PromptOptimizer_1.PromptOptimizer.risk(context);
        const llmResponse = await this.llm.call({
            systemPrompt: system,
            userPrompt: user,
        });
        const parsed = JSON.parse(llmResponse.content);
        const result = {
            ...parsed,
            metadata: {
                analysisId,
                type: 'risk',
                status: 'completed',
                model: llmResponse.model,
                tokensUsed: llmResponse.tokensUsed,
                durationMs: Date.now() - start,
                createdAt: new Date().toISOString(),
            },
        };
        await this.repository.save(result);
        logger_1.logger.info('Risk analysis completed', {
            analysisId,
            riskScore: result.overallRiskScore,
            riskLevel: result.riskLevel,
        });
        return result;
    }
}
exports.RiskAnalyzer = RiskAnalyzer;
//# sourceMappingURL=RiskAnalyzer.js.map