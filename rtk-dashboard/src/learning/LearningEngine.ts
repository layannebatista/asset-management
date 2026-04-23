import { Logger } from 'winston';
import { Pool } from 'pg';
import { Redis } from 'ioredis';
import { FeedbackSignal } from '../types/DecisionOutput';
import { AnalysisType } from '../types/analysis.types';
import { HistoricalSuccessTracker, SuccessMetric } from './HistoricalSuccessTracker';

/**
 * Configuração de aprendizado adaptativo para um tipo de análise
 */
export interface LearningConfig {
  type: AnalysisType;
  modelWeights: Record<string, number>; // {model_id: weight}
  contextBoosts: Record<string, number>; // {chunkType: boost}
  promptVersions: Record<string, number>; // {prompt_id: score}
  reexecutionThreshold: number; // quality_score < threshold → reexecute
  costOptimizationEnabled: boolean;
  learningRate: number; // 0-1: how aggressively to adapt
  confidenceCalibration: number; // correction factor
  lastUpdated: Date;
}

/**
 * Sinal de aprendizado após feedback
 */
export interface LearningSignal {
  decisionId: string;
  feedback: FeedbackSignal;
  actualOutcome: {
    resolved: boolean;
    timeToResolution: number;
    businessImpact: number;
  };
  metrics: {
    previousQuality: number;
    actualQuality: number; // ajustado pós-feedback
    improvement: number; // delta
    confidenceError: number; // predicted vs actual
  };
  adaptations: string[]; // quais pesos foram alterados
}

/**
 * LearningEngine: Núcleo de aprendizado contínuo do Decision Engine
 *
 * Responsabilidades:
 * 1. Processar feedback (positive/negative/partial)
 * 2. Atualizar pesos com RTK (Reward Temporal Kernel)
 * 3. Adaptar escolha de modelo
 * 4. Refinar estratégias de prompt
 * 5. Calibrar confidence scores
 *
 * Algoritmo RTK:
 * ─────────────
 * weight_new = weight_old + learning_rate * boost_factor * feedback_signal
 * boost_factor = effectiveness_multiplier * confidence_adjustment
 *
 * Feedback signals:
 * - positive (+0.2 a +0.5): aumenta peso
 * - negative (-0.3 a -0.5): diminui peso
 * - partial (-0.1 a +0.1): ajuste fino
 */
export class LearningEngine {
  private readonly pgPool: Pool;
  private readonly redis: Redis;
  private readonly logger: Logger;
  private readonly tracker: HistoricalSuccessTracker;

  // RTK hyperparameters
  private readonly RTK_BASE_LEARNING_RATE = 0.15; // 15% ajuste por padrão
  private readonly RTK_MAX_BOOST = 0.5; // 50% boost máximo
  private readonly RTK_MIN_BOOST = -0.3; // -30% redução máxima
  private readonly CONFIDENCE_CORRECTION_FACTOR = 0.1; // 10% ajuste por erro
  private readonly MIN_SAMPLES_FOR_TRUST = 5; // Mín samples para confiar em padrão

  // Cache de configurações
  private learningConfigs: Map<AnalysisType, LearningConfig> = new Map();
  private readonly configCacheTTL = 3600; // 1 hora

  constructor(pgPool: Pool, redis: Redis, logger: Logger, tracker: HistoricalSuccessTracker) {
    this.pgPool = pgPool;
    this.redis = redis;
    this.logger = logger;
    this.tracker = tracker;
  }

  /**
   * Processar feedback e atualizar configurações de aprendizado
   */
  async processFeedback(signal: FeedbackSignal, previousQuality: number): Promise<LearningSignal> {
    try {
      // ── Step 1: Carregar configuração atual
      const config = await this.loadLearningConfig(signal.feedback_type === 'positive' ? 'observability' : 'incident');

      // ── Step 2: Calcular sinais de feedback
      const feedbackStrength = this._calculateFeedbackStrength(signal, previousQuality);
      const confidenceError = this._calculateConfidenceError(
        previousQuality,
        signal.actual_outcome?.business_impact_score || 0,
      );

      // ── Step 3: Aplicar RTK para atualizar pesos
      const adaptations: string[] = [];

      // Adaptar model weights
      const modelAdaptations = await this._adaptModelWeights(config, feedbackStrength);
      adaptations.push(...modelAdaptations);

      // Adaptar context boosts
      const contextAdaptations = await this._adaptContextBoosts(config, feedbackStrength);
      adaptations.push(...contextAdaptations);

      // Calibrar confidence
      const calibrationAdapt = await this._calibrateConfidence(config, confidenceError);
      adaptations.push(calibrationAdapt);

      // ── Step 4: Persistir atualizações
      await this._persistLearningConfig(config);
      await this.redis.setex(
        `learning:${config.type}`,
        this.configCacheTTL,
        JSON.stringify(config),
      );

      // ── Step 5: Registrar sucesso histórico
      const successMetric: SuccessMetric = {
        analysisId: signal.decision_id,
        analysisType: config.type,
        query: `feedback:${signal.feedback_type}`,
        qualityScore: Math.max(0, previousQuality + feedbackStrength),
        actionabilityScore: 0,
        consistencyScore: 0,
        overallScore: Math.max(0, previousQuality + feedbackStrength),
        tokensSaved: 0,
        resolutionTime: signal.actual_outcome?.time_to_resolution_minutes || 0,
        userFeedback: signal.feedback_type as 'helpful' | 'neutral' | 'unhelpful',
        timestamp: signal.timestamp,
      };

      await this.tracker.recordSuccess(successMetric);

      const learningSignal: LearningSignal = {
        decisionId: signal.decision_id,
        feedback: signal,
        actualOutcome: signal.actual_outcome
          ? {
              resolved: signal.actual_outcome.resolved,
              timeToResolution: signal.actual_outcome.time_to_resolution_minutes,
              businessImpact: signal.actual_outcome.business_impact_score,
            }
          : { resolved: false, timeToResolution: 0, businessImpact: 0 },
        metrics: {
          previousQuality,
          actualQuality: Math.max(0, previousQuality + feedbackStrength),
          improvement: feedbackStrength,
          confidenceError,
        },
        adaptations,
      };

      this.logger.info('Learning engine processed feedback', {
        decisionId: signal.decision_id,
        feedbackType: signal.feedback_type,
        improvement: feedbackStrength.toFixed(3),
        adaptationsCount: adaptations.length,
      });

      return learningSignal;
    } catch (error) {
      this.logger.error('Error processing feedback', {
        error: error instanceof Error ? error.message : 'unknown',
      });
      throw error;
    }
  }

  /**
   * Carregar configuração de aprendizado para um tipo
   */
  async loadLearningConfig(analysisType: AnalysisType): Promise<LearningConfig> {
    // Tentar cache primeiro
    const cached = this.learningConfigs.get(analysisType);
    if (cached) {
      return cached;
    }

    // Tentar Redis
    const redisKey = `learning:${analysisType}`;
    const redisConfig = await this.redis.get(redisKey);
    if (redisConfig) {
      const config = JSON.parse(redisConfig) as LearningConfig;
      this.learningConfigs.set(analysisType, config);
      return config;
    }

    // Carregar do DB ou usar defaults
    const config = await this._loadOrCreateConfig(analysisType);
    this.learningConfigs.set(analysisType, config);
    await this.redis.setex(redisKey, this.configCacheTTL, JSON.stringify(config));

    return config;
  }

  /**
   * Obter recomendação de modelo baseado em aprendizado
   */
  async recommendModel(
    analysisType: AnalysisType,
    contextSize: number,
  ): Promise<{ model: string; confidence: number; reason: string }> {
    const config = await this.loadLearningConfig(analysisType);

    // Ordenar modelos por peso aprendido
    const rankedModels = Object.entries(config.modelWeights)
      .sort(([, a], [, b]) => b - a)
      .map(([model]) => model);

    if (rankedModels.length === 0) {
      return { model: 'gpt-4o', confidence: 0.5, reason: 'no learned weights' };
    }

    const topModel = rankedModels[0];
    const topWeight = config.modelWeights[topModel];

    return {
      model: topModel,
      confidence: Math.min(1.0, topWeight),
      reason: `learned from ${Object.keys(config.modelWeights).length} feedback signals`,
    };
  }

  /**
   * Obter recomendação de reexecução baseada em aprendizado
   */
  async shouldReexecute(
    analysisType: AnalysisType,
    qualityScore: number,
    criticality: string,
    estimatedCost: number,
  ): Promise<{ shouldReexecute: boolean; reason: string; expectedImprovement: number }> {
    const config = await this.loadLearningConfig(analysisType);

    // Crítica: sempre reexecuta se abaixo do threshold
    if (criticality === 'CRITICAL' && qualityScore < 0.8) {
      return {
        shouldReexecute: true,
        reason: 'critical analysis below quality threshold',
        expectedImprovement: 0.15,
      };
    }

    // Normal: reexecuta se abaixo do threshold e custo razoável
    if (qualityScore < config.reexecutionThreshold && estimatedCost < 0.05) {
      return {
        shouldReexecute: true,
        reason: `quality (${qualityScore.toFixed(2)}) below threshold (${config.reexecutionThreshold.toFixed(2)})`,
        expectedImprovement: 0.1,
      };
    }

    return {
      shouldReexecute: false,
      reason: 'quality acceptable and cost constraint satisfied',
      expectedImprovement: 0,
    };
  }

  /**
   * Obter pesos de contexto aprendidos
   */
  async getContextWeights(analysisType: AnalysisType): Promise<Record<string, number>> {
    const config = await this.loadLearningConfig(analysisType);
    return { ...config.contextBoosts };
  }

  // ═══════════════════════════════════════════════════════════════════
  // Private methods - RTK adaptation
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Calcular força do sinal de feedback (-0.5 a +0.5)
   */
  private _calculateFeedbackStrength(signal: FeedbackSignal, baseScore: number): number {
    let strength = 0;

    switch (signal.feedback_type) {
      case 'positive':
        // Boost proporcional ao impacto
        const impact = (signal.actual_outcome?.business_impact_score || 5) / 10;
        strength = 0.15 + impact * 0.3; // +0.15 a +0.45
        break;

      case 'negative':
        // Penalidade
        strength = -0.25 - (baseScore > 0.7 ? 0.1 : 0); // -0.25 a -0.35
        break;

      case 'partial':
        // Ajuste fino
        const partial = (signal.actual_outcome?.business_impact_score || 5) / 10;
        strength = -0.05 + partial * 0.1; // -0.05 a +0.05
        break;
    }

    // Aplicar clamping
    return Math.max(this.RTK_MIN_BOOST, Math.min(this.RTK_MAX_BOOST, strength));
  }

  /**
   * Calcular erro de confiança (predicted vs actual)
   */
  private _calculateConfidenceError(predictedScore: number, actualScore: number): number {
    return Math.abs(predictedScore - (actualScore / 10)); // Normalizar actual para 0-1
  }

  /**
   * Adaptar pesos de modelo usando RTK
   */
  private async _adaptModelWeights(config: LearningConfig, feedbackStrength: number): Promise<string[]> {
    const adaptations: string[] = [];

    for (const [model, weight] of Object.entries(config.modelWeights)) {
      const boostFactor = feedbackStrength * config.learningRate;
      const newWeight = Math.max(0, Math.min(1, weight + boostFactor));

      if (Math.abs(newWeight - weight) > 0.01) {
        config.modelWeights[model] = newWeight;
        adaptations.push(`model_weight[${model}]: ${weight.toFixed(3)} → ${newWeight.toFixed(3)}`);
      }
    }

    // Normalizar pesos para somarem 1.0
    const totalWeight = Object.values(config.modelWeights).reduce((a, b) => a + b, 0);
    for (const model of Object.keys(config.modelWeights)) {
      config.modelWeights[model] = config.modelWeights[model] / totalWeight;
    }

    return adaptations;
  }

  /**
   * Adaptar context boosts
   */
  private async _adaptContextBoosts(config: LearningConfig, feedbackStrength: number): Promise<string[]> {
    const adaptations: string[] = [];

    for (const [chunkType, boost] of Object.entries(config.contextBoosts)) {
      const newBoost = Math.max(0, Math.min(0.3, boost + feedbackStrength * config.learningRate * 0.5));

      if (Math.abs(newBoost - boost) > 0.01) {
        config.contextBoosts[chunkType] = newBoost;
        adaptations.push(`context_boost[${chunkType}]: ${boost.toFixed(3)} → ${newBoost.toFixed(3)}`);
      }
    }

    return adaptations;
  }

  /**
   * Calibrar confidence score com histórico
   */
  private async _calibrateConfidence(config: LearningConfig, confidenceError: number): Promise<string> {
    const adjustment = confidenceError * this.CONFIDENCE_CORRECTION_FACTOR;
    const newCalibration = Math.max(0.5, Math.min(1.2, config.confidenceCalibration + adjustment));

    if (Math.abs(newCalibration - config.confidenceCalibration) > 0.01) {
      const old = config.confidenceCalibration;
      config.confidenceCalibration = newCalibration;
      return `confidence_calibration: ${old.toFixed(3)} → ${newCalibration.toFixed(3)}`;
    }

    return 'confidence_calibration: no change';
  }

  /**
   * Carregar ou criar configuração padrão
   */
  private async _loadOrCreateConfig(analysisType: AnalysisType): Promise<LearningConfig> {
    const client = await this.pgPool.connect();

    try {
      const result = await client.query(
        'SELECT * FROM learning_configs WHERE analysis_type = $1',
        [analysisType],
      );

      if (result.rows.length > 0) {
        const row = result.rows[0];
        return {
          type: analysisType,
          modelWeights: row.model_weights,
          contextBoosts: row.context_boosts,
          promptVersions: row.prompt_versions,
          reexecutionThreshold: row.reexecution_threshold,
          costOptimizationEnabled: row.cost_optimization_enabled,
          learningRate: row.learning_rate,
          confidenceCalibration: row.confidence_calibration,
          lastUpdated: new Date(row.last_updated),
        };
      }

      // Criar com defaults
      const defaults = this._getDefaultConfig(analysisType);
      await client.query(
        `INSERT INTO learning_configs
        (analysis_type, model_weights, context_boosts, prompt_versions, reexecution_threshold,
         cost_optimization_enabled, learning_rate, confidence_calibration, last_updated)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
        [
          analysisType,
          JSON.stringify(defaults.modelWeights),
          JSON.stringify(defaults.contextBoosts),
          JSON.stringify(defaults.promptVersions),
          defaults.reexecutionThreshold,
          defaults.costOptimizationEnabled,
          defaults.learningRate,
          defaults.confidenceCalibration,
        ],
      );

      return defaults;
    } finally {
      client.release();
    }
  }

  /**
   * Persistir configuração no DB
   */
  private async _persistLearningConfig(config: LearningConfig): Promise<void> {
    const client = await this.pgPool.connect();

    try {
      await client.query(
        `UPDATE learning_configs
        SET model_weights = $1,
            context_boosts = $2,
            prompt_versions = $3,
            reexecution_threshold = $4,
            learning_rate = $5,
            confidence_calibration = $6,
            last_updated = NOW()
        WHERE analysis_type = $7`,
        [
          JSON.stringify(config.modelWeights),
          JSON.stringify(config.contextBoosts),
          JSON.stringify(config.promptVersions),
          config.reexecutionThreshold,
          config.learningRate,
          config.confidenceCalibration,
          config.type,
        ],
      );
    } finally {
      client.release();
    }
  }

  /**
   * Configuração padrão por tipo
   */
  private _getDefaultConfig(type: AnalysisType): LearningConfig {
    return {
      type,
      modelWeights: {
        'gpt-4o': 0.5,
        'gpt-4-turbo': 0.3,
        'gpt-4o-mini': 0.2,
      },
      contextBoosts: {
        metrics: 0.1,
        logs: 0.05,
        traces: 0.08,
        events: 0.03,
      },
      promptVersions: {
        'v1.0': 0.7,
        'v1.1': 0.3,
      },
      reexecutionThreshold: 0.65,
      costOptimizationEnabled: true,
      learningRate: this.RTK_BASE_LEARNING_RATE,
      confidenceCalibration: 1.0,
      lastUpdated: new Date(),
    };
  }
}
