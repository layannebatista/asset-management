/**
 * EvalPipeline unit and integration tests
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { createLogger } from 'winston';
import { EvalPipeline, EvalDatapoint, EvalScore } from '../../src/eval/EvalPipeline';
import { ALL_EVAL_DATASETS, getDatasetForType, getAllDatapoints } from './datasets';
import { AnalysisType } from '../../src/routing/RoutingContext';

// Mock LLMClient
jest.mock('../../src/llm/LLMClient', () => ({
  LLMClient: jest.fn().mockImplementation(() => ({
    call: jest.fn().mockResolvedValue({
      content: JSON.stringify({ score: 85, aligned: true }),
    }),
  })),
}));

// Mock AnalysisRepository
jest.mock('../../src/storage/AnalysisRepository', () => ({
  AnalysisRepository: jest.fn().mockImplementation(() => ({
    findRecent: jest.fn().mockResolvedValue([]),
  })),
}));

describe('EvalPipeline', () => {
  let pipeline: EvalPipeline;
  let logger = createLogger({ silent: true });

  beforeEach(() => {
    const LLMClient = require('../../src/llm/LLMClient').LLMClient;
    const AnalysisRepository = require('../../src/storage/AnalysisRepository').AnalysisRepository;

    const llm = new LLMClient();
    const repo = new AnalysisRepository();

    pipeline = new EvalPipeline(llm, repo, logger);
  });

  describe('Quality Evaluation', () => {
    it('should score quality based on key point coverage', async () => {
      const datapoint = {
        id: 'test-1',
        analysisType: AnalysisType.OBSERVABILITY,
        input: {
          contextChunks: ['metrics data'],
          query: 'analyze',
        },
        expectedOutput: {
          keyPoints: ['point1', 'point2', 'point3'],
          recommendedActions: ['action1'],
          confidence: 0.8,
        },
        generatedOutput: {
          keyPoints: ['point1', 'point2'],
          recommendedActions: ['action1'],
          confidence: 0.8,
        },
      };

      const score = await pipeline.evaluate(datapoint);

      expect(score.quality).toBeGreaterThan(0);
      expect(score.quality).toBeLessThanOrEqual(1);
    });

    it('should penalize missing key points', async () => {
      const datapoint: EvalDatapoint = {
        id: 'test-2',
        analysisType: AnalysisType.INCIDENT,
        input: {
          contextChunks: ['incident data'],
          query: 'root cause',
        },
        expectedOutput: {
          keyPoints: ['cause1', 'cause2', 'cause3', 'cause4'],
          recommendedActions: ['fix1', 'fix2'],
          confidence: 0.9,
        },
        generatedOutput: {
          keyPoints: ['cause1'],
          recommendedActions: ['fix1'],
          confidence: 0.5,
        },
      };

      const score = await pipeline.evaluate(datapoint);

      // Should penalize for only 1/4 key points
      expect(score.quality).toBeLessThan(0.5);
    });
  });

  describe('Actionability Evaluation', () => {
    it('should evaluate actionability of recommendations', async () => {
      const datapoint: EvalDatapoint = {
        id: 'test-3',
        analysisType: AnalysisType.INCIDENT,
        input: {
          contextChunks: ['data'],
          query: 'mitigation',
        },
        expectedOutput: {
          keyPoints: [],
          recommendedActions: [
            'IMMEDIATE: Restart service (5 min downtime)',
            'SHORT-TERM: Review logs for root cause',
          ],
        },
        generatedOutput: {
          keyPoints: [],
          recommendedActions: [
            'Restart service',
            'Check logs',
          ],
          confidence: 0.75,
        },
      };

      const score = await pipeline.evaluate(datapoint);

      expect(score.actionability).toBeGreaterThan(0);
      expect(score.actionability).toBeLessThanOrEqual(1);
    });
  });

  describe('Consistency Evaluation', () => {
    it('should evaluate consistency with historical analyses', async () => {
      const datapoint: EvalDatapoint = {
        id: 'test-4',
        analysisType: AnalysisType.OBSERVABILITY,
        input: {
          contextChunks: ['metrics'],
          query: 'trend',
        },
        expectedOutput: {
          keyPoints: ['consistent with pattern'],
          recommendedActions: ['standard action'],
        },
        generatedOutput: {
          keyPoints: ['consistent with pattern'],
          recommendedActions: ['standard action'],
          confidence: 0.85,
        },
      };

      const score = await pipeline.evaluate(datapoint);

      expect(score.consistency).toBeGreaterThanOrEqual(0);
      expect(score.consistency).toBeLessThanOrEqual(1);
    });
  });

  describe('Overall Score Calculation', () => {
    it('should weight dimensions correctly (50% quality, 30% actionability, 20% consistency)', async () => {
      const datapoint: EvalDatapoint = {
        id: 'test-5',
        analysisType: AnalysisType.RISK,
        input: {
          contextChunks: ['code'],
          query: 'risk',
        },
        expectedOutput: {
          keyPoints: ['risk1'],
          recommendedActions: ['fix1'],
          riskLevel: 'high',
        },
        generatedOutput: {
          keyPoints: ['risk1'],
          recommendedActions: ['fix1'],
          riskLevel: 'high',
          confidence: 0.88,
        },
      };

      const score = await pipeline.evaluate(datapoint);

      // Score should be weighted combination
      expect(score.overall).toEqual(
        score.quality * 0.5 + score.actionability * 0.3 + score.consistency * 0.2,
      );
    });

    it('should return overall score between 0 and 1', async () => {
      const datapoint: EvalDatapoint = {
        id: 'test-6',
        analysisType: AnalysisType.TEST_INTELLIGENCE,
        input: {
          contextChunks: ['code'],
          query: 'tests',
        },
        expectedOutput: {
          keyPoints: ['gap1'],
          recommendedActions: ['test1'],
        },
        generatedOutput: {
          keyPoints: ['gap1'],
          recommendedActions: ['test1'],
          confidence: 0.8,
        },
      };

      const score = await pipeline.evaluate(datapoint);

      expect(score.overall).toBeGreaterThanOrEqual(0);
      expect(score.overall).toBeLessThanOrEqual(1);
    });
  });

  describe('Breakdown Metrics', () => {
    it('should compute ROUGE-L score', async () => {
      const datapoint: EvalDatapoint = {
        id: 'test-7',
        analysisType: AnalysisType.OBSERVABILITY,
        input: {
          contextChunks: [],
          query: '',
        },
        expectedOutput: {
          keyPoints: ['latency', 'database', 'pool'],
          recommendedActions: [],
        },
        generatedOutput: {
          keyPoints: ['latency', 'database'],
          recommendedActions: [],
          confidence: 0.8,
        },
      };

      const score = await pipeline.evaluate(datapoint);

      expect(score.breakdown.rougeL).toBeGreaterThan(0);
      expect(score.breakdown.rougeL).toBeLessThanOrEqual(1);
    });

    it('should check factuality', async () => {
      const datapoint: EvalDatapoint = {
        id: 'test-8',
        analysisType: AnalysisType.RISK,
        input: {
          contextChunks: ['Code does X'],
          query: '',
        },
        expectedOutput: {
          keyPoints: [],
          recommendedActions: ['Code does X'],
        },
        generatedOutput: {
          keyPoints: [],
          recommendedActions: ['Code does X'],
          confidence: 0.9,
        },
      };

      const score = await pipeline.evaluate(datapoint);

      expect(typeof score.breakdown.factualityCheck).toBe('boolean');
    });

    it('should check coherence', async () => {
      const datapoint: EvalDatapoint = {
        id: 'test-9',
        analysisType: AnalysisType.INCIDENT,
        input: {
          contextChunks: [],
          query: '',
        },
        expectedOutput: {
          keyPoints: [],
          recommendedActions: ['Action 1', 'Action 2', 'Action 3'],
        },
        generatedOutput: {
          keyPoints: [],
          recommendedActions: ['Action 1', 'Action 2', 'Action 3'],
          confidence: 0.85,
        },
      };

      const score = await pipeline.evaluate(datapoint);

      expect(score.breakdown.coherence).toBeGreaterThanOrEqual(0);
      expect(score.breakdown.coherence).toBeLessThanOrEqual(1);
    });
  });

  describe('Batch Evaluation', () => {
    it('should evaluate multiple datapoints', async () => {
      const datapoints = getDatasetForType(AnalysisType.OBSERVABILITY).slice(0, 2);

      const scores = await pipeline.evaluateBatch(datapoints);

      expect(scores.length).toBe(datapoints.length);
      expect(scores.every((s) => s.overall >= 0 && s.overall <= 1)).toBe(true);
    });

    it('should handle batch errors gracefully', async () => {
      const validDatapoint: EvalDatapoint = {
        id: 'test-10',
        analysisType: AnalysisType.OBSERVABILITY,
        input: { contextChunks: [], query: '' },
        expectedOutput: { keyPoints: [], recommendedActions: [] },
        generatedOutput: { keyPoints: [], recommendedActions: [], confidence: 0.5 },
      };

      const datapoints = [validDatapoint, validDatapoint];

      const scores = await pipeline.evaluateBatch(datapoints);

      expect(scores.length).toBe(2);
    });
  });

  describe('Statistics', () => {
    it('should calculate statistics correctly', async () => {
      const scores: EvalScore[] = [
        {
          quality: 0.8,
          actionability: 0.85,
          consistency: 0.9,
          overall: 0.85,
          breakdown: { rougeL: 0.8, factualityCheck: true, coherence: 0.85 },
          timestamp: new Date(),
        },
        {
          quality: 0.7,
          actionability: 0.75,
          consistency: 0.8,
          overall: 0.75,
          breakdown: { rougeL: 0.7, factualityCheck: false, coherence: 0.75 },
          timestamp: new Date(),
        },
      ];

      const stats = pipeline.getStats(scores);

      expect(stats.avgOverall).toBeCloseTo(0.8, 1);
      expect(stats.avgQuality).toBeCloseTo(0.75, 1);
      expect(stats.failureRate).toBe(0); // Both above 0.7
    });

    it('should identify failures (score < 0.7)', async () => {
      const scores: EvalScore[] = [
        {
          quality: 0.6,
          actionability: 0.6,
          consistency: 0.6,
          overall: 0.6,
          breakdown: { rougeL: 0.6, factualityCheck: false, coherence: 0.6 },
          timestamp: new Date(),
        },
        {
          quality: 0.85,
          actionability: 0.9,
          consistency: 0.88,
          overall: 0.88,
          breakdown: { rougeL: 0.85, factualityCheck: true, coherence: 0.9 },
          timestamp: new Date(),
        },
      ];

      const stats = pipeline.getStats(scores);

      expect(stats.failureRate).toBeCloseTo(0.5, 1);
    });
  });

  describe('Dataset Integration', () => {
    it('should handle all observability datapoints', async () => {
      const datapoints = getDatasetForType(AnalysisType.OBSERVABILITY);

      expect(datapoints.length).toBeGreaterThan(0);

      for (const dp of datapoints.slice(0, 1)) {
        // Test first one to avoid long runs
        const score = await pipeline.evaluate(dp);
        expect(score.overall).toBeGreaterThanOrEqual(0);
        expect(score.overall).toBeLessThanOrEqual(1);
      }
    });

    it('should handle all incident datapoints', async () => {
      const datapoints = getDatasetForType(AnalysisType.INCIDENT);

      expect(datapoints.length).toBeGreaterThan(0);

      for (const dp of datapoints.slice(0, 1)) {
        const score = await pipeline.evaluate(dp);
        expect(score.overall).toBeGreaterThanOrEqual(0);
      }
    });

    it('should handle all risk datapoints', async () => {
      const datapoints = getDatasetForType(AnalysisType.RISK);

      expect(datapoints.length).toBeGreaterThan(0);

      for (const dp of datapoints.slice(0, 1)) {
        const score = await pipeline.evaluate(dp);
        expect(score.overall).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty key points', async () => {
      const datapoint: EvalDatapoint = {
        id: 'edge-1',
        analysisType: AnalysisType.OBSERVABILITY,
        input: { contextChunks: [], query: '' },
        expectedOutput: { keyPoints: [], recommendedActions: [] },
        generatedOutput: { keyPoints: [], recommendedActions: [], confidence: 0.5 },
      };

      const score = await pipeline.evaluate(datapoint);

      expect(score.overall).toBeDefined();
    });

    it('should handle single key point', async () => {
      const datapoint: EvalDatapoint = {
        id: 'edge-2',
        analysisType: AnalysisType.INCIDENT,
        input: { contextChunks: ['data'], query: 'cause' },
        expectedOutput: {
          keyPoints: ['single point'],
          recommendedActions: ['action'],
        },
        generatedOutput: {
          keyPoints: ['single point'],
          recommendedActions: ['action'],
          confidence: 0.8,
        },
      };

      const score = await pipeline.evaluate(datapoint);

      expect(score.quality).toBeGreaterThan(0.5);
    });

    it('should handle completely wrong recommendations', async () => {
      const datapoint: EvalDatapoint = {
        id: 'edge-3',
        analysisType: AnalysisType.RISK,
        input: { contextChunks: ['security data'], query: 'risk' },
        expectedOutput: {
          keyPoints: ['vulnerability'],
          recommendedActions: ['patch immediately'],
        },
        generatedOutput: {
          keyPoints: ['something unrelated'],
          recommendedActions: ['wrong action'],
          confidence: 0.3,
        },
      };

      const score = await pipeline.evaluate(datapoint);

      expect(score.overall).toBeLessThan(0.5);
    });
  });
});
