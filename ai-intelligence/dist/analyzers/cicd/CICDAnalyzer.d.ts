import { LLMClient } from '../../llm/LLMClient';
import { GitHubActionsCollector } from '../../collectors/GitHubActionsCollector';
import { AnalysisRepository } from '../../storage/AnalysisRepository';
import { CICDAnalysis, CICDRequest } from '../../types/analysis.types';
export declare class CICDAnalyzer {
    private readonly llm;
    private readonly collector;
    private readonly repository;
    private readonly pipeline;
    constructor(llm: LLMClient, collector: GitHubActionsCollector, repository: AnalysisRepository);
    analyze(request?: CICDRequest): Promise<CICDAnalysis>;
    private emptyResult;
}
//# sourceMappingURL=CICDAnalyzer.d.ts.map