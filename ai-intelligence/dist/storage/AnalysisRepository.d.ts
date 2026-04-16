import { AnalysisResult, AnalysisType } from '../types/analysis.types';
/**
 * Persists analysis results in the ai_intelligence PostgreSQL schema.
 * Uses connection pooling – one shared Pool per service instance.
 */
export declare class AnalysisRepository {
    private readonly pool;
    constructor();
    initialize(): Promise<void>;
    save(result: AnalysisResult): Promise<void>;
    findById(analysisId: string): Promise<AnalysisResult | null>;
    findRecent(type?: AnalysisType, limit?: number): Promise<AnalysisResult[]>;
    close(): Promise<void>;
}
//# sourceMappingURL=AnalysisRepository.d.ts.map