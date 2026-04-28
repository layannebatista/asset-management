import { describe, it, expect, beforeEach, vi } from '@jest/globals';
import { Logger } from 'winston';
import { SecurityClassifier, SensitivityLevel } from '../../src/security/SecurityClassifier';
import { LLMClient } from '../../src/clients/LLMClient';

describe('SecurityClassifier', () => {
  let classifier: SecurityClassifier;
  let mockLLM: jest.Mocked<LLMClient>;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    mockLLM = {
      call: vi.fn(),
    } as unknown as jest.Mocked<LLMClient>;

    mockLogger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    } as unknown as jest.Mocked<Logger>;

    classifier = new SecurityClassifier(mockLLM, mockLogger);
  });

  describe('classify', () => {
    it('should detect CPF (pattern-based)', async () => {
      const text = 'CPF: 123.456.789-00';
      const result = await classifier.classify(text);

      expect(result.level).toBe(SensitivityLevel.RESTRICTED);
      expect(result.method).toBe('rule');
      expect(result.confidence).toBe(0.95);
    });

    it('should detect CNPJ (pattern-based)', async () => {
      const text = 'CNPJ: 00.000.000/0000-00';
      const result = await classifier.classify(text);

      expect(result.level).toBe(SensitivityLevel.RESTRICTED);
      expect(result.method).toBe('rule');
    });

    it('should detect email (pattern-based)', async () => {
      const text = 'User email is john.doe@example.com';
      const result = await classifier.classify(text);

      expect(result.level).toBe(SensitivityLevel.RESTRICTED);
      expect(result.method).toBe('rule');
    });

    it('should detect phone number (pattern-based)', async () => {
      const text = 'Call me at (11) 98765-4321';
      const result = await classifier.classify(text);

      expect(result.level).toBe(SensitivityLevel.RESTRICTED);
      expect(result.method).toBe('rule');
    });

    it('should detect password/token (pattern-based)', async () => {
      const text = 'password: super_secret_123';
      const result = await classifier.classify(text);

      expect(result.level).toBe(SensitivityLevel.RESTRICTED);
      expect(result.method).toBe('rule');
    });

    it('should detect credit card (pattern-based)', async () => {
      const text = 'Card: 4532-1234-5678-9010';
      const result = await classifier.classify(text);

      expect(result.level).toBe(SensitivityLevel.RESTRICTED);
      expect(result.method).toBe('rule');
    });

    it('should detect confidential data', async () => {
      const text = 'This is under NDA and confidential';
      const result = await classifier.classify(text);

      expect(result.level).toBe(SensitivityLevel.CONFIDENTIAL);
      expect(result.method).toBe('rule');
    });

    it('should detect internal data', async () => {
      const text = 'Internal only - Patrimônio 360 team info';
      const result = await classifier.classify(text);

      expect(result.level).toBe(SensitivityLevel.INTERNAL);
      expect(result.method).toBe('rule');
    });

    it('should use LLM for ambiguous cases', async () => {
      mockLLM.call.mockResolvedValue({
        content: JSON.stringify({ level: SensitivityLevel.PUBLIC }),
      });

      const text = 'This is just regular public information';
      const result = await classifier.classify(text);

      expect(result.method).toBe('llm');
      expect(result.level).toBe(SensitivityLevel.PUBLIC);
      expect(mockLLM.call).toHaveBeenCalled();
    });

    it('should default to RESTRICTED on LLM error', async () => {
      mockLLM.call.mockRejectedValue(new Error('LLM error'));

      const text = 'Some ambiguous text';
      const result = await classifier.classify(text);

      expect(result.level).toBe(SensitivityLevel.RESTRICTED);
      expect(result.method).toBe('rule');
    });
  });

  describe('mask', () => {
    it('should not mask PUBLIC data', () => {
      const text = 'This is public information';
      const masked = classifier.mask(text, SensitivityLevel.PUBLIC);

      expect(masked).toBe(text);
    });

    it('should mask RESTRICTED data', () => {
      const text = 'CPF: 123.456.789-00 and email: user@example.com';
      const masked = classifier.mask(text, SensitivityLevel.RESTRICTED);

      expect(masked).not.toContain('123.456.789-00');
      expect(masked).not.toContain('user@example.com');
      expect(masked).toContain('[REDACTED]');
    });

    it('should mask CONFIDENTIAL data', () => {
      const text = 'This is confidential information';
      const masked = classifier.mask(text, SensitivityLevel.CONFIDENTIAL);

      expect(masked).toContain('[REDACTED]');
    });

    it('should mask all patterns for high sensitivity', () => {
      const text =
        'CPF: 123.456.789-00, email: user@example.com, password: secret123';
      const masked = classifier.mask(text);

      expect(masked.match(/\[REDACTED\]/g)?.length).toBeGreaterThan(2);
    });
  });

  describe('maskPartial', () => {
    it('should mask only RESTRICTED patterns', () => {
      const text = 'CPF: 123.456.789-00 and confidential info';
      const masked = classifier.maskPartial(text, [SensitivityLevel.RESTRICTED]);

      expect(masked).toContain('[REDACTED]'); // CPF masked
      expect(masked).toContain('confidential'); // But confidential not masked
    });

    it('should mask multiple levels', () => {
      const text = 'CPF: 123.456.789-00 and confidential data';
      const masked = classifier.maskPartial(text, [
        SensitivityLevel.RESTRICTED,
        SensitivityLevel.CONFIDENTIAL,
      ]);

      expect(masked.match(/\[REDACTED\]/g)?.length).toBe(2);
    });
  });

  describe('extract', () => {
    it('should extract RESTRICTED patterns', () => {
      const text = 'User has CPF: 123.456.789-00 and email: user@example.com';
      const extracted = classifier.extract(text);

      const restrictedLevel = extracted.find(
        (e) => e.level === SensitivityLevel.RESTRICTED,
      );
      expect(restrictedLevel).toBeDefined();
      expect(restrictedLevel?.matches.length).toBeGreaterThan(0);
    });

    it('should extract multiple levels', () => {
      const text =
        'CPF: 123.456.789-00 and this is confidential under NDA';
      const extracted = classifier.extract(text);

      expect(extracted.length).toBeGreaterThan(1);
    });

    it('should remove duplicates', () => {
      const text = 'email: user@example.com and email: user@example.com';
      const extracted = classifier.extract(text);

      const matches = extracted.find((e) => e.level === SensitivityLevel.RESTRICTED)
        ?.matches;
      expect(matches?.length).toBeLessThanOrEqual(1);
    });
  });

  describe('Real-world scenarios', () => {
    it('should handle log entries with PII', async () => {
      const logEntry = `
        [2026-01-15T10:30:00Z] User creation event
        - CPF: 123.456.789-00
        - Email: john.doe@company.com
        - Phone: (11) 98765-4321
        - Status: SUCCESS
      `;

      const result = await classifier.classify(logEntry);
      expect(result.level).toBe(SensitivityLevel.RESTRICTED);

      const extracted = classifier.extract(logEntry);
      expect(extracted.some((e) => e.level === SensitivityLevel.RESTRICTED)).toBe(
        true,
      );

      const masked = classifier.mask(logEntry);
      expect(masked).not.toContain('123.456.789-00');
      expect(masked).not.toContain('john.doe@company.com');
    });

    it('should handle incident reports with sensitive data', async () => {
      const incident = `
        Incident: Database leak

        Affected data:
        - Customer CPF: 987.654.321-00
        - Login: admin_user
        - API Key: sk_live_abc123def456

        Scope: 5000 customer records
      `;

      const result = await classifier.classify(incident);
      expect(result.level).toBe(SensitivityLevel.RESTRICTED);

      const masked = classifier.mask(incident);
      expect(masked).not.toContain('987.654.321-00');
      expect(masked).not.toContain('sk_live_abc123def456');
    });

    it('should handle mixed sensitivity levels', async () => {
      const text = `
        Internal memo (Patrimônio 360 only):

        This is confidential under NDA.
        Customer CPF: 123.456.789-00

        Public information: Our service handles asset management.
      `;

      const extracted = classifier.extract(text);

      const hasRestricted = extracted.some(
        (e) => e.level === SensitivityLevel.RESTRICTED,
      );
      const hasConfidential = extracted.some(
        (e) => e.level === SensitivityLevel.CONFIDENTIAL,
      );
      const hasInternal = extracted.some(
        (e) => e.level === SensitivityLevel.INTERNAL,
      );

      expect(hasRestricted).toBe(true);
      expect(hasConfidential).toBe(true);
      expect(hasInternal).toBe(true);
    });
  });
});
