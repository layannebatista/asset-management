import { Logger } from 'winston';
import { Pool } from 'pg';
import { Redis } from 'ioredis';
import { AnalysisType } from '../types/analysis.types';
import { ModelPerformanceStore } from './ModelPerformanceStore';

/**
 * Recomendação de otimização de custo
 */
export interface CostOptimizationRecommendation {
  currentModel: string;
  currentCost: number;
  recommendedModel: string;
  recommendedCost: number;
  monthlySavings: number;
  qualityRisk: number; // 0-1: risco de queda de qualidade
  recommendation: string;
  confidence: number;
}

/**
 * CostOptimizationEngine: Aprende quando usar modelos baratos sem perder qualidade
 *
 * Estratégia:
 * - Identifica contextos onde modelos baratos performam bem
 * - Detecta quando qualidade não melhora com modelos caros
 * - Propõe migração automática de modelo
 * - Estima economia mensal
 *
 * Heurística:
 * - Se cheap_model.quality ≈ expensive_model.quality (diferença < 5%) → usar cheap
 * - Se cheap_model.consistency > 0.8 → safe to use
 * - Levar em conta: criticality, contextSize, analysisType
 */
export class CostOptimizationEngine {
  private readonly pgPool: Pool;
  private readonly redis: Redis;
  private readonly logger: Logger;
  private readonly modelStore: ModelPerformanceStore;
  private readonly qualityDeltaThreshold = 0.05; // 5% max delta aceito
  private readonly minConsistency = 0.8; // Min consistency para safe migration
  private readonly cacheTTL = 3600; // 1 hora

  constructor(pgPool: Pool, redis: Redis, logger: Logger, modelStore: ModelPerformanceStore) {
    this.pgPool = pgPool;
    this.redis = redis;
    this.logger = logger;
    this.modelStore = modelStore;
  }

  /**
   * Analisar oportunidade de otimização para um tipo de análise
   */
  async analyzeCostOptimization(analysisType: AnalysisType): Promise<CostOptimizationRecommendation | null> {
    try {
      // ── Step 1: Obter modelo atual (mais usado)
      const rankings = await this.modelStore.rankModelsByType(analysisType);

      if (rankings.length === 0) {
        return null;
      }

      const currentModel = rankings[0];
      const costToMatch = currentModel.cost;

      // ── Step 2: Buscar modelos mais baratos com boa qualidade
      let bestCheaperModel = null;
      let minQualityDelta = Infinity;

      for (const model of rankings.slice(1)) {
        if (model.cost >= costToMatch) {
          continue; // Precisa ser mais barato
        }

        const qualityDelta = currentModel.quality - model.quality;

        if (qualityDelta <= this.qualityDeltaThreshold && qualityDelta < minQualityDelta) {
          bestCheaperModel = model;
          minQualityDelta = qualityDelta;
        }
      }

      if (!bestCheaperModel || minQualityDelta === Infinity) {
        return null; // Sem oportunidade
      }

      // ── Step 3: Validar consistency do modelo mais barato
      const cheaperModelStats = await this.modelStore.getModelStats(bestCheaperModel.model, analysisType);

      if (!cheaperModelStats || cheaperModelStats.medianQuality < 0.65) {
        // Modelo barato não é confiável
        return {
          currentModel: currentModel.model,
          currentCost: currentModel.cost,
          recommendedModel: 'N/A',
          recommendedCost: 0,
          monthlySavings: 0,
          qualityRisk: 0.9,
          recommendation: `No safe migration available. ${bestCheaperModel.model} has insufficient median quality.`,
          confidence: 0.1,
        };
      }

      // ── Step 4: Calcular economia
      const assumedMonthlyExecutions = 1000; // Assumir 1000 execuções/mês
      const currentMonthlyCost = currentModel.cost * assumedMonthlyExecutions;
      const recommendedMonthlyCost = bestCheaperModel.cost * assumedMonthlyExecutions;
      const monthlySavings = currentMonthlyCost - recommendedMonthlyCost;

      // ── Step 5: Calcular risco
      const qualityRisk = Math.min(1, minQualityDelta / this.qualityDeltaThreshold);
      const consistencyScore = Math.max(0, (cheaperModelStats.medianQuality - 0.65) / 0.35); // 0.65 a 1.0 → 0 a 1
      const safetyScore = 1 - qualityRisk * consistencyScore;

      return {
        currentModel: currentModel.model,
        currentCost: currentModel.cost,
        recommendedModel: bestCheaperModel.model,
        recommendedCost: bestCheaperModel.cost,
        monthlySavings,
        qualityRisk,
        recommendation: `Migrate from ${currentModel.model} to ${bestCheaperModel.model}. Quality difference: ${(minQualityDelta * 100).toFixed(1)}%, potential savings: $${monthlySavings.toFixed(2)}/month.`,
        confidence: safetyScore,
      };
    } catch (error) {
      this.logger.error('Error analyzing cost optimization', {
        error: error instanceof Error ? error.message : 'unknown',
      });
      return null;
    }
  }

  /**
   * Detectar modelos que estão sendo sobre-utilizados (paying for premium sem usar)
   */
  async detectOverprovisionedModels(analysisType: AnalysisType): Promise<
    Array<{
      model: string;
      cost: number;
      qualityScore: number;
      utilizationRate: number; // 0-1
      wastedCost: number;
      recommendation: string;
    }>
  > {
    const client = await this.pgPool.connect();

    try {
      // Buscar todos os modelos usados
      const result = await client.query(
        `SELECT
          model,
          AVG(cost_usd)::float as cost,
          AVG(quality_score)::float as quality,
          COUNT(*) as execution_count
        FROM model_performance_log
        WHERE analysis_type = $1
        AND timestamp > NOW() - INTERVAL '30 days'
        GROUP BY model`,
        [analysisType],
      );

      if (result.rows.length === 0) {
        return [];
      }

      const models = result.rows;
      const totalExecutions = models.reduce((s, m) => s + m.execution_count, 0);
      const avgCost = models.reduce((s, m) => s + m.cost, 0) / models.length;

      return models
        .map((m) => {
          const utilizationRate = m.execution_count / totalExecutions;
          const isCheap = m.cost < avgCost * 0.7;
          const hasGoodQuality = m.quality > 0.75;

          let wastedCost = 0;
          let recommendation = '';

          if (!isCheap && !hasGoodQuality) {
            // Caro mas com qualidade ruim
            wastedCost = m.cost * m.execution_count * 0.5;
            recommendation = `REDUCE USAGE: Expensive (${m.cost.toFixed(4)}) with poor quality (${m.quality.toFixed(2)})`;
          } else if (!isCheap && utilizationRate < 0.1) {
            // Caro com pouco uso
            wastedCost = m.cost * m.execution_count * 0.3;
            recommendation = `LOW UTILIZATION: Consider consolidating usage`;
          } else if (isCheap && hasGoodQuality) {
            recommendation = `OPTIMAL: Cost-effective with good quality`;
          }

          return {
            model: m.model,
            cost: m.cost,
            qualityScore: m.quality,
            utilizationRate,
            wastedCost,
            recommendation,
          };
        })
        .sort((a, b) => b.wastedCost - a.wastedCost);
    } finally {
      client.release();
    }
  }

  /**
   * Simular impacto de migração de modelo
   */
  async simulateMigration(
    fromModel: string,
    toModel: string,
    analysisType: AnalysisType,
    monthlyVolume: number = 1000,
  ): Promise<{
    currentMonthlyCost: number;
    projectedMonthlyCost: number;
    estimatedSavings: number;
    qualityImpact: string;
    paybackPeriod: number; // meses
    riskAssessment: string;
  }> {
    const fromStats = await this.modelStore.getModelStats(fromModel, analysisType);
    const toStats = await this.modelStore.getModelStats(toModel, analysisType);

    if (!fromStats || !toStats) {
      return {
        currentMonthlyCost: 0,
        projectedMonthlyCost: 0,
        estimatedSavings: 0,
        qualityImpact: 'insufficient data',
        paybackPeriod: 0,
        riskAssessment: 'unable to assess',
      };
    }

    const currentCost = fromStats.avgCost * monthlyVolume;
    const projectedCost = toStats.avgCost * monthlyVolume;
    const savings = currentCost - projectedCost;

    // Qualidade
    const qualityDelta = toStats.avgQuality - fromStats.avgQuality;
    let qualityImpact = 'neutral';
    if (qualityDelta > 0.05) {
      qualityImpact = `improvement (+${(qualityDelta * 100).toFixed(1)}%)`;
    } else if (qualityDelta < -0.05) {
      qualityImpact = `degradation (${(qualityDelta * 100).toFixed(1)}%)`;
    }

    // Risco
    let riskAssessment = 'low';
    if (toStats.p95Quality < 0.65 || toStats.totalCost > 500) {
      riskAssessment = 'high';
    } else if (qualityDelta < -0.05 || toStats.avgLatency > fromStats.avgLatency * 2) {
      riskAssessment = 'medium';
    }

    // Payback period (assumindo custos de implementação de $500)
    const implementationCost = 500;
    const paybackPeriod = savings > 0 ? Math.ceil(implementationCost / savings) : 999;

    return {
      currentMonthlyCost: currentCost,
      projectedMonthlyCost: projectedCost,
      estimatedSavings: savings,
      qualityImpact,
      paybackPeriod,
      riskAssessment,
    };
  }

  /**
   * Calibrador de Confidence baseado em histórico real
   * (Integrado para evitar arquivo extra)
   */
  async calibrateConfidenceScore(
    analysisType: AnalysisType,
    predictedConfidence: number,
    contextSize: number,
  ): Promise<{
    calibratedConfidence: number;
    adjustment: number;
    justification: string;
  }> {
    const client = await this.pgPool.connect();

    try {
      // Buscar histórico de confidence prediction errors
      const result = await client.query(
        `SELECT
          COUNT(*) as total_cases,
          AVG(ABS(predicted_confidence - actual_quality))::float as avg_error,
          STDDEV(predicted_confidence - actual_quality)::float as std_error,
          AVG(CASE WHEN ABS(context_size - $2) < 500 THEN predicted_confidence - actual_quality ELSE NULL END)::float as context_error
        FROM confidence_calibration_history
        WHERE analysis_type = $1
        AND timestamp > NOW() - INTERVAL '60 days'`,
        [analysisType, contextSize],
      );

      if (result.rows.length === 0 || !result.rows[0].avg_error) {
        // Sem histórico, retornar com ajuste minimal
        return {
          calibratedConfidence: predictedConfidence,
          adjustment: 0,
          justification: 'no calibration history available',
        };
      }

      const row = result.rows[0];
      const avgError = row.avg_error;
      const stdError = row.std_error || 0;
      const contextError = row.context_error || 0;

      // Calcular ajuste
      let adjustment = 0;

      // Se historicamente predizemos muito alto, reduzir
      if (avgError > 0.05) {
        adjustment -= avgError * 0.5;
      }

      // Se há variação alta, ser mais conservador
      if (stdError > 0.1) {
        adjustment -= stdError * 0.3;
      }

      // Se há erro específico para este contexto size, aplicar
      if (contextError && Math.abs(contextError) > 0.02) {
        adjustment -= contextError * 0.5;
      }

      const calibrated = Math.max(0, Math.min(1, predictedConfidence + adjustment));
      const justification = `calibrated for avg_error=${avgError.toFixed(3)}, std=${stdError.toFixed(3)}`;

      return {
        calibratedConfidence: calibrated,
        adjustment,
        justification,
      };
    } finally {
      client.release();
    }
  }

  /**
   * Registrar previsão de confidence para calibração futura
   */
  async recordConfidencePrediction(
    analysisType: AnalysisType,
    predictedConfidence: number,
    actualQuality: number,
    contextSize: number,
  ): Promise<void> {
    try {
      const client = await this.pgPool.connect();

      try {
        await client.query(
          `INSERT INTO confidence_calibration_history
          (analysis_type, predicted_confidence, actual_quality, context_size, timestamp)
          VALUES ($1, $2, $3, $4, NOW())`,
          [analysisType, predictedConfidence, actualQuality, contextSize],
        );
      } finally {
        client.release();
      }
    } catch (error) {
      this.logger.warn('Failed to record confidence prediction', {
        error: error instanceof Error ? error.message : 'unknown',
      });
    }
  }

  /**
   * Gerar relatório de economia anual
   */
  async generateAnnualSavingsReport(days: number = 90): Promise<{
    currentAnnualCost: number;
    potentialAnnualSavings: number;
    savingsPercentage: number;
    optimizationOpportunities: number;
    estimatedPaybackMonths: number;
  }> {
    const client = await this.pgPool.connect();

    try {
      const result = await client.query(
        `SELECT
          SUM(cost_usd)::float as total_cost,
          COUNT(DISTINCT model) as model_count
        FROM model_performance_log
        WHERE timestamp > NOW() - INTERVAL '${days} days'`,
      );

      if (result.rows.length === 0) {
        return {
          currentAnnualCost: 0,
          potentialAnnualSavings: 0,
          savingsPercentage: 0,
          optimizationOpportunities: 0,
          estimatedPaybackMonths: 0,
        };
      }

      const totalCost = result.rows[0].total_cost || 0;
      const annualized = (totalCost / days) * 365;

      // Estimar economia (conservativamente 15-20% de otimização)
      const potentialSavings = annualized * 0.18;
      const implementations = result.rows[0].model_count || 1;
      const implementationCost = implementations * 1000; // $1k por otimização
      const paybackMonths = implementationCost > 0 ? Math.ceil((implementationCost * 12) / potentialSavings) : 1;

      return {
        currentAnnualCost: annualized,
        potentialAnnualSavings: potentialSavings,
        savingsPercentage: (potentialSavings / annualized) * 100,
        optimizationOpportunities: implementations,
        estimatedPaybackMonths: paybackMonths,
      };
    } finally {
      client.release();
    }
  }
}
