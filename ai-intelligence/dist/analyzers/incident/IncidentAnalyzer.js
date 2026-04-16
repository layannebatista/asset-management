"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IncidentAnalyzer = void 0;
const uuid_1 = require("uuid");
const PromptOptimizer_1 = require("../../llm/PromptOptimizer");
const SensitiveDataMasker_1 = require("../../context/SensitiveDataMasker");
const logger_1 = require("../../api/logger");
class IncidentAnalyzer {
    llm;
    repository;
    constructor(llm, repository) {
        this.llm = llm;
        this.repository = repository;
    }
    async analyze(request) {
        const analysisId = (0, uuid_1.v4)();
        const start = Date.now();
        logger_1.logger.info('Starting incident analysis', { analysisId, logCount: request.logs.length });
        // Mask all sensitive data before it reaches the LLM
        const maskedLogs = SensitiveDataMasker_1.SensitiveDataMasker.maskLogs(request.logs, 300);
        const maskedErrors = SensitiveDataMasker_1.SensitiveDataMasker.maskLogs(request.errorMessages ?? [], 400);
        const context = {
            logSample: maskedLogs.slice(0, 50),
            errorMessages: maskedErrors.slice(0, 20),
            totalLogsProvided: request.logs.length,
            timeWindowMinutes: request.timeWindowMinutes ?? 15,
            systemContext: {
                framework: 'Spring Boot 3 + Clean Architecture',
                layers: ['domain', 'application', 'infrastructure', 'security', 'interfaces/rest'],
                database: 'PostgreSQL',
                authMethod: 'JWT + MFA',
            },
        };
        const { system, user } = PromptOptimizer_1.PromptOptimizer.incident(context);
        const llmResponse = await this.llm.call({
            systemPrompt: system,
            userPrompt: user,
        });
        const parsed = JSON.parse(llmResponse.content);
        const result = {
            ...parsed,
            metadata: {
                analysisId,
                type: 'incident',
                status: 'completed',
                model: llmResponse.model,
                tokensUsed: llmResponse.tokensUsed,
                durationMs: Date.now() - start,
                createdAt: new Date().toISOString(),
                dataWindowMinutes: request.timeWindowMinutes,
            },
        };
        await this.repository.save(result);
        logger_1.logger.info('Incident analysis completed', { analysisId, severity: result.severity });
        return result;
    }
}
exports.IncidentAnalyzer = IncidentAnalyzer;
//# sourceMappingURL=IncidentAnalyzer.js.map