import { describe, it, expect, beforeEach, vi } from '@jest/globals';
import { Logger } from 'winston';
import { SecureRouter } from '../../src/security/SecureRouter';
import { SecurityClassifier } from '../../src/security/SecurityClassifier';
import { ModelRouter } from '../../src/routing/ModelRouter';
import { AnalysisType } from '../../src/types/analysis.types';

describe('SecureRouter', () => {
  let secureRouter: SecureRouter;
  let mockClassifier: jest.Mocked<SecurityClassifier>;
  let mockModelRouter: jest.Mocked<ModelRouter>;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    mockClassifier = {
      classify: vi.fn(),
      mask: vi.fn(),
      extract: vi.fn(),
    } as unknown as jest.Mocked<SecurityClassifier>;

    mockModelRouter = {
      route: vi.fn().mockReturnValue({
        modelName: 'gpt-4o',
        temperature: 0.7,
        costEstimate: 0.03,
      }),
    } as unknown as jest.Mocked<ModelRouter>;

    mockLogger = {
      info: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
      error: vi.fn(),
    } as unknown as jest.Mocked<Logger>;

    secureRouter = new SecureRouter(mockClassifier, mockModelRouter, mockLogger);
  });

  describe('routeSecurely', () => {
    it('should allow cloud model for PUBLIC data', async () => {
      mockClassifier.classify.mockResolvedValue({
        level: 'public',
        method: 'rule',
        confidence: 0.95,
        patterns: [],
      });

      const context = 'This is public information';
      const decision = await secureRouter.routeSecurely(
        AnalysisType.OBSERVABILITY,
        context,
        100,
      );

      expect(decision.sensitivity).toBe('public');
      expect(decision.masked).toBe(false);
      expect(mockClassifier.mask).not.toHaveBeenCalled();
    });

    it('should mask CONFIDENTIAL data before cloud model', async () => {
      mockClassifier.classify.mockResolvedValue({
        level: 'confidential',
        method: 'rule',
        confidence: 0.95,
        patterns: ['nda'],
      });

      mockClassifier.mask.mockReturnValue('Text with [REDACTED] data');

      const context = 'This is under NDA';
      const decision = await secureRouter.routeSecurely(
        AnalysisType.INCIDENT,
        context,
        100,
      );

      expect(decision.sensitivity).toBe('confidential');
      expect(decision.masked).toBe(true);
      expect(mockClassifier.mask).toHaveBeenCalledWith(context, 'confidential');
    });

    it('should use local model for RESTRICTED (PII) data', async () => {
      mockClassifier.classify.mockResolvedValue({
        level: 'restricted',
        method: 'rule',
        confidence: 0.95,
        patterns: ['cpf', 'email'],
      });

      mockClassifier.mask.mockReturnValue('Masked data with [REDACTED]');

      const context = 'CPF: 123.456.789-00 and email: user@example.com';
      const decision = await secureRouter.routeSecurely(
        AnalysisType.RISK,
        context,
        200,
      );

      expect(decision.sensitivity).toBe('restricted');
      expect(decision.masked).toBe(true);
      expect(decision.reason).toContain('PII/LGPD');
      expect(mockClassifier.mask).toHaveBeenCalled();
    });

    it('should include audit log in decision', async () => {
      mockClassifier.classify.mockResolvedValue({
        level: 'internal',
        method: 'rule',
        confidence: 0.95,
        patterns: [],
      });

      const context = 'Internal company data';
      const decision = await secureRouter.routeSecurely(
        AnalysisType.OBSERVABILITY,
        context,
        100,
      );

      expect(decision.auditLog).toBeDefined();
      expect(decision.auditLog.timestamp).toBeInstanceOf(Date);
      expect(decision.auditLog.classification).toBeDefined();
      expect(decision.auditLog.decision).toBeDefined();
    });

    it('should pass masked context to ModelRouter', async () => {
      const originalContext = 'CPF: 123.456.789-00';
      const maskedContext = 'CPF: [REDACTED]';

      mockClassifier.classify.mockResolvedValue({
        level: 'restricted',
        method: 'rule',
        confidence: 0.95,
        patterns: ['cpf'],
      });

      mockClassifier.mask.mockReturnValue(maskedContext);

      await secureRouter.routeSecurely(
        AnalysisType.INCIDENT,
        originalContext,
        100,
      );

      // Verificar que ModelRouter foi chamado com o tamanho do contexto mascarado
      expect(mockModelRouter.route).toHaveBeenCalledWith(
        expect.objectContaining({
          contextSize: maskedContext.length,
        }),
      );
    });

    it('should return proper decision structure', async () => {
      mockClassifier.classify.mockResolvedValue({
        level: 'public',
        method: 'rule',
        confidence: 0.95,
        patterns: [],
      });

      const decision = await secureRouter.routeSecurely(
        AnalysisType.OBSERVABILITY,
        'Public info',
        100,
      );

      expect(decision).toHaveProperty('model');
      expect(decision).toHaveProperty('sensitivity');
      expect(decision).toHaveProperty('masked');
      expect(decision).toHaveProperty('maskedContext');
      expect(decision).toHaveProperty('reason');
      expect(decision).toHaveProperty('auditLog');
    });
  });

  describe('extractSensitiveData', () => {
    it('should extract and count sensitive patterns', () => {
      mockClassifier.extract.mockReturnValue([
        { level: 'restricted', matches: ['123.456.789-00', 'user@example.com'] },
        { level: 'confidential', matches: ['nda'] },
      ]);

      const context = 'CPF: 123.456.789-00 under NDA';
      const extracted = secureRouter.extractSensitiveData(context);

      expect(extracted).toHaveLength(2);
      expect(extracted[0].level).toBe('restricted');
      expect(extracted[0].count).toBe(2);
      expect(extracted[0].examples.length).toBeGreaterThan(0);
    });

    it('should limit examples to first 3', () => {
      mockClassifier.extract.mockReturnValue([
        {
          level: 'restricted',
          matches: ['match1', 'match2', 'match3', 'match4', 'match5'],
        },
      ]);

      const extracted = secureRouter.extractSensitiveData('text');

      expect(extracted[0].examples).toHaveLength(3);
    });
  });

  describe('isSafeFor', () => {
    it('should allow all data for local models', () => {
      mockClassifier.extract.mockReturnValue([
        { level: 'restricted', matches: ['cpf'] },
      ]);

      const result = secureRouter.isSafeFor('CPF: 123.456.789-00', 'local-llm', 'enterprise');

      expect(result.safe).toBe(true);
      expect(result.reason).toContain('local');
    });

    it('should reject RESTRICTED data for cloud models', () => {
      mockClassifier.extract.mockReturnValue([
        { level: 'restricted', matches: ['cpf'] },
      ]);

      const result = secureRouter.isSafeFor(
        'CPF: 123.456.789-00',
        'gpt-4o',
        'enterprise',
      );

      expect(result.safe).toBe(false);
      expect(result.reason).toContain('RESTRICTED');
      expect(result.reason).toContain('local');
    });

    it('should allow non-RESTRICTED data for cloud models', () => {
      mockClassifier.extract.mockReturnValue([
        { level: 'public', matches: [] },
      ]);

      const result = secureRouter.isSafeFor('Public information', 'gpt-4o', 'free');

      expect(result.safe).toBe(true);
      expect(result.reason).toContain('safe');
    });
  });

  describe('auditAccess', () => {
    it('should log audit entry', () => {
      secureRouter.auditAccess('user123', AnalysisType.INCIDENT, 'restricted', 'mask');

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Auditoria de acesso a dados sensíveis',
        expect.objectContaining({
          userId: 'user123',
          analysisType: AnalysisType.INCIDENT,
          sensitivity: 'restricted',
          action: 'mask',
        }),
      );
    });

    it('should log different actions', () => {
      const actions: Array<'classify' | 'mask' | 'extract'> = [
        'classify',
        'mask',
        'extract',
      ];

      actions.forEach((action) => {
        secureRouter.auditAccess('user123', AnalysisType.RISK, 'confidential', action);
      });

      expect(mockLogger.warn).toHaveBeenCalledTimes(3);
    });
  });

  describe('Integration scenarios', () => {
    it('should handle incident with PII correctly', async () => {
      mockClassifier.classify.mockResolvedValue({
        level: 'restricted',
        method: 'rule',
        confidence: 0.95,
        patterns: ['cpf', 'email'],
      });

      mockClassifier.mask.mockReturnValue(
        'Incident: Database leak - CPF: [REDACTED], Email: [REDACTED]',
      );

      const incident = `
        Incident: Database leak
        - Affected CPF: 123.456.789-00
        - Admin email: admin@company.com
      `;

      const decision = await secureRouter.routeSecurely(
        AnalysisType.INCIDENT,
        incident,
        200,
      );

      expect(decision.masked).toBe(true);
      expect(decision.sensitivity).toBe('restricted');
      expect(mockClassifier.mask).toHaveBeenCalled();
    });

    it('should handle observability analysis safely', async () => {
      mockClassifier.classify.mockResolvedValue({
        level: 'internal',
        method: 'rule',
        confidence: 0.95,
        patterns: [],
      });

      const metrics = 'CPU: 80%, Memory: 75%, Latency p95: 500ms';

      const decision = await secureRouter.routeSecurely(
        AnalysisType.OBSERVABILITY,
        metrics,
        100,
      );

      expect(decision.sensitivity).toBe('internal');
      expect(decision.masked).toBe(false);
    });
  });
});
