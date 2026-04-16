import { LLMClient } from '../../llm/LLMClient';
import { BackendDataCollector } from '../../collectors/BackendDataCollector';
import { AnalysisRepository } from '../../storage/AnalysisRepository';
import { RiskAnalysis, RiskRequest } from '../../types/analysis.types';
export declare class RiskAnalyzer {
    private readonly llm;
    private readonly collector;
    private readonly repository;
    constructor(llm: LLMClient, collector: BackendDataCollector, repository: AnalysisRepository);
    analyze(request?: RiskRequest): Promise<RiskAnalysis>;
}
//# sourceMappingURL=RiskAnalyzer.d.ts.map