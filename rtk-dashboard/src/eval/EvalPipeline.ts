/**
 * Eval Pipeline: Quality evaluation framework
 *
 * Evaluates analyses across 3 dimensions:
 * - Quality: Does it cover key points? (ROUGE-L, factuality)
 * - Actionability: Are recommendations specific and executable?
 * - Consistency: Does it align with historical analyses?
 *
 * Score: 0-1, weighted average of dimensions
 */

import { Logger } from 'winston';
import { AnalysisType } from '../types/analysis.types';
import { LLMClient } from '../llm/LLMClient';
import { AnalysisRepository } from '../storage/AnalysisRepository';

export interface EvalDatapoint {
  id: string;
  analysisType: AnalysisType;
  input: {
    contextChunks: string[];
    query: string;
  };
  expectedOutput: {
    keyPoints: string[];
    recommendedActions: string[];
    riskLevel?: 'low' | 'medium' | 'high' | 'critical';
    confidence?: number;
  };
  generatedOutput: {
    keyPoints: string[];
    recommendedActions: string[];
    riskLevel?: string;
    confidence: number;
  };
}

export interface EvalBreakdown {
  rougeL: number; // 0-1
  factualityCheck: boolean;
  coherence: number; // 0-1
}

export interface EvalScore {
  quality: number; // 0-1
  actionability: number; // 0-1
  consistency: number; // 0-1
  overall: number; // weighted average
  breakdown: EvalBreakdown;
  timestamp: Date;
}

export class EvalPipeline {
  private readonly llm: LLMClient;
  private readonly repository: AnalysisRepository;
  private readonly logger: Logger;

  // Weights for overall score
  private readonly weights = {
    quality: 0.5,
    actionability: 0.3,
    consistency: 0.2,
  };

  constructor(llm: LLMClient, repository: AnalysisRepository, logger: Logger) {
    this.llm = llm;
    this.repository = repository;
    this.logger = logger;
  }

  /**
   * Evaluate a single analysis against expected output
   */
  async evaluate(datapoint: EvalDatapoint): Promise<EvalScore> {
    this.logger.debug('Evaluating analysis', { datapointId: datapoint.id });

    const [qualityScore, actionabilityScore, consistencyScore, breakdown] = await Promise.all([
      this._evalQuality(datapoint),
      this._evalActionability(datapoint),
      this._evalConsistency(datapoint),
      this._computeBreakdown(datapoint),
    ]);

    const overall =
      qualityScore * this.weights.quality +
      actionabilityScore * this.weights.actionability +
      consistencyScore * this.weights.consistency;

    const score: EvalScore = {
      quality: qualityScore,
      actionability: actionabilityScore,
      consistency: consistencyScore,
      overall,
      breakdown,
      timestamp: new Date(),
    };

    this.logger.info('Evaluation complete', {
      datapointId: datapoint.id,
      scores: score,
    });

    return score;
  }

  /**
   * Dimension 1: Quality - Does output cover key points?
   * Uses ROUGE-L + factuality check
   */
  private async _evalQuality(dp: EvalDatapoint): Promise<number> {
    const rougeScore = this._computeRougeLScore(dp);

    const factuality = await this._checkFactuality(dp);

    // 70% ROUGE-L, 30% factuality
    return rougeScore * 0.7 + (factuality ? 1.0 : 0.5) * 0.3;
  }

  /**
   * Dimension 2: Actionability - Are recommendations specific and executable?
   */
  private async _evalActionability(dp: EvalDatapoint): Promise<number> {
    const prompt = `You are an expert evaluator. Rate how actionable these recommendations are.

Expected Actions:
${dp.expectedOutput.recommendedActions.map((a, i) => `${i + 1}. ${a}`).join('\n')}

Generated Actions:
${dp.generatedOutput.recommendedActions.map((a, i) => `${i + 1}. ${a}`).join('\n')}

Criteria for actionability (0-100):
- Are they specific? (not vague)
- Can they be executed? (not just wishes)
- Are there success metrics? (measurable)
- Do they have timelines? (estimated effort)

Return JSON: { "score": <number 0-100> }`;

    try {
      const response = await this.llm.call({
        systemPrompt:
          'You are an actionability expert. Evaluate if recommendations are specific, executable, and measurable.',
        userPrompt: prompt,
      });

      const parsed = JSON.parse(response.content);
      return Math.min(100, Math.max(0, parsed.score)) / 100;
    } catch (error) {
      this.logger.warn('Actionability eval failed', { error });
      return 0.5;
    }
  }

  /**
   * Dimension 3: Consistency - Does it align with historical analyses?
   */
  private async _evalConsistency(dp: EvalDatapoint): Promise<number> {
    try {
      // Get recent analyses of same type
      const recent = await this.repository.findRecent(dp.analysisType, 5);

      if (recent.length === 0) {
        return 1.0; // No history to check against
      }

      const prompt = `Compare this new recommendation against recent similar analyses.

Recent conclusions:
${recent
  .slice(0, 3)
  .map((r, i) => {
    const summary = 'summary' in r
      ? r.summary
      : ('executiveSummary' in r ? r.executiveSummary : 'No summary');
    return `${i + 1}. ${summary || 'No summary'}`;
  })
  .join('\n')}

New recommendation:
${dp.generatedOutput.recommendedActions.join('\n')}

Rate alignment (0-100):
- 0 = contradicts historical analyses
- 50 = partially aligned
- 100 = fully aligned with patterns

Return JSON: { "score": <number 0-100>, "conflicts": [<list of contradictions if any>] }`;

      const response = await this.llm.call({
        systemPrompt: 'You are a consistency checker for analysis recommendations.',
        userPrompt: prompt,
      });

      const parsed = JSON.parse(response.content);

      if (parsed.conflicts && parsed.conflicts.length > 0) {
        this.logger.warn('Consistency issues detected', { conflicts: parsed.conflicts });
      }

      return Math.min(100, Math.max(0, parsed.score)) / 100;
    } catch (error) {
      this.logger.warn('Consistency eval failed', { error });
      return 0.5;
    }
  }

  /**
   * Compute breakdown metrics
   */
  private async _computeBreakdown(dp: EvalDatapoint): Promise<EvalBreakdown> {
    return {
      rougeL: this._computeRougeLScore(dp),
      factualityCheck: await this._checkFactuality(dp),
      coherence: await this._checkCoherence(dp),
    };
  }

  /**
   * ROUGE-L: Longest Common Subsequence ratio
   * Measures how well generated output covers expected key points
   */
  private _computeRougeLScore(dp: EvalDatapoint): number {
    const expectedText = dp.expectedOutput.keyPoints.join(' ').toLowerCase();
    const generatedText = dp.generatedOutput.keyPoints.join(' ').toLowerCase();

    const lcs = this._lcs(expectedText, generatedText);
    const maxLen = Math.max(expectedText.length, generatedText.length);

    return maxLen > 0 ? lcs / maxLen : 0;
  }

  /**
   * Factuality check: Does recommendation align with input context?
   */
  private async _checkFactuality(dp: EvalDatapoint): Promise<boolean> {
    try {
      const contextStr = dp.input.contextChunks.join('\n');

      const prompt = `Does the following recommendation align with the provided context?
Respond true/false (ignore subjective disagreements, flag only contradictions).

Context:
${contextStr}

Recommendation:
${dp.generatedOutput.recommendedActions.join('\n')}

Return JSON: { "aligned": <boolean>, "issues": [<list if not aligned>] }`;

      const response = await this.llm.call({
        systemPrompt: 'You are a factuality checker for recommendations.',
        userPrompt: prompt,
      });

      const parsed = JSON.parse(response.content);
      return parsed.aligned === true;
    } catch (error) {
      this.logger.warn('Factuality check failed', { error });
      return false;
    }
  }

  /**
   * Coherence check: Do recommendations conflict internally?
   */
  private async _checkCoherence(dp: EvalDatapoint): Promise<number> {
    try {
      const prompt = `Rate the internal coherence of these recommendations (0-100).
Do they contradict? Are they logically consistent?

${dp.generatedOutput.recommendedActions.map((a, i) => `${i + 1}. ${a}`).join('\n')}

Return JSON: { "score": <number 0-100> }`;

      const response = await this.llm.call({
        systemPrompt: 'You are a coherence evaluator for recommendations.',
        userPrompt: prompt,
      });

      const parsed = JSON.parse(response.content);
      return Math.min(100, Math.max(0, parsed.score)) / 100;
    } catch (error) {
      this.logger.warn('Coherence check failed', { error });
      return 0.5;
    }
  }

  /**
   * Longest Common Subsequence algorithm
   */
  private _lcs(s1: string, s2: string): number {
    const m = s1.length;
    const n = s2.length;
    const dp: number[][] = Array(m + 1)
      .fill(null)
      .map(() => Array(n + 1).fill(0));

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (s1[i - 1] === s2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }

    return dp[m][n];
  }

  /**
   * Batch evaluate multiple datapoints
   */
  async evaluateBatch(datapoints: EvalDatapoint[]): Promise<EvalScore[]> {
    this.logger.info('Starting batch evaluation', { count: datapoints.length });

    const results: EvalScore[] = [];

    for (const dp of datapoints) {
      try {
        const score = await this.evaluate(dp);
        results.push(score);
      } catch (error) {
        this.logger.error('Batch eval item failed', { datapointId: dp.id, error });
        results.push({
          quality: 0,
          actionability: 0,
          consistency: 0,
          overall: 0,
          breakdown: { rougeL: 0, factualityCheck: false, coherence: 0 },
          timestamp: new Date(),
        });
      }
    }

    // Log summary
    const avgScore = results.reduce((s, r) => s + r.overall, 0) / (results.length || 1);
    const qualityScores = results.map((r) => r.quality);
    const minQuality = Math.min(...qualityScores);
    const maxQuality = Math.max(...qualityScores);

    this.logger.info('Batch evaluation complete', {
      evaluated: results.length,
      avgScore: avgScore.toFixed(3),
      minQuality: minQuality.toFixed(3),
      maxQuality: maxQuality.toFixed(3),
    });

    return results;
  }

  /**
   * Get eval statistics
   */
  getStats(scores: EvalScore[]): {
    avgOverall: number;
    avgQuality: number;
    avgActionability: number;
    avgConsistency: number;
    failureRate: number;
  } {
    if (scores.length === 0) {
      return {
        avgOverall: 0,
        avgQuality: 0,
        avgActionability: 0,
        avgConsistency: 0,
        failureRate: 0,
      };
    }

    const avgOverall = scores.reduce((s, r) => s + r.overall, 0) / scores.length;
    const avgQuality = scores.reduce((s, r) => s + r.quality, 0) / scores.length;
    const avgActionability = scores.reduce((s, r) => s + r.actionability, 0) / scores.length;
    const avgConsistency = scores.reduce((s, r) => s + r.consistency, 0) / scores.length;
    const failureRate = scores.filter((r) => r.overall < 0.7).length / scores.length;

    return {
      avgOverall,
      avgQuality,
      avgActionability,
      avgConsistency,
      failureRate,
    };
  }
}
