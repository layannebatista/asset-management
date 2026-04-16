import { LLMClient } from '../../llm/LLMClient';
import { AnalysisRepository } from '../../storage/AnalysisRepository';
import { IncidentAnalysis, IncidentRequest } from '../../types/analysis.types';
export declare class IncidentAnalyzer {
    private readonly llm;
    private readonly repository;
    constructor(llm: LLMClient, repository: AnalysisRepository);
    analyze(request: IncidentRequest): Promise<IncidentAnalysis>;
}
//# sourceMappingURL=IncidentAnalyzer.d.ts.map