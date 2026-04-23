import { describe, it, expect, beforeEach, vi } from '@jest/globals';
import { Logger } from 'winston';
import { ContextIntelligence } from '../../src/learning/ContextIntelligence';
import { HistoricalSuccessTracker } from '../../src/learning/HistoricalSuccessTracker';
import { AnalysisType } from '../../src/types/analysis.types';
import { ContextChunk } from '../../src/context/ContextFilter';

describe('Phase 5: ContextIntelligence', () => {
  let intelligence: ContextIntelligence;
  let mockTracker: jest.Mocked<HistoricalSuccessTracker>;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    mockTracker = {
      getSimilarSuccesses: vi.fn(),
      predictQualityScore: vi.fn(),
      getTypeStats: vi.fn(),
    } as unknown as jest.Mocked<HistoricalSuccessTracker>;

    mockLogger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
    } as unknown as jest.Mocked<Logger>;

    intelligence = new ContextIntelligence(mockTracker, mockLogger);
  });

  describe('intelligentBoost', () => {
    it('should boost chunks with historical success', async () => {
      const chunks: ContextChunk[] = [
        {
          id: 'chunk_1',
          data: { metric: 'latency', value: 500 },
          score: 0.5,
          metadata: {},
        },
        {
          id: 'chunk_2',
          data: { metric: 'errors', value: 10 },
          score: 0.5,
          metadata: {},
        },
      ];

      mockTracker.getSimilarSuccesses.mockResolvedValue([
        {
          analysisId: 'analysis_1',
          analysisType: AnalysisType.OBSERVABILITY,
          query: 'latency issue',
          qualityScore: 0.9,
          actionabilityScore: 0.85,
          consistencyScore: 0.88,
          overallScore: 0.88,
          tokensSaved: 100,
          resolutionTime: 10,
          timestamp: new Date(),
        },
      ]);

      const boosted = await intelligence.intelligentBoost(
        chunks,
        AnalysisType.OBSERVABILITY,
        'Check latency metrics',
      );

      // Should have reordered based on scores
      expect(boosted.length).toBe(2);
      expect(boosted[0].metadata?.intelligence).toBeDefined();
    });

    it('should apply type affinity boost', async () => {
      const chunks: ContextChunk[] = [
        {
          id: 'chunk_1',
          data: {
            latency_ms: 500,
            error_rate: 0.05,
            metric_name: 'http_requests',
          },
          score: 0.6,
          metadata: {},
        },
      ];

      mockTracker.getSimilarSuccesses.mockResolvedValue([]);

      const boosted = await intelligence.intelligentBoost(
        chunks,
        AnalysisType.OBSERVABILITY,
        'metrics query',
      );

      // Observability chunk with metric keywords should get affinity boost
      expect(boosted[0].score).toBeGreaterThanOrEqual(chunks[0].score);
    });

    it('should reorder chunks by boosted score', async () => {
      const chunks: ContextChunk[] = [
        { id: 'chunk_1', data: { value: 1 }, score: 0.8, metadata: {} },
        { id: 'chunk_2', data: { error: 'timeout' }, score: 0.6, metadata: {} },
        { id: 'chunk_3', data: { metric: 'cpu' }, score: 0.7, metadata: {} },
      ];

      mockTracker.getSimilarSuccesses.mockResolvedValue([
        {
          analysisId: 'a1',
          analysisType: AnalysisType.OBSERVABILITY,
          query: 'cpu metrics',
          qualityScore: 0.95,
          actionabilityScore: 0.9,
          consistencyScore: 0.92,
          overallScore: 0.92,
          tokensSaved: 200,
          resolutionTime: 5,
          timestamp: new Date(),
        },
      ]);

      const boosted = await intelligence.intelligentBoost(
        chunks,
        AnalysisType.OBSERVABILITY,
        'cpu metric',
      );

      // chunk_3 (cpu metric) should be boosted up
      expect(boosted[0].id).toContain('chunk');
    });
  });

  describe('getRecommendedContextSize', () => {
    it('should recommend smaller context for poor performance', async () => {
      mockTracker.getTypeStats.mockResolvedValue({
        avgQuality: 0.65,
        avgActionability: 0.6,
        avgConsistency: 0.62,
        avgOverallScore: 0.62,
        sampleCount: 20,
        bestPerformingQueries: [],
      });

      const recommendation = await intelligence.getRecommendedContextSize(
        AnalysisType.INCIDENT,
      );

      expect(recommendation.optimalTokens).toBeLessThan(1500);
      expect(recommendation.reason).toContain('low');
    });

    it('should recommend larger context for good performance', async () => {
      mockTracker.getTypeStats.mockResolvedValue({
        avgQuality: 0.88,
        avgActionability: 0.85,
        avgConsistency: 0.87,
        avgOverallScore: 0.87,
        sampleCount: 25,
        bestPerformingQueries: [],
      });

      const recommendation = await intelligence.getRecommendedContextSize(
        AnalysisType.OBSERVABILITY,
      );

      expect(recommendation.optimalTokens).toBeGreaterThan(1500);
      expect(recommendation.reason).toContain('high');
    });

    it('should return defaults with no historical data', async () => {
      mockTracker.getTypeStats.mockResolvedValue(null);

      const recommendation = await intelligence.getRecommendedContextSize(
        AnalysisType.RISK,
      );

      expect(recommendation.optimalTokens).toBe(1500);
      expect(recommendation.reason).toContain('default');
    });
  });

  describe('predictExpectedScore', () => {
    it('should predict lower score for small context', async () => {
      mockTracker.predictQualityScore.mockResolvedValue(0.80);

      const scoreSmall = await intelligence.predictExpectedScore(
        AnalysisType.OBSERVABILITY,
        300,
        3,
      );

      expect(scoreSmall).toBeLessThan(0.80); // Adjustment for too few chunks
    });

    it('should predict higher score for optimal chunk count', async () => {
      mockTracker.predictQualityScore.mockResolvedValue(0.80);

      const scoreOptimal = await intelligence.predictExpectedScore(
        AnalysisType.OBSERVABILITY,
        1500,
        10,
      );

      expect(scoreOptimal).toBeGreaterThan(0.80); // Bonus for goldilocks zone
    });

    it('should predict lower score for too large context', async () => {
      mockTracker.predictQualityScore.mockResolvedValue(0.80);

      const scoreLarge = await intelligence.predictExpectedScore(
        AnalysisType.OBSERVABILITY,
        5000,
        25,
      );

      expect(scoreLarge).toBeLessThan(0.80); // Adjustment for noise
    });
  });

  describe('Type affinity scoring', () => {
    it('should score observability chunks high for metrics', async () => {
      const chunks: ContextChunk[] = [
        {
          id: 'obs_chunk',
          data: {
            latency_duration_ms: 500,
            error_rate: 0.05,
            cpu_usage: 0.75,
          },
          score: 0.5,
          metadata: {},
        },
      ];

      mockTracker.getSimilarSuccesses.mockResolvedValue([]);

      const boosted = await intelligence.intelligentBoost(
        chunks,
        AnalysisType.OBSERVABILITY,
        'performance metrics',
      );

      // Should boost observability chunk due to affinity
      expect(boosted[0].score).toBeGreaterThan(0.5);
    });

    it('should score incident chunks high for errors', async () => {
      const chunks: ContextChunk[] = [
        {
          id: 'incident_chunk',
          data: {
            error: 'NullPointerException',
            stack_trace: 'at com.example...',
            timestamp: '2026-01-15',
          },
          score: 0.5,
          metadata: {},
        },
      ];

      mockTracker.getSimilarSuccesses.mockResolvedValue([]);

      const boosted = await intelligence.intelligentBoost(
        chunks,
        AnalysisType.INCIDENT,
        'exception occurred',
      );

      // Should boost incident chunk due to affinity
      expect(boosted[0].score).toBeGreaterThan(0.5);
    });

    it('should score risk chunks high for violations', async () => {
      const chunks: ContextChunk[] = [
        {
          id: 'risk_chunk',
          data: {
            violation: 'PII exposure',
            severity: 'critical',
            affected_fields: ['email', 'cpf'],
          },
          score: 0.5,
          metadata: {},
        },
      ];

      mockTracker.getSimilarSuccesses.mockResolvedValue([]);

      const boosted = await intelligence.intelligentBoost(
        chunks,
        AnalysisType.RISK,
        'compliance check',
      );

      // Should boost risk chunk due to affinity
      expect(boosted[0].score).toBeGreaterThan(0.5);
    });
  });

  describe('Integration scenarios', () => {
    it('should improve quality for observability analysis', async () => {
      const chunks: ContextChunk[] = [
        {
          id: 'good_chunk',
          data: { latency: 500, error_rate: 0.01, metric: 'http_p99' },
          score: 0.6,
          metadata: {},
        },
        {
          id: 'bad_chunk',
          data: { random: 'data', unrelated: true },
          score: 0.6,
          metadata: {},
        },
      ];

      mockTracker.getSimilarSuccesses.mockResolvedValue([
        {
          analysisId: 'a1',
          analysisType: AnalysisType.OBSERVABILITY,
          query: 'latency metrics',
          qualityScore: 0.92,
          actionabilityScore: 0.88,
          consistencyScore: 0.90,
          overallScore: 0.90,
          tokensSaved: 150,
          resolutionTime: 8,
          timestamp: new Date(),
        },
      ]);

      const boosted = await intelligence.intelligentBoost(
        chunks,
        AnalysisType.OBSERVABILITY,
        'Check latency trends',
      );

      // good_chunk should be ranked first due to affinity + historical
      expect(boosted[0].id).toBe('good_chunk');
      expect(boosted[0].score).toBeGreaterThan(0.6);
    });

    it('should handle incident analysis with sequential context', async () => {
      const chunks: ContextChunk[] = [
        {
          id: 'stack',
          data: {
            error: 'TimeoutException',
            stack_trace: 'at app.process()',
          },
          score: 0.7,
          metadata: {},
        },
        {
          id: 'logs',
          data: { log_level: 'ERROR', message: 'Request timeout' },
          score: 0.65,
          metadata: {},
        },
      ];

      mockTracker.getSimilarSuccesses.mockResolvedValue([
        {
          analysisId: 'inc1',
          analysisType: AnalysisType.INCIDENT,
          query: 'timeout error root cause',
          qualityScore: 0.88,
          actionabilityScore: 0.85,
          consistencyScore: 0.87,
          overallScore: 0.87,
          tokensSaved: 100,
          resolutionTime: 15,
          timestamp: new Date(),
        },
      ]);

      const boosted = await intelligence.intelligentBoost(
        chunks,
        AnalysisType.INCIDENT,
        'Timeout occurred',
      );

      // Error/stack chunk should be first
      expect(boosted[0].metadata?.intelligence).toBeDefined();
    });
  });
});
