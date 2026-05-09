/**
 * Masks sensitive data before it is sent to any external LLM API.
 * Never send tokens, passwords, PII, or credentials to OpenAI.
 */
export class SensitiveDataMasker {
  private static readonly PATTERNS: Array<{ pattern: RegExp; replacement: string }> = [
    // JWT tokens
    { pattern: /Bearer\s+[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+/gi, replacement: 'Bearer [TOKEN_MASKED]' },
    { pattern: /[A-Za-z0-9\-_]{20,}\.[A-Za-z0-9\-_]{20,}\.[A-Za-z0-9\-_]{20,}/g, replacement: '[JWT_MASKED]' },
    // API keys and secrets
    { pattern: /(?:api[_-]?key|secret|password|passwd|pwd|token|auth)["\s:=]+["']?[A-Za-z0-9\-_$@!%*#?&]{8,}["']?/gi, replacement: '[CREDENTIAL_MASKED]' },
    // Database connection strings
    { pattern: /(?:jdbc:|postgresql:|mysql:|mongodb:)[^\s"',)]+/gi, replacement: '[DB_CONNECTION_MASKED]' },
    // Email addresses (partial mask – keep domain for debugging)
    { pattern: /[a-zA-Z0-9._%+\-]+@([a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/g, replacement: '[EMAIL]@$1' },
    // Private IP addresses in error stacks that leak infra topology
    { pattern: /\b10\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, replacement: '[PRIVATE_IP]' },
    { pattern: /\b172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}\b/g, replacement: '[PRIVATE_IP]' },
    { pattern: /\b192\.168\.\d{1,3}\.\d{1,3}\b/g, replacement: '[PRIVATE_IP]' },
    // AWS/GCP/Azure keys
    { pattern: /AKIA[0-9A-Z]{16}/g, replacement: '[AWS_KEY_MASKED]' },
    // Generic long hex strings (potential secrets)
    { pattern: /\b[0-9a-fA-F]{32,64}\b/g, replacement: '[HEX_SECRET_MASKED]' },
  ];

  static mask(input: string): string {
    return SensitiveDataMasker.PATTERNS.reduce(
      (text, { pattern, replacement }) => text.replace(pattern, replacement),
      input,
    );
  }

  static maskObject<T>(obj: T): T {
    const serialized = JSON.stringify(obj);
    const masked = SensitiveDataMasker.mask(serialized);
    return JSON.parse(masked) as T;
  }

  /**
   * Masks a log line array, truncating each line to avoid sending huge stacks.
   */
  static maskLogs(logs: string[], maxLineLength = 300): string[] {
    return logs
      .map((line) => SensitiveDataMasker.mask(line))
      .map((line) => (line.length > maxLineLength ? `${line.slice(0, maxLineLength)}…` : line));
  }
}
