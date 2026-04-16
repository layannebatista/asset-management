/**
 * Builds and optimizes prompts for each analysis type.
 *
 * Design rules:
 * 1. System prompts define the AI's role, output schema, and constraints.
 * 2. User prompts contain the filtered, masked metadata snapshot.
 * 3. Output schemas are embedded directly – no separate schema file needed.
 * 4. Keep prompts under 3000 tokens to stay cost-efficient.
 */
export declare class PromptOptimizer {
    static observability(context: Record<string, unknown>): {
        system: string;
        user: string;
    };
    static testIntelligence(context: Record<string, unknown>): {
        system: string;
        user: string;
    };
    static cicd(context: Record<string, unknown>): {
        system: string;
        user: string;
    };
    static incident(context: Record<string, unknown>): {
        system: string;
        user: string;
    };
    static risk(context: Record<string, unknown>): {
        system: string;
        user: string;
    };
    static agentSynthesis(agentReports: unknown[]): {
        system: string;
        user: string;
    };
}
//# sourceMappingURL=PromptOptimizer.d.ts.map