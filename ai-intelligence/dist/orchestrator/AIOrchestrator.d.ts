import { AnalysisRepository } from '../storage/AnalysisRepository';
import { AnalysisResult, AnalysisType, ObservabilityRequest, TestIntelligenceRequest, CICDRequest, IncidentRequest, RiskRequest } from '../types/analysis.types';
type AnalysisRequest = ({
    type: 'observability';
} & ObservabilityRequest) | ({
    type: 'test-intelligence';
} & TestIntelligenceRequest) | ({
    type: 'cicd';
} & CICDRequest) | ({
    type: 'incident';
} & IncidentRequest) | ({
    type: 'risk';
} & RiskRequest);
/**
 * Central orchestration entry point.
 *
 * Wires up all dependencies and delegates to the appropriate analyzer.
 * All analyzers share the same LLMClient and repository instances
 * to allow connection pooling and centralised rate-limiting.
 */
export declare class AIOrchestrator {
    private readonly llm;
    private readonly repository;
    private readonly observabilityAnalyzer;
    private readonly testIntelligenceAnalyzer;
    private readonly cicdAnalyzer;
    private readonly incidentAnalyzer;
    private readonly riskAnalyzer;
    constructor(repository: AnalysisRepository);
    analyze(request: AnalysisRequest): Promise<AnalysisResult>;
    getHistory(type?: AnalysisType, limit?: number): Promise<AnalysisResult[]>;
    getById(analysisId: string): Promise<AnalysisResult | null>;
}
export {};
//# sourceMappingURL=AIOrchestrator.d.ts.map