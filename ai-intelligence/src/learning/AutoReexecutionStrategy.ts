import { Logger } from 'winston';
import { Pool } from 'pg';
import { Redis } from 'ioredis';
import { AnalysisType } from '../types/analysis.types';
import { ModelPerformanceStore } from './ModelPerformanceStore';

/**
 * Decisão de reexecução
 */
export interface ReexecutionDecision {
  shouldReexecute: boolean;
  strategy: 'different_model' | 'same_model_with_expanded_context' | 'skip_reexecution';
  newModel?: string;
  estimatedCostDelta: number;
  estimatedQualityImprovement: number;
  confidence: number;
  justification: string;
}

/**
 * AutoReexecutionStrategy: Decide inteligentemente quando reexecutar com base em:
 * - Qualidade da decisão inicial
 * - Criticidade da análise
 * - Custo estimado vs benefício
 * - Histórico de reexecução (learning)
 * - Padrões de sucesso conhecidos
 *
 * Algoritmo de decisão:
 * ────────────────────
 * IF criticality == CRITICAL AND quality < 0.75:
 *   → REEXECUTE com modelo melhor
 * ELSE IF quality < threshold AND cost_delta < 5cents:
 *   → REEXECUTE com modelo diferente
 * ELSE IF quality < threshold AND context_could_help:
 *   → REEXECUTE com contexto expandido (mesmo modelo)
 * ELSE:
 *   → SKIP
 */
export class AutoReexecutionStrategy {
  private readonly pgPool: Pool;
  private readonly redis: Redis;
  private readonly logger: Logger;
  private readonly modelStore: ModelPerformanceStore;

  // Thresholds
  private readonly CRITICAL_QUALITY_THRESHOLD = 0.75; // Critical analysis needs 75%+ quality
  private readonly HIGH_QUALITY_THRESHOLD = 0.70;
  private readonly NORMAL_QUALITY_THRESHOLD = 0.65;
  private readonly LOW_QUALITY_THRESHOLD = 0.60;

  private readonly MAX_REEXECUTION_COST = 0.05; // $0.05 max para reexecução
  private readonly MAX_REEXECUTION_PER_DECISION = 2; // Máx 2 reexecuções por decisão

  constructor(pgPool: Pool, redis: Redis, logger: Logger, modelStore: ModelPerformanceStore) {
    this.pgPool = pgPool;
    this.redis = redis;
    this.logger = logger;
    this.modelStore = modelStore;
  }

  /**
   * Decidir se deve reexecutar e qual estratégia usar
   */
  async decideReexecution(
    decisionId: string,
    analysisType: AnalysisType,
    qualityScore: number,
    criticality: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL',
    currentModel: string,
    currentCost: number,
    reexecutionCount: number = 0,
    contextSize: number = 1500,
  ): Promise<ReexecutionDecision> {
    try {
      // ── Step 1: Validar limites
      if (reexecutionCount >= this.MAX_REEXECUTION_PER_DECISION) {
        return {
          shouldReexecute: false,
          strategy: 'skip_reexecution',
          estimatedCostDelta: 0,
          estimatedQualityImprovement: 0,
          confidence: 1.0,
          justification: 'max reexecution limit reached',
        };
      }

      // ── Step 2: Determinar threshold baseado em criticality
      const threshold = this._getQualityThreshold(criticality);

      if (qualityScore >= threshold) {
        return {
          shouldReexecute: false,
          strategy: 'skip_reexecution',
          estimatedCostDelta: 0,
          estimatedQualityImprovement: 0,
          confidence: 1.0,
          justification: `quality ${qualityScore.toFixed(2)} meets threshold ${threshold.toFixed(2)} for ${criticality}`,
        };
      }

      // ── Step 3: Testar estratégias de reexecução
      const deficitScore = threshold - qualityScore;

      // Estratégia A: Modelo diferente
      const differentModelStrategy = await this._evaluateDifferentModel(
        analysisType,
        currentModel,
        currentCost,
        deficitScore,
      );

      // Estratégia B: Contexto expandido
      const expandedContextStrategy = await this._evaluateExpandedContext(
        analysisType,
        currentModel,
        contextSize,
        deficitScore,
      );

      // ── Step 4: Escolher melhor estratégia
      const strategies = [
        { ...differentModelStrategy, type: 'different_model' as const },
        { ...expandedContextStrategy, type: 'expanded_context' as const },
      ];

      const bestStrategy = strategies
        .filter((s) => s.shouldReexecute)
        .sort((a, b) => {
          // Priorizar por: benefit/cost ratio
          const ratioA = (a.estimatedQualityImprovement || 0) / (a.costDelta || 0.001);
          const ratioB = (b.estimatedQualityImprovement || 0) / (b.costDelta || 0.001);
          return ratioB - ratioA;
        })[0];

      if (!bestStrategy) {
        return {
          shouldReexecute: false,
          strategy: 'skip_reexecution',
          estimatedCostDelta: 0,
          estimatedQualityImprovement: 0,
          confidence: 0.8,
          justification: `no viable reexecution strategy for quality deficit of ${deficitScore.toFixed(2)}`,
        };
      }

      // ── Step 5: Registrar decisão
      await this._recordReexecutionDecision(decisionId, bestStrategy);

      const result: ReexecutionDecision = {
        shouldReexecute: true,
        strategy: bestStrategy.type === 'different_model' ? 'different_model' : 'same_model_with_expanded_context',
        newModel: bestStrategy.type === 'different_model' ? bestStrategy.newModel : undefined,
        estimatedCostDelta: bestStrategy.costDelta,
        estimatedQualityImprovement: bestStrategy.estimatedQualityImprovement,
        confidence: bestStrategy.confidence,
        justification: bestStrategy.reason,
      };

      this.logger.info('Reexecution decision made', {
        decisionId: decisionId.substring(0, 8),
        strategy: result.strategy,
        qualityImprovement: result.estimatedQualityImprovement.toFixed(2),
        costDelta: result.estimatedCostDelta.toFixed(4),
      });

      return result;
    } catch (error) {
      this.logger.error('Error deciding reexecution', {
        error: error instanceof Error ? error.message : 'unknown',
      });

      return {
        shouldReexecute: false,
        strategy: 'skip_reexecution',
        estimatedCostDelta: 0,
        estimatedQualityImprovement: 0,
        confidence: 0,
        justification: `error in reexecution analysis: ${error instanceof Error ? error.message : 'unknown'}`,
      };
    }
  }

  /**
   * Analisar sucesso histórico de reexecuções
   */
  async analyzeReexecutionSuccessRate(analysisType: AnalysisType): Promise<{
    totalReexecutions: number;
    successfulReexecutions: number;
    successRate: number;
    avgQualityImprovement: number;
    avgCostPerReexecution: number;
  }> {
    const client = await this.pgPool.connect();

    try {
      const result = await client.query(
        `SELECT
          COUNT(*) as total_reexecutions,
          SUM(CASE WHEN final_quality - initial_quality > 0.05 THEN 1 ELSE 0 END) as successful,
          AVG(final_quality - initial_quality)::float as avg_improvement,
          AVG(reexecution_cost)::float as avg_cost
        FROM reexecution_history
        WHERE analysis_type = $1
        AND timestamp > NOW() - INTERVAL '30 days'`,
        [analysisType],
      );

      if (result.rows.length === 0) {
        return {
          totalReexecutions: 0,
          successfulReexecutions: 0,
          successRate: 0,
          avgQualityImprovement: 0,
          avgCostPerReexecution: 0,
        };
      }

      const row = result.rows[0];
      const total = parseInt(row.total_reexecutions || '0');
      const successful = parseInt(row.successful || '0');

      return {
        totalReexecutions: total,
        successfulReexecutions: successful,
        successRate: total > 0 ? successful / total : 0,
        avgQualityImprovement: row.avg_improvement || 0,
        avgCostPerReexecution: row.avg_cost || 0,
      };
    } finally {
      client.release();
    }
  }

  /**
   * Gerar estatísticas de reexecução por tipo
   */
  async getReexecutionStatsByType(): Promise<
    Array<{
      analysisType: AnalysisType;
      reexecutionRate: number; // % de decisões que foram reexecutadas
      successRate: number; // % de reexecuções bem-sucedidas
      avgCostOfReexecution: number;
      recommendation: string;
    }>
  > {
    const client = await this.pgPool.connect();

    try {
      const result = await client.query(`
        SELECT
          analysis_type,
          SUM(CASE WHEN reexecution_count > 0 THEN 1 ELSE 0 END)::float / COUNT(*) as reexecution_rate,
          SUM(CASE WHEN final_quality > initial_quality + 0.05 THEN 1 ELSE 0 END)::float /
            NULLIF(SUM(CASE WHEN reexecution_count > 0 THEN 1 ELSE 0 END), 0) as success_rate,
          AVG(CASE WHEN reexecution_count > 0 THEN reexecution_cost ELSE NULL END)::float as avg_cost
        FROM decision_execution_log
        WHERE timestamp > NOW() - INTERVAL '30 days'
        GROUP BY analysis_type
      `);

      return result.rows.map((row) => {
        const reexecRate = row.reexecution_rate || 0;
        const successRate = row.success_rate || 0;
        let recommendation = '';

        if (reexecRate > 0.4) {
          recommendation = 'HIGH REEXECUTION RATE: Review model selection or initial context';
        } else if (successRate < 0.5) {
          recommendation = 'POOR SUCCESS: Reexecution strategy needs refinement';
        } else if (successRate > 0.8) {
          recommendation = 'EFFECTIVE: Reexecution strategy is working well';
        } else {
          recommendation = 'ACCEPTABLE: Monitor for improvements';
        }

        return {
          analysisType: row.analysis_type as AnalysisType,
          reexecutionRate: reexecRate,
          successRate: successRate || 0,
          avgCostOfReexecution: row.avg_cost || 0,
          recommendation,
        };
      });
    } finally {
      client.release();
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // Private methods
  // ═══════════════════════════════════════════════════════════════════

  private _getQualityThreshold(criticality: string): number {
    switch (criticality) {
      case 'CRITICAL':
        return this.CRITICAL_QUALITY_THRESHOLD;
      case 'HIGH':
        return this.HIGH_QUALITY_THRESHOLD;
      case 'NORMAL':
        return this.NORMAL_QUALITY_THRESHOLD;
      case 'LOW':
      default:
        return this.LOW_QUALITY_THRESHOLD;
    }
  }

  /**
   * Avaliar estratégia: trocar para modelo diferente
   */
  private async _evaluateDifferentModel(
    analysisType: AnalysisType,
    currentModel: string,
    currentCost: number,
    deficitScore: number,
  ): Promise<{
    shouldReexecute: boolean;
    newModel?: string;
    costDelta: number;
    estimatedQualityImprovement: number;
    confidence: number;
    reason: string;
  }> {
    const recommendation = await this.modelStore.recommendBestModel(analysisType, 1500, 'quality');

    if (!recommendation.model || recommendation.model === currentModel) {
      return {
        shouldReexecute: false,
        costDelta: 0,
        estimatedQualityImprovement: 0,
        confidence: 0,
        reason: 'no better model available',
      };
    }

    const betterModelStats = await this.modelStore.getModelStats(recommendation.model, analysisType);
    const currentModelStats = await this.modelStore.getModelStats(currentModel, analysisType);

    if (!betterModelStats || !currentModelStats) {
      return {
        shouldReexecute: false,
        costDelta: 0,
        estimatedQualityImprovement: 0,
        confidence: 0,
        reason: 'insufficient stats for comparison',
      };
    }

    const costDelta = betterModelStats.avgCost - currentModelStats.avgCost;
    const qualityDelta = betterModelStats.avgQuality - currentModelStats.avgQuality;

    // Verificar viabilidade
    if (costDelta > this.MAX_REEXECUTION_COST) {
      return {
        shouldReexecute: false,
        costDelta,
        estimatedQualityImprovement: qualityDelta,
        confidence: 0,
        reason: `cost delta ${costDelta.toFixed(4)} exceeds max ${this.MAX_REEXECUTION_COST}`,
      };
    }

    if (qualityDelta < deficitScore * 0.5) {
      // Modelo melhor not good enough
      return {
        shouldReexecute: false,
        costDelta,
        estimatedQualityImprovement: qualityDelta,
        confidence: 0,
        reason: `quality improvement ${qualityDelta.toFixed(2)} < deficit ${deficitScore.toFixed(2)}`,
      };
    }

    return {
      shouldReexecute: true,
      newModel: recommendation.model,
      costDelta,
      estimatedQualityImprovement: qualityDelta,
      confidence: Math.min(1, qualityDelta / deficitScore),
      reason: `switch to ${recommendation.model}: +${(qualityDelta * 100).toFixed(1)}% quality, ${costDelta > 0 ? '+' : ''}${(costDelta * 10000).toFixed(0)}¢`,
    };
  }

  /**
   * Avaliar estratégia: expandir contexto
   */
  private async _evaluateExpandedContext(
    analysisType: AnalysisType,
    model: string,
    currentContextSize: number,
    deficitScore: number,
  ): Promise<{
    shouldReexecute: boolean;
    costDelta: number;
    estimatedQualityImprovement: number;
    confidence: number;
    reason: string;
  }> {
    // Contexto expandido: +50% tokens
    const expandedSize = currentContextSize * 1.5;

    // Estimativa: cada 500 tokens = $0.001 (gpt-4o)
    const tokenCost = (expandedSize - currentContextSize) / 500 * 0.001;

    if (tokenCost > this.MAX_REEXECUTION_COST) {
      return {
        shouldReexecute: false,
        costDelta: tokenCost,
        estimatedQualityImprovement: 0,
        confidence: 0,
        reason: `expanded context cost ${tokenCost.toFixed(4)} exceeds max`,
      };
    }

    // Estimativa de melhoria: contexto expandido típicamente melhora em 5-15%
    const estimatedImprovement = 0.08; // 8% estimated

    if (estimatedImprovement < deficitScore * 0.3) {
      return {
        shouldReexecute: false,
        costDelta: tokenCost,
        estimatedQualityImprovement: estimatedImprovement,
        confidence: 0,
        reason: `estimated improvement ${(estimatedImprovement * 100).toFixed(1)}% < ${(deficitScore * 30).toFixed(1)}% of deficit`,
      };
    }

    return {
      shouldReexecute: true,
      costDelta: tokenCost,
      estimatedQualityImprovement: estimatedImprovement,
      confidence: 0.6, // Confiança moderada em estratégia de contexto
      reason: `expand context +50%: estimated +${(estimatedImprovement * 100).toFixed(1)}% quality, ${(tokenCost * 10000).toFixed(0)}¢`,
    };
  }

  private async _recordReexecutionDecision(decisionId: string, strategy: any): Promise<void> {
    try {
      const client = await this.pgPool.connect();

      try {
        await client.query(
          `INSERT INTO reexecution_decisions
          (decision_id, strategy, estimated_improvement, estimated_cost, timestamp)
          VALUES ($1, $2, $3, $4, NOW())`,
          [decisionId, strategy.type, strategy.estimatedQualityImprovement, strategy.costDelta],
        );
      } finally {
        client.release();
      }
    } catch (error) {
      this.logger.warn('Failed to record reexecution decision', {
        error: error instanceof Error ? error.message : 'unknown',
      });
    }
  }
}
