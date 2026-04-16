/**
 * Masks sensitive data before it is sent to any external LLM API.
 * Never send tokens, passwords, PII, or credentials to OpenAI.
 */
export declare class SensitiveDataMasker {
    private static readonly PATTERNS;
    static mask(input: string): string;
    static maskObject<T>(obj: T): T;
    /**
     * Masks a log line array, truncating each line to avoid sending huge stacks.
     */
    static maskLogs(logs: string[], maxLineLength?: number): string[];
}
//# sourceMappingURL=SensitiveDataMasker.d.ts.map