import { LLMClient } from '../../llm/LLMClient';
import { PrometheusCollector } from '../../collectors/PrometheusCollector';
import { AnalysisRepository } from '../../storage/AnalysisRepository';
import { ObservabilityAnalysis, ObservabilityRequest } from '../../types/analysis.types';
export declare class ObservabilityAnalyzer {
    private readonly llm;
    private readonly collector;
    private readonly repository;
    private readonly pipeline;
    constructor(llm: LLMClient, collector: PrometheusCollector, repository: AnalysisRepository);
    analyze(request?: ObservabilityRequest): Promise<ObservabilityAnalysis>;
}
//# sourceMappingURL=ObservabilityAnalyzer.d.ts.map