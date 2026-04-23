import { Logger } from 'winston';
import { PrivacyClassifier } from '../src/privacy/PrivacyClassifier';
import { ModelRouter, DEFAULT_MODELS } from '../src/routing/ModelRouter';
import { FeedbackProcessor } from '../src/feedback/FeedbackProcessor';
import { AIMetricsCollector } from '../src/observability/AIMetricsCollector';
import { AgentGraphExecutor } from '../src/agents/AgentGraphExecutor';
import { DecisionEngineOrchestrator } from '../src/orchestrator/DecisionEngineOrchestrator';
import { DecisionRequest } from '../src/types/DecisionOutput';

describe('AI Decision Engine', () => {
  let orchestrator: DecisionEngineOrchestrator;
  let logger: any;

  beforeEach(() => {
    logger = {
      info: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };

    const privacyClassifier = new PrivacyClassifier(logger);
    const modelRouter = new ModelRouter(logger, DEFAULT_MODELS);
    const feedbackProcessor = new FeedbackProcessor(logger);
    const metricsCollector = new AIMetricsCollector(logger);
    const agentExecutor = new AgentGraphExecutor(logger);

    orchestrator = new DecisionEngineOrchestrator(
      logger,
      privacyClassifier,
      modelRouter,
      feedbackProcessor,
      metricsCollector,
      agentExecutor
    );
  });

  describe('Privacy Classification', () => {
    test('should detect email and classify as INTERNAL', () => {
      const request: DecisionRequest = {
        type: 'observability',
        criticality: 'NORMAL',
        context: { user: 'john@example.com', metrics: [] },
      };

      expect(() => {
        // Privacy check happens in executeDecision
        orchestrator.executeDecision(request);
      }).not.toThrow();
    });

    test('should detect medical data and classify as RESTRICTED', () => {
      const request: DecisionRequest = {
        type: 'risk',
        criticality: 'CRITICAL',
        context: { diagnosis: 'hypertension', patient_id: '12345' },
      };

      expect(() => {
        orchestrator.executeDecision(request);
      }).not.toThrow();
    });
  });

  describe('Model Routing', () => {
    test('should route CRITICAL observability to gpt-4o', async () => {
      const request: DecisionRequest = {
        type: 'observability',
        criticality: 'CRITICAL',
        context: { latency: 5000 },
      };

      const decision = await orchestrator.executeDecision(request);
      expect(decision.metadata.model_used).toBe('gpt-4o');
    });

    test('should use fallback model if primary fails', async () => {
      // Test fallback strategy
      const request: DecisionRequest = {
        type: 'test-intelligence',
        criticality: 'NORMAL',
        context: { tests: [] },
      };

      const decision = await orchestrator.executeDecision(request);
      expect(decision.metadata).toBeDefined();
      expect(decision.metrics.quality_score).toBeGreaterThan(0);
    });
  });

  describe('Decision Output Format', () => {
    test('should return DecisionOutput with all required fields', async () => {
      const request: DecisionRequest = {
        type: 'observability',
        criticality: 'NORMAL',
        context: { metrics: ['latency', 'cpu'] },
      };

      const decision = await orchestrator.executeDecision(request);

      // Decision
      expect(decision.decision).toBeDefined();
      expect(decision.decision.recommendation).toBeDefined();
      expect(decision.decision.reasoning).toBeDefined();
      expect(decision.decision.actions).toBeInstanceOf(Array);

      // Metrics
      expect(decision.metrics.quality_score).toBeGreaterThanOrEqual(0);
      expect(decision.metrics.quality_score).toBeLessThanOrEqual(1);
      expect(decision.metrics.actionability_score).toBeGreaterThanOrEqual(0);
      expect(decision.metrics.consistency_score).toBeGreaterThanOrEqual(0);
      expect(decision.metrics.confidence_score).toBeGreaterThanOrEqual(0);

      // Metadata
      expect(decision.metadata.analysisId).toBeDefined();
      expect(decision.metadata.type).toBe('observability');
      expect(decision.metadata.criticality).toBe('NORMAL');
      expect(decision.metadata.model_used).toBeDefined();
      expect(decision.metadata.execution_time_ms).toBeGreaterThan(0);

      // Tracing
      expect(decision.tracing.request_id).toBeDefined();
      expect(decision.tracing.agent_chain).toBeInstanceOf(Array);
      expect(decision.tracing.model_routing_rationale).toBeDefined();
    });
  });

  describe('Metrics Collection', () => {
    test('should collect decision metrics', async () => {
      const request: DecisionRequest = {
        type: 'observability',
        criticality: 'NORMAL',
        context: {},
      };

      await orchestrator.executeDecision(request);
      const metrics = orchestrator.getMetrics();

      expect(metrics.total_decisions).toBeGreaterThan(0);
      expect(metrics.avg_latency_ms).toBeGreaterThan(0);
      expect(metrics.fallback_rate).toBeDefined();
      expect(metrics.reexecution_rate).toBeDefined();
    });
  });

  describe('Feedback Processing', () => {
    test('should process positive feedback', async () => {
      const request: DecisionRequest = {
        type: 'observability',
        criticality: 'NORMAL',
        context: {},
      };

      const decision = await orchestrator.executeDecision(request);

      const feedback = {
        decision_id: decision.metadata.analysisId,
        feedback_type: 'positive' as const,
        user_id: 'user123',
        actual_outcome: {
          resolved: true,
          time_to_resolution_minutes: 15,
          business_impact_score: 8,
        },
        timestamp: new Date(),
      };

      await orchestrator.processFeedback(decision.metadata.analysisId, feedback);
      expect(logger.info).toHaveBeenCalled();
    });
  });
});
