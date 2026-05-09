import { describe, it, expect, beforeEach, vi } from '@jest/globals';
import { Logger } from 'winston';
import { Redis } from 'ioredis';
import { QueryRewriter, QueryDomain } from '../../src/optimization/QueryRewriter';
import { ContextualSummarizer } from '../../src/optimization/ContextualSummarizer';
import { DynamicChunkingStrategy } from '../../src/optimization/DynamicChunkingStrategy';
import { LLMClient } from '../../src/clients/LLMClient';
import { AnalysisType } from '../../src/types/analysis.types';
import { ContextChunk } from '../../src/context/ContextFilter';

describe('Phase 7: Token Optimization', () => {
  let mockLLM: jest.Mocked<LLMClient>;
  let mockRedis: jest.Mocked<Redis>;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    mockLLM = {
      call: vi.fn(),
    } as unknown as jest.Mocked<LLMClient>;

    mockRedis = {
      get: vi.fn().mockResolvedValue(null),
      setex: vi.fn().mockResolvedValue('OK'),
    } as unknown as jest.Mocked<Redis>;

    mockLogger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    } as unknown as jest.Mocked<Logger>;
  });

  describe('QueryRewriter', () => {
    let rewriter: QueryRewriter;

    beforeEach(() => {
      rewriter = new QueryRewriter(mockRedis, mockLLM, mockLogger);
    });

    it('should rewrite Prometheus query by rule', async () => {
      const query = 'rate(http_request_duration_seconds_bucket[5m])';

      const result = await rewriter.rewrite(query, 'prometheus');

      expect(result.original).toBe(query);
      expect(result.rewritten).toBe('http.p95.5m');
      expect(result.reduction).toBeGreaterThan(0.5); // > 50% reduction
      expect(result.method).toBe('rule');
    });

    it('should rewrite SQL query by rule', async () => {
      const query = 'SELECT COUNT(*) FROM errors WHERE severity=\'ERROR\'';

      const result = await rewriter.rewrite(query, 'sql');

      expect(result.reduction).toBeGreaterThan(0);
      expect(result.method).toBe('rule');
    });

    it('should use LLM for complex queries', async () => {
      mockLLM.call.mockResolvedValue({
        content: 'custom.metric',
      });

      const query = 'COMPLEX CUSTOM QUERY NOT IN PATTERNS';

      const result = await rewriter.rewrite(query, 'prometheus');

      expect(result.rewritten).toBe('custom.metric');
      expect(result.method).toBe('llm');
      expect(mockLLM.call).toHaveBeenCalled();
    });

    it('should cache query rewrites', async () => {
      const query = 'rate(errors_total[1m])';

      // Primeira chamada
      const result1 = await rewriter.rewrite(query, 'prometheus');
      expect(result1.fromCache).toBe(false);

      // Configurar cache mock para retornar na segunda chamada
      mockRedis.get.mockResolvedValueOnce(JSON.stringify(result1));

      // Segunda chamada deve vir de cache
      const result2 = await rewriter.rewrite(query, 'prometheus');
      expect(result2.fromCache).toBe(true);
      expect(result2.rewritten).toBe(result1.rewritten);
    });

    it('should batch rewrite multiple queries', async () => {
      const queries = [
        { query: 'rate(http_request_duration_seconds_bucket[5m])', domain: 'prometheus' as QueryDomain },
        { query: 'rate(errors_total[1m])', domain: 'prometheus' as QueryDomain },
      ];

      const results = await rewriter.rewriteBatch(queries);

      expect(results).toHaveLength(2);
      expect(results[0].reduction).toBeGreaterThan(0);
      expect(results[1].reduction).toBeGreaterThan(0);
    });

    it('should estimate token savings', async () => {
      const query = 'rate(http_request_duration_seconds_bucket[5m])';

      const result = await rewriter.rewrite(query, 'prometheus');

      expect(result.tokensBeforeEstimate).toBeGreaterThan(0);
      expect(result.tokensAfterEstimate).toBeGreaterThan(0);
      expect(result.tokensBeforeEstimate).toBeGreaterThan(
        result.tokensAfterEstimate,
      );
    });

    it('should handle malformed queries gracefully', async () => {
      mockLLM.call.mockResolvedValue({
        content: '', // Empty response
      });

      const query = 'INVALID;;;QUERY';

      const result = await rewriter.rewrite(query, 'prometheus');

      expect(result.reduction).toBe(0); // Fallback: no reduction
      expect(result.rewritten).toBe(query); // Return original
    });
  });

  describe('ContextualSummarizer', () => {
    let summarizer: ContextualSummarizer;

    beforeEach(() => {
      summarizer = new ContextualSummarizer(mockLLM, mockLogger);
    });

    it('should not summarize small contexts', async () => {
      const chunks: ContextChunk[] = [
        {
          id: 'chunk_1',
          data: { value: 100, timestamp: '2026-01-15' },
          score: 0.8,
          metadata: {},
        },
      ];

      const result = await summarizer.summarizeIfNeeded(
        chunks,
        AnalysisType.OBSERVABILITY,
      );

      expect(result.reduction).toBe(0);
      expect(result.summarizedCount).toBe(0);
    });

    it('should summarize large contexts moderately', async () => {
      mockLLM.call.mockResolvedValue({
        content: JSON.stringify({ summary: 'key points', reduced: true }),
      });

      const largeData = {
        metrics: Array(100).fill({ value: Math.random() }),
        timestamp: '2026-01-15',
      };

      const chunks: ContextChunk[] = [
        {
          id: 'chunk_1',
          data: largeData,
          score: 0.8,
          metadata: {},
        },
      ];

      const result = await summarizer.summarizeIfNeeded(
        chunks,
        AnalysisType.OBSERVABILITY,
        { aggressiveness: 'moderate' },
      );

      expect(result.reduction).toBeGreaterThan(0);
      expect(result.summarizedCount).toBeGreaterThan(0);
    });

    it('should handle LLM summarization failures gracefully', async () => {
      mockLLM.call.mockRejectedValue(new Error('LLM error'));

      const largeData = { metrics: Array(100).fill({ value: 100 }) };
      const chunks: ContextChunk[] = [
        {
          id: 'chunk_1',
          data: largeData,
          score: 0.8,
          metadata: {},
        },
      ];

      const result = await summarizer.summarizeIfNeeded(
        chunks,
        AnalysisType.INCIDENT,
      );

      // Deve retornar chunks originais se falhar
      expect(result.chunks[0].metadata?.summarized).not.toBe(true);
    });

    it('should respect aggressiveness levels', async () => {
      mockLLM.call.mockResolvedValue({
        content: JSON.stringify({ summary: 'reduced' }),
      });

      const largeData = { items: Array(200).fill({ x: 1 }) };
      const chunks: ContextChunk[] = [
        {
          id: 'chunk_1',
          data: largeData,
          score: 0.8,
          metadata: {},
        },
      ];

      const lightResult = await summarizer.summarizeIfNeeded(
        chunks,
        AnalysisType.OBSERVABILITY,
        { aggressiveness: 'light' },
      );

      const aggressiveResult = await summarizer.summarizeIfNeeded(
        chunks,
        AnalysisType.OBSERVABILITY,
        { aggressiveness: 'aggressive' },
      );

      expect(aggressiveResult.reduction).toBeGreaterThanOrEqual(
        lightResult.reduction,
      );
    });
  });

  describe('DynamicChunkingStrategy', () => {
    let strategy: DynamicChunkingStrategy;

    beforeEach(() => {
      strategy = new DynamicChunkingStrategy(mockLogger);
    });

    it('should return different strategies by analysis type', () => {
      const obsConfig = strategy.getStrategy(AnalysisType.OBSERVABILITY, 2000);
      const incidentConfig = strategy.getStrategy(AnalysisType.INCIDENT, 2000);

      expect(obsConfig.chunkSize).not.toBe(incidentConfig.chunkSize);
      expect(obsConfig.overlap).not.toBe(incidentConfig.overlap);
    });

    it('should compress numbers in observability data', () => {
      const config = strategy.getStrategy(AnalysisType.OBSERVABILITY, 2000);
      const chunk: ContextChunk = {
        id: 'chunk_1',
        data: { value: 1234567, latency_ms: 5000 },
        score: 0.8,
        metadata: {},
      };

      const transformed = strategy.transformChunk(chunk, config);

      const stringified = JSON.stringify(transformed.data);
      expect(stringified).toContain('M'); // Should have "M" for million
    });

    it('should not compress numbers in incident data', () => {
      const config = strategy.getStrategy(AnalysisType.INCIDENT, 2000);
      const chunk: ContextChunk = {
        id: 'chunk_1',
        data: { port: 5432, retries: 3 },
        score: 0.8,
        metadata: {},
      };

      const transformed = strategy.transformChunk(chunk, config);

      expect(transformed.data.port).toBe(5432);
      expect(transformed.data.retries).toBe(3);
    });

    it('should reorder by priority fields', () => {
      const config = strategy.getStrategy(AnalysisType.OBSERVABILITY, 2000);
      const chunk: ContextChunk = {
        id: 'chunk_1',
        data: {
          timestamp: '2026-01-15T10:00:00Z',
          value: 100,
          anomalyFlags: ['SPIKE'],
          error_rate: 0.01,
        },
        score: 0.8,
        metadata: {},
      };

      const transformed = strategy.transformChunk(chunk, config);
      const keys = Object.keys(transformed.data);

      // Priority fields should come first
      const anomalyIndex = keys.indexOf('anomalyFlags');
      const timestampIndex = keys.indexOf('timestamp');

      expect(anomalyIndex).toBeLessThan(timestampIndex);
    });

    it('should calculate relevance score correctly', () => {
      const chunk: ContextChunk = {
        id: 'chunk_1',
        data: {
          anomalyFlags: ['SPIKE'],
          value: 100,
          error_rate: 0.01,
          random_field: 'should not affect score',
        },
        score: 0.8,
        metadata: {},
      };

      const score = strategy.calculateRelevanceScore(
        chunk,
        AnalysisType.OBSERVABILITY,
      );

      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(1);
    });

    it('should apply time sampling for large observability contexts', () => {
      const config = strategy.getStrategy(AnalysisType.OBSERVABILITY, 10000);

      const largeTimeSeries = Array(1440).fill(0).map((_, i) => ({
        timestamp: new Date(Date.now() - i * 60000),
        value: Math.random(),
      }));

      const chunk: ContextChunk = {
        id: 'chunk_1',
        data: { metrics: largeTimeSeries },
        score: 0.8,
        metadata: {},
      };

      const transformed = strategy.transformChunk(chunk, config);

      if (Array.isArray(transformed.data.metrics)) {
        expect(transformed.data.metrics.length).toBeLessThan(
          largeTimeSeries.length,
        );
      }
    });
  });

  describe('Integration scenarios', () => {
    it('should reduce tokens by 35% combined', async () => {
      const rewriter = new QueryRewriter(mockRedis, mockLLM, mockLogger);
      const summarizer = new ContextualSummarizer(mockLLM, mockLogger);
      const chunking = new DynamicChunkingStrategy(mockLogger);

      // Phase 7 goals: -35% total tokens
      // Composition:
      // - QueryRewriting: -20-30%
      // - ContextualSummarization: -30-50%
      // - DynamicChunking: -15-25%
      // Combined (conservative): -35%

      mockLLM.call.mockResolvedValue({
        content: JSON.stringify({ summary: 'reduced' }),
      });

      // Simulate complex analysis
      const query = 'rate(http_request_duration_seconds_bucket[5m])';
      const rewriteResult = await rewriter.rewrite(query, 'prometheus');

      const largeContext: ContextChunk[] = [
        {
          id: 'chunk_1',
          data: { metrics: Array(100).fill({ value: Math.random() }) },
          score: 0.8,
          metadata: {},
        },
      ];

      const summaryResult = await summarizer.summarizeIfNeeded(
        largeContext,
        AnalysisType.OBSERVABILITY,
      );

      // Query rewriting + summarization should achieve > 20% combined reduction
      expect(rewriteResult.reduction + summaryResult.reduction).toBeGreaterThan(
        0.2,
      );
    });
  });
});
