import { LLMClient } from '../../llm/LLMClient';
import { AllureCollector } from '../../collectors/AllureCollector';
import { AnalysisRepository } from '../../storage/AnalysisRepository';
import { TestIntelligenceAnalysis, TestIntelligenceRequest } from '../../types/analysis.types';
export declare class TestIntelligenceAnalyzer {
    private readonly llm;
    private readonly collector;
    private readonly repository;
    private readonly pipeline;
    constructor(llm: LLMClient, collector: AllureCollector, repository: AnalysisRepository);
    analyze(request?: TestIntelligenceRequest): Promise<TestIntelligenceAnalysis>;
    private filterBySuite;
}
//# sourceMappingURL=TestIntelligenceAnalyzer.d.ts.map