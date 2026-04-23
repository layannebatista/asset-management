import { v4 as uuidv4 } from 'uuid';
import { LLMClient } from '../../llm/LLMClient';
import { PromptOptimizer } from '../../llm/PromptOptimizer';
import { SensitiveDataMasker } from '../../context/SensitiveDataMasker';
import { AnalysisRepository } from '../../storage/AnalysisRepository';
import { IncidentAnalysis, IncidentRequest } from '../../types/analysis.types';
import { logger } from '../../api/logger';

export class IncidentAnalyzer {
  constructor(
    private readonly llm: LLMClient,
    private readonly repository: AnalysisRepository,
  ) {}

  async analyze(request: IncidentRequest): Promise<IncidentAnalysis> {
    const analysisId = uuidv4();
    const start = Date.now();

    logger.info('Starting incident analysis', { analysisId, logCount: request.logs.length });

    // Mask all sensitive data before it reaches the LLM
    const maskedLogs = SensitiveDataMasker.maskLogs(request.logs, 300);
    const maskedErrors = SensitiveDataMasker.maskLogs(request.errorMessages ?? [], 400);

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

    const { system, user } = PromptOptimizer.incident(context);

    const llmResponse = await this.llm.call({
      systemPrompt: system,
      userPrompt: user,
    });

    const parsed = JSON.parse(llmResponse.content) as Omit<IncidentAnalysis, 'metadata'>;

    const result: IncidentAnalysis = {
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
    logger.info('Incident analysis completed', { analysisId, severity: result.severity });

    return result;
  }
}
