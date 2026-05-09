import { Logger } from 'winston';
import { Pool } from 'pg';
import { Redis } from 'ioredis';

import { LearningEngine } from './LearningEngine';
import { HistoricalSuccessTracker } from './HistoricalSuccessTracker';
import { ModelPerformanceStore } from './ModelPerformanceStore';
import { PromptPerformanceTracker } from './PromptPerformanceTracker';
import { CostOptimizationEngine } from './CostOptimizationEngine';
import { AutoReexecutionStrategy } from './AutoReexecutionStrategy';
import { CrossDecisionIntelligence } from './CrossDecisionIntelligence';
import { FeedbackSignal } from '../types/DecisionOutput';
import { AnalysisType } from '../types/analysis.types';

/**
 * Sistema de Aprendizado Unificado
 *
 * Fluxo de auto-melhoria:
 * ─────────────────────
 * 1. Decisão é tomada (qualityScore calculado)
 * 2. Feedback chega do usuário
 * 3. LearningEngine processa feedback + RTK
 * 4. Componentes aprendem:
 *    - ModelPerformanceStore: qual modelo é melhor
 *    - PromptPerformanceTracker: qual prompt é melhor
 *    - ContextIntelligence: quais chunks são úteis
 *    - CostOptimizationEngine: onde economizar
 *    - AutoReexecutionStrategy: quando reexecutar
 *    - CrossDecisionIntelligence: como decisões se influenciam
 * 5. Próxima decisão beneficia dos learnings anteriores
 *
 * Métricas de aprendizado:
 * ─────────────────────
 * - learning_rate: quão rápido aprende (0.15 por padrão)
 * - improvement_over_time: % melhoria em qualidade
 * - model_efficiency: quality/cost ratio
 * - decision_success_rate: feedback positivo %
 * - cost_reduction: economia realizada
 */
export class LearningEngineOrchestrator {
  // Componentes
  private learningEngine: LearningEngine;
  private modelPerformanceStore: ModelPerformanceStore;
  private promptPerformanceTracker: PromptPerformanceTracker;
  private costOptimizationEngine: CostOptimizationEngine;
  private autoReexecutionStrategy: AutoReexecutionStrategy;
  private crossDecisionIntelligence: CrossDecisionIntelligence;
  private historicalSuccessTracker: HistoricalSuccessTracker;

  // Shared
  private readonly pgPool: Pool;
  private readonly redis: Redis;
  private readonly logger: Logger;

  constructor(pgPool: Pool, redis: Redis, logger: Logger) {
    this.pgPool = pgPool;
    this.redis = redis;
    this.logger = logger;

    // Inicializar componentes
    this.historicalSuccessTracker = new HistoricalSuccessTracker(redis, pgPool, logger);
    this.learningEngine = new LearningEngine(pgPool, redis, logger, this.historicalSuccessTracker);
    this.modelPerformanceStore = new ModelPerformanceStore(pgPool, redis, logger);
    this.promptPerformanceTracker = new PromptPerformanceTracker(pgPool, redis, logger);
    this.costOptimizationEngine = new CostOptimizationEngine(pgPool, redis, logger, this.modelPerformanceStore);
    this.autoReexecutionStrategy = new AutoReexecutionStrategy(pgPool, redis, logger, this.modelPerformanceStore);
    this.crossDecisionIntelligence = new CrossDecisionIntelligence(pgPool, redis, logger);

    this.logger.info('LearningEngineOrchestrator initialized', {
      components: 6,
    });
  }

  /**
   * Processar feedback + orquestrar aprendizado
   */
  async processFeedbackAndLearn(
    signal: FeedbackSignal,
    previousDecision: {
      id: string;
      type: AnalysisType;
      qualityScore: number;
      model: string;
      cost: number;
      criticality: string;
      contextSize: number;
    },
  ): Promise<{
    learning: {
      modelWeightUpdates: string[];
      promptOptimizations: string[];
      costReductions: number;
      confidenceCalibration: number;
    };
    nextDecisionImprovements: {
      recommendedModel: string;
      expectedQualityImprovement: number;
      expectedCostSavings: number;
      criticalityAdjustment?: string;
    };
  }> {
    try {
      // ── Phase 1: Learning Engine processa feedback
      this.logger.info('Processing feedback for learning', {
        decisionId: signal.decision_id,
        feedbackType: signal.feedback_type,
      });

      const learningSignal = await this.learningEngine.processFeedback(signal, previousDecision.qualityScore);

      // ── Phase 2: Registrar execução em store
      await this.modelPerformanceStore.recordExecution({
        model: previousDecision.model,
        analysisType: previousDecision.type,
        contextSize: previousDecision.contextSize,
        qualityScore: learningSignal.metrics.actualQuality,
        latencyMs: 3000, // TODO: obter real
        costUsd: previousDecision.cost,
        timestamp: new Date(),
      });

      // ── Phase 3: Registrar decisão para correlação
      await this.crossDecisionIntelligence.recordDecision(
        previousDecision.id,
        previousDecision.type,
        learningSignal.metrics.actualQuality,
        signal.feedback_type === 'positive',
        {
          criticality: previousDecision.criticality,
          model: previousDecision.model,
          cost: previousDecision.cost,
        },
      );

      // ── Phase 4: Analisar oportunidades de otimização
      const costOptimization = await this.costOptimizationEngine.analyzeCostOptimization(previousDecision.type);

      // ── Phase 5: Recomendações para próxima decisão
      const nextModelRecommendation = await this.learningEngine.recommendModel(
        previousDecision.type,
        previousDecision.contextSize,
      );

      const reexecutionAnalysis = await this.autoReexecutionStrategy.analyzeReexecutionSuccessRate(previousDecision.type);

      // ── Phase 6: Detectar influências cruzadas
      const crossInfluences = await this.crossDecisionIntelligence.detectInfluence(
        previousDecision.type,
        { model: previousDecision.model },
      );

      const result = {
        learning: {
          modelWeightUpdates: learningSignal.adaptations.filter((a) => a.includes('model_weight')),
          promptOptimizations: learningSignal.adaptations.filter((a) => a.includes('prompt')),
          costReductions: costOptimization?.monthlySavings || 0,
          confidenceCalibration: learningSignal.adaptations.filter((a) => a.includes('confidence'))[0]
            ? parseFloat(learningSignal.adaptations.filter((a) => a.includes('confidence'))[0].match(/\d+\.\d+$/)?.[0] || '0')
            : 0,
        },
        nextDecisionImprovements: {
          recommendedModel: nextModelRecommendation.model,
          expectedQualityImprovement: Math.max(
            0,
            nextModelRecommendation.confidence * 0.1 + reexecutionAnalysis.avgQualityImprovement,
          ),
          expectedCostSavings: costOptimization?.monthlySavings || 0,
          criticalityAdjustment: crossInfluences.length > 0 ? crossInfluences[0].recommendedAdjustment.criticality : undefined,
        },
      };

      this.logger.info('Feedback learning complete', {
        adaptations: learningSignal.adaptations.length,
        modelUpdates: result.learning.modelWeightUpdates.length,
        expectedImprovement: result.nextDecisionImprovements.expectedQualityImprovement.toFixed(2),
      });

      return result;
    } catch (error) {
      this.logger.error('Error in feedback learning process', {
        error: error instanceof Error ? error.message : 'unknown',
      });
      throw error;
    }
  }

  /**
   * Preparar contexto para próxima decisão (com learnings aplicados)
   */
  async prepareEnhancedContext(
    analysisType: AnalysisType,
    baseContext: Record<string, any>,
  ): Promise<{
    context: Record<string, any>;
    recommendedModel: string;
    modelConfidence: number;
    shouldReexecuteIfLowQuality: boolean;
    estimatedQuality: number;
    appliedEnhancements: string[];
  }> {
    try {
      const enhancements: string[] = [];

      // ── Aplicar influências cruzadas
      const { adjustedContext, adjustedCriticality, influences } = await this.crossDecisionIntelligence.applyInfluences(
        analysisType,
        baseContext,
      );

      if (influences.length > 0) {
        enhancements.push(`applied ${influences.length} cross-decision influences`);
      }

      // ── Recomendar modelo otimizado
      const { model: recommendedModel, confidence: modelConfidence } = await this.learningEngine.recommendModel(
        analysisType,
        3000, // assumed context size
      );

      enhancements.push(`model recommended: ${recommendedModel} (confidence: ${modelConfidence.toFixed(2)})`);

      // ── Decidir sobre reexecução se qualidade baixa
      const expectedQuality = await this._estimateQuality(analysisType, recommendedModel);
      const shouldReexecuteIfLowQuality = expectedQuality < 0.70;

      if (shouldReexecuteIfLowQuality) {
        enhancements.push(`auto-reexecution enabled if quality < 0.70`);
      }

      // ── Calibrar confidence score
      const { calibratedConfidence } = await this.costOptimizationEngine.calibrateConfidenceScore(
        analysisType,
        modelConfidence,
        adjustedContext._context_size || 1500,
      );

      enhancements.push(`confidence calibrated: ${modelConfidence.toFixed(2)} → ${calibratedConfidence.toFixed(2)}`);

      // ── Aplicar boosts de contexto aprendidos
      const contextWeights = await this.learningEngine.getContextWeights(analysisType);
      const enhancedContext = {
        ...adjustedContext,
        _learning_context: {
          contextWeights,
          appliedInfluences: influences.length,
          recommendedModel,
          estimatedQuality: expectedQuality,
        },
      };

      return {
        context: enhancedContext,
        recommendedModel,
        modelConfidence: calibratedConfidence,
        shouldReexecuteIfLowQuality,
        estimatedQuality: expectedQuality,
        appliedEnhancements: enhancements,
      };
    } catch (error) {
      this.logger.error('Error preparing enhanced context', {
        error: error instanceof Error ? error.message : 'unknown',
      });

      // Fallback
      return {
        context: baseContext,
        recommendedModel: 'gpt-4o',
        modelConfidence: 0.5,
        shouldReexecuteIfLowQuality: true,
        estimatedQuality: 0.65,
        appliedEnhancements: [],
      };
    }
  }

  /**
   * Gerar relatório de auto-evolução
   */
  async generateLearningReport(): Promise<{
    summary: {
      totalDecisions: number;
      averageQuality: number;
      improvementRate: number; // % por semana
      costSavingsRealized: number;
      feedbackResponseRate: number;
    };
    components: {
      learningRate: number;
      modelEfficiency: number;
      decisionSuccessRate: number;
      reexecutionROI: number;
      costOptimizationPotential: number;
    };
    recommendations: string[];
    nextOptimizations: Array<{
      opportunity: string;
      estimatedImpact: string;
      priority: 'critical' | 'high' | 'medium' | 'low';
    }>;
  }> {
    try {
      const client = await this.pgPool.connect();

      try {
        // Métricas gerais
        const generalResult = await client.query(`
          SELECT
            COUNT(*) as total_decisions,
            AVG(quality_score)::float as avg_quality,
            SUM(CASE WHEN user_feedback = 'helpful' THEN 1 ELSE 0 END)::float / COUNT(*) as success_rate
          FROM analysis_success_history
          WHERE timestamp > NOW() - INTERVAL '30 days'
        `);

        const general = generalResult.rows[0] || {};

        // Taxa de melhoria
        const trendResult = await client.query(`
          SELECT
            DATE(timestamp) as date,
            AVG(quality_score)::float as daily_avg
          FROM analysis_success_history
          WHERE timestamp > NOW() - INTERVAL '30 days'
          GROUP BY DATE(timestamp)
          ORDER BY date ASC
        `);

        let improvementRate = 0;
        if (trendResult.rows.length >= 2) {
          const first = trendResult.rows[0].daily_avg;
          const last = trendResult.rows[trendResult.rows.length - 1].daily_avg;
          improvementRate = ((last - first) / first) * 100;
        }

        // Economia
        const annualReport = await this.costOptimizationEngine.generateAnnualSavingsReport(30);

        const reexecutionStats = await this.autoReexecutionStrategy.getReexecutionStatsByType();
        const avgReexecutionROI = reexecutionStats.length > 0
          ? reexecutionStats.reduce((s, r) => s + r.successRate, 0) / reexecutionStats.length
          : 0;

        // Recomendações
        const recommendations: string[] = [];

        if (improvementRate > 5) {
          recommendations.push('✓ Strong improvement trend detected - maintain current strategy');
        } else if (improvementRate < 0) {
          recommendations.push('⚠ Quality declining - review model selection and context strategy');
        }

        const overprovisioned = await this.costOptimizationEngine.detectOverprovisionedModels('observability');
        if (overprovisioned.length > 0) {
          recommendations.push(`⚠ ${overprovisioned.length} overprovisioned model(s) found - consider migration`);
        }

        // Próximas otimizações
        const correlations = await this.crossDecisionIntelligence.discoverCorrelations(10);
        const nextOptimizations = [
          {
            opportunity: 'Cross-decision optimization',
            estimatedImpact: `${(correlations.length * 2).toFixed(0)}% quality improvement`,
            priority: 'high' as const,
          },
          {
            opportunity: 'Prompt version optimization',
            estimatedImpact: '5-10% efficiency gain',
            priority: 'medium' as const,
          },
          {
            opportunity: 'Context size auto-tuning',
            estimatedImpact: '8-12% cost reduction',
            priority: 'high' as const,
          },
        ];

        return {
          summary: {
            totalDecisions: parseInt(general.total_decisions || '0'),
            averageQuality: general.avg_quality || 0,
            improvementRate,
            costSavingsRealized: annualReport.potentialAnnualSavings,
            feedbackResponseRate: general.success_rate || 0,
          },
          components: {
            learningRate: 0.15, // RTK learning rate
            modelEfficiency: avgReexecutionROI,
            decisionSuccessRate: general.success_rate || 0,
            reexecutionROI: avgReexecutionROI,
            costOptimizationPotential: annualReport.savingsPercentage,
          },
          recommendations,
          nextOptimizations,
        };
      } finally {
        client.release();
      }
    } catch (error) {
      this.logger.error('Error generating learning report', {
        error: error instanceof Error ? error.message : 'unknown',
      });

      return {
        summary: {
          totalDecisions: 0,
          averageQuality: 0,
          improvementRate: 0,
          costSavingsRealized: 0,
          feedbackResponseRate: 0,
        },
        components: {
          learningRate: 0,
          modelEfficiency: 0,
          decisionSuccessRate: 0,
          reexecutionROI: 0,
          costOptimizationPotential: 0,
        },
        recommendations: ['Error generating report'],
        nextOptimizations: [],
      };
    }
  }

  /**
   * Expor componentes individuais para acesso direto
   */
  getComponents() {
    return {
      learningEngine: this.learningEngine,
      modelPerformanceStore: this.modelPerformanceStore,
      promptPerformanceTracker: this.promptPerformanceTracker,
      costOptimizationEngine: this.costOptimizationEngine,
      autoReexecutionStrategy: this.autoReexecutionStrategy,
      crossDecisionIntelligence: this.crossDecisionIntelligence,
      historicalSuccessTracker: this.historicalSuccessTracker,
    };
  }

  // ═══════════════════════════════════════════════════════════════════

  private async _estimateQuality(analysisType: AnalysisType, model: string): Promise<number> {
    const stats = await this.modelPerformanceStore.getModelStats(model, analysisType);
    return stats?.avgQuality || 0.65;
  }
}
