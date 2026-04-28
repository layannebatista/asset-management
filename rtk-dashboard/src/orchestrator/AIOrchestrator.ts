import { Pool } from 'pg';
import { LLMClient } from '../llm/LLMClient';
import { AnalysisRepository } from '../storage/AnalysisRepository';
import { PrometheusCollector } from '../collectors/PrometheusCollector';
import { AllureCollector } from '../collectors/AllureCollector';
import { GitHubActionsCollector } from '../collectors/GitHubActionsCollector';
import { BackendDataCollector } from '../collectors/BackendDataCollector';
import { TokenSavingsAnalyzer } from '../observability/TokenSavingsAnalyzer';
import { TokenSavingsRecorder } from '../observability/TokenSavingsRecorder';
import { ObservabilityAnalyzer } from '../analyzers/observability/ObservabilityAnalyzer';
import { TestIntelligenceAnalyzer } from '../analyzers/test-intelligence/TestIntelligenceAnalyzer';
import { CICDAnalyzer } from '../analyzers/cicd/CICDAnalyzer';
import { IncidentAnalyzer } from '../analyzers/incident/IncidentAnalyzer';
import { RiskAnalyzer } from '../analyzers/risk/RiskAnalyzer';
import {
  AnalysisResult,
  AnalysisType,
  ObservabilityRequest,
  TestIntelligenceRequest,
  CICDRequest,
  IncidentRequest,
  RiskRequest,
} from '../types/analysis.types';
import { logger } from '../api/logger';

type AnalysisRequest =
  | ({ type: 'observability' } & ObservabilityRequest)
  | ({ type: 'test-intelligence' } & TestIntelligenceRequest)
  | ({ type: 'cicd' } & CICDRequest)
  | ({ type: 'incident' } & IncidentRequest)
  | ({ type: 'risk' } & RiskRequest);

/**
 * Central orchestration entry point.
 *
 * Wires up all dependencies and delegates to the appropriate analyzer.
 * All analyzers share the same LLMClient and repository instances
 * to allow connection pooling and centralised rate-limiting.
 */
export class AIOrchestrator {
  private readonly llm: LLMClient;
  private readonly repository: AnalysisRepository;
  private readonly savingsRecorder: TokenSavingsRecorder;

  private readonly observabilityAnalyzer: ObservabilityAnalyzer;
  private readonly testIntelligenceAnalyzer: TestIntelligenceAnalyzer;
  private readonly cicdAnalyzer: CICDAnalyzer;
  private readonly incidentAnalyzer: IncidentAnalyzer;
  private readonly riskAnalyzer: RiskAnalyzer;

  constructor(repository?: AnalysisRepository, pgPool?: Pool) {
    this.llm = new LLMClient();
    this.repository = repository || new AnalysisRepository(pgPool);

    // Initialize token savings tracking
    const tokenSavingsAnalyzer = new TokenSavingsAnalyzer(pgPool, logger);
    this.savingsRecorder = new TokenSavingsRecorder(tokenSavingsAnalyzer, logger);

    const prometheus = new PrometheusCollector();
    const allure = new AllureCollector();
    const github = new GitHubActionsCollector();
    const backend = new BackendDataCollector();

    this.observabilityAnalyzer = new ObservabilityAnalyzer(this.llm, prometheus, repository, this.savingsRecorder);
    this.testIntelligenceAnalyzer = new TestIntelligenceAnalyzer(this.llm, allure, repository, this.savingsRecorder);
    this.cicdAnalyzer = new CICDAnalyzer(this.llm, github, repository, this.savingsRecorder);
    this.incidentAnalyzer = new IncidentAnalyzer(this.llm, repository, this.savingsRecorder);
    this.riskAnalyzer = new RiskAnalyzer(this.llm, backend, repository, this.savingsRecorder);
  }

  async analyze(request: AnalysisRequest): Promise<AnalysisResult> {
    logger.info('AIOrchestrator dispatching analysis', { type: request.type });

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
        const exhaustive: never = request;
        throw new Error(`Unknown analysis type: ${(exhaustive as { type: string }).type}`);
      }
    }
  }

  async getHistory(type?: AnalysisType, limit = 20): Promise<AnalysisResult[]> {
    return this.repository.findRecent(type, limit);
  }

  async getById(analysisId: string): Promise<AnalysisResult | null> {
    return this.repository.findById(analysisId);
  }
}
