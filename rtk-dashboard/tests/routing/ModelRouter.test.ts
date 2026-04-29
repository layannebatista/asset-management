/**
 * ModelRouter unit tests
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { createLogger } from 'winston';
import { ModelRouter } from '../../src/routing/ModelRouter';
import { AnalysisType, Criticality, RoutingContext } from '../../src/routing/RoutingContext';

describe('ModelRouter', () => {
  let router: ModelRouter;
  let logger = createLogger({
    silent: true, // Suppress logs in tests
  });

  beforeEach(() => {
    router = new ModelRouter(logger);
  });

  describe('Observability Routing', () => {
    it('should route small observability context to gpt-4o-mini', () => {
      const context: RoutingContext = {
        type: AnalysisType.OBSERVABILITY,
        contextSize: 500,
        criticality: Criticality.LOW,
        userTier: 'enterprise',
      };

      const decision = router.route(context);

      expect(decision.modelName).toBe('gpt-4o-mini');
      expect(decision.temperature).toBe(0.4);
      expect(decision.costEstimate).toBeLessThan(0.01);
    });

    it('should route medium observability context to gpt-4o', () => {
      const context: RoutingContext = {
        type: AnalysisType.OBSERVABILITY,
        contextSize: 1500,
        criticality: Criticality.NORMAL,
        userTier: 'enterprise',
      };

      const decision = router.route(context);

      expect(decision.modelName).toBe('gpt-4o');
      expect(decision.temperature).toBe(0.5);
    });

    it('should route large observability context to gpt-4o', () => {
      const context: RoutingContext = {
        type: AnalysisType.OBSERVABILITY,
        contextSize: 3000,
        criticality: Criticality.NORMAL,
        userTier: 'enterprise',
      };

      const decision = router.route(context);

      expect(decision.modelName).toBe('gpt-4o');
    });
  });

  describe('Incident Routing', () => {
    it('should route critical incident to o1-preview with large context', () => {
      const context: RoutingContext = {
        type: AnalysisType.INCIDENT,
        contextSize: 2500,
        criticality: Criticality.CRITICAL,
        userTier: 'enterprise',
      };

      const decision = router.route(context);

      expect(decision.modelName).toBe('o1-preview');
      expect(decision.temperature).toBe(0.2);
      expect(decision.costEstimate).toBeGreaterThan(0.1);
    });

    it('should route critical incident to gpt-4-turbo with small context', () => {
      const context: RoutingContext = {
        type: AnalysisType.INCIDENT,
        contextSize: 1000,
        criticality: Criticality.CRITICAL,
        userTier: 'enterprise',
      };

      const decision = router.route(context);

      expect(decision.modelName).toBe('gpt-4-turbo');
    });

    it('should route normal incident to gpt-4o', () => {
      const context: RoutingContext = {
        type: AnalysisType.INCIDENT,
        contextSize: 1500,
        criticality: Criticality.NORMAL,
        userTier: 'enterprise',
      };

      const decision = router.route(context);

      expect(decision.modelName).toBe('gpt-4o');
    });
  });

  describe('Risk Routing', () => {
    it('should route critical risk to gpt-4-turbo', () => {
      const context: RoutingContext = {
        type: AnalysisType.RISK,
        contextSize: 2000,
        criticality: Criticality.CRITICAL,
        userTier: 'enterprise',
      };

      const decision = router.route(context);

      expect(decision.modelName).toBe('gpt-4-turbo');
      expect(decision.temperature).toBe(0.2); // Low temperature for precision
    });

    it('should route normal risk to gpt-4o', () => {
      const context: RoutingContext = {
        type: AnalysisType.RISK,
        contextSize: 1500,
        criticality: Criticality.NORMAL,
        userTier: 'enterprise',
      };

      const decision = router.route(context);

      expect(decision.modelName).toBe('gpt-4o');
    });
  });

  describe('Test Intelligence Routing', () => {
    it('should route critical test intelligence to gpt-4-turbo', () => {
      const context: RoutingContext = {
        type: AnalysisType.TEST_INTELLIGENCE,
        contextSize: 2000,
        criticality: Criticality.CRITICAL,
        userTier: 'enterprise',
      };

      const decision = router.route(context);

      expect(decision.modelName).toBe('gpt-4-turbo');
    });

    it('should route large critical test intelligence to gpt-4-turbo', () => {
      const context: RoutingContext = {
        type: AnalysisType.TEST_INTELLIGENCE,
        contextSize: 3500,
        criticality: Criticality.HIGH,
        userTier: 'enterprise',
      };

      const decision = router.route(context);

      expect(decision.modelName).toBe('gpt-4-turbo');
      expect(decision.maxTokens).toBeGreaterThanOrEqual(2500);
    });

    it('should route normal test intelligence to gpt-4o', () => {
      const context: RoutingContext = {
        type: AnalysisType.TEST_INTELLIGENCE,
        contextSize: 1500,
        criticality: Criticality.NORMAL,
        userTier: 'enterprise',
      };

      const decision = router.route(context);

      expect(decision.modelName).toBe('gpt-4o');
    });
  });

  describe('CI/CD Routing', () => {
    it('should route high priority CI/CD to gpt-4o', () => {
      const context: RoutingContext = {
        type: AnalysisType.CICD,
        contextSize: 1500,
        criticality: Criticality.HIGH,
        userTier: 'enterprise',
      };

      const decision = router.route(context);

      expect(decision.modelName).toBe('gpt-4o');
    });

    it('should route normal CI/CD to gpt-4o-mini for cost savings', () => {
      const context: RoutingContext = {
        type: AnalysisType.CICD,
        contextSize: 800,
        criticality: Criticality.LOW,
        userTier: 'free',
      };

      const decision = router.route(context);

      expect(decision.modelName).toBe('gpt-4o-mini');
      expect(decision.costEstimate).toBeLessThan(0.01);
    });

    it('should route critical CI/CD to gpt-4o (quality over cost)', () => {
      const context: RoutingContext = {
        type: AnalysisType.CICD,
        contextSize: 1500,
        criticality: Criticality.CRITICAL,
        userTier: 'enterprise',
      };

      const decision = router.route(context);

      expect(decision.modelName).toBe('gpt-4o');
    });
  });

  describe('Constraint: Security Classification', () => {
    it('should route restricted data to local LLM', () => {
      const context: RoutingContext = {
        type: AnalysisType.INCIDENT,
        contextSize: 1000,
        criticality: Criticality.CRITICAL,
        userTier: 'enterprise',
        requiresLocalModel: true,
      };

      const decision = router.route(context);

      expect(decision.modelName).toBe('local-llama2');
      expect(decision.costEstimate).toBeLessThan(0.01);
    });
  });

  describe('Constraint: Free Tier', () => {
    it('should route critical to cheaper model for free tier', () => {
      const context: RoutingContext = {
        type: AnalysisType.INCIDENT,
        contextSize: 2000,
        criticality: Criticality.CRITICAL,
        userTier: 'free',
      };

      const decision = router.route(context);

      expect(decision.modelName).toBe('gpt-4o-mini');
    });
  });

  describe('Cost Optimization', () => {
    it('should produce lower cost for gpt-4o-mini than gpt-4-turbo', () => {
      const miniContext: RoutingContext = {
        type: AnalysisType.OBSERVABILITY,
        contextSize: 1000,
        criticality: Criticality.LOW,
        userTier: 'enterprise',
      };

      const turboContext: RoutingContext = {
        type: AnalysisType.INCIDENT,
        contextSize: 1000,
        criticality: Criticality.CRITICAL,
        userTier: 'enterprise',
      };

      const miniDecision = router.route(miniContext);
      const turboDecision = router.route(turboContext);

      expect(miniDecision.costEstimate).toBeLessThan(turboDecision.costEstimate);
    });
  });

  describe('Routing Statistics', () => {
    it('should track routing decisions', () => {
      const context: RoutingContext = {
        type: AnalysisType.OBSERVABILITY,
        contextSize: 1000,
        criticality: Criticality.LOW,
        userTier: 'enterprise',
      };

      const decision = router.route(context);
      router.recordOutcome(context, decision, 0.85);

      const stats = router.getStats();

      expect(stats.totalDecisions).toBe(1);
      expect(stats.successRate).toBe(1.0);
      expect(stats.costAverage).toBeGreaterThan(0);
    });

    it('should track model distribution', () => {
      const observations = [
        { type: AnalysisType.OBSERVABILITY, criticality: Criticality.LOW },
        { type: AnalysisType.INCIDENT, criticality: Criticality.CRITICAL },
        { type: AnalysisType.RISK, criticality: Criticality.CRITICAL },
      ];

      observations.forEach((obs) => {
        const context: RoutingContext = {
          ...obs,
          contextSize: 1500,
          userTier: 'enterprise',
        };

        const decision = router.route(context);
        router.recordOutcome(context, decision, 0.8);
      });

      const stats = router.getStats();

      expect(stats.totalDecisions).toBe(3);
      expect(Object.values(stats.modelDistribution).reduce((a, b) => a + b, 0)).toBe(3);
    });

    it('should identify low-quality decisions', () => {
      const context: RoutingContext = {
        type: AnalysisType.INCIDENT,
        contextSize: 1000,
        criticality: Criticality.CRITICAL,
        userTier: 'enterprise',
      };

      const decision = router.route(context);
      router.recordOutcome(context, decision, 0.55); // Low score

      const stats = router.getStats();

      expect(stats.successRate).toBeLessThan(1.0);
    });

    it('should maintain recent history', () => {
      // Add many decisions
      for (let i = 0; i < 1500; i++) {
        const context: RoutingContext = {
          type: AnalysisType.OBSERVABILITY,
          contextSize: 1000 + i,
          criticality: Criticality.NORMAL,
          userTier: 'enterprise',
        };

        const decision = router.route(context);
        router.recordOutcome(context, decision, 0.85);
      }

      const stats = router.getStats();

      // Should be pruned to ~1000
      expect(stats.totalDecisions).toBeLessThanOrEqual(1000);
    });
  });

  describe('Error Handling', () => {
    it('should throw on unknown analysis type', () => {
      const context: RoutingContext = {
        type: 'unknown' as AnalysisType,
        contextSize: 1000,
        criticality: Criticality.NORMAL,
        userTier: 'enterprise',
      };

      expect(() => router.route(context)).toThrow();
    });
  });
});
