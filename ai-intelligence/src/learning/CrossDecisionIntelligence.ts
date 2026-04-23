import { Logger } from 'winston';
import { Pool } from 'pg';
import { Redis } from 'ioredis';
import { AnalysisType } from '../types/analysis.types';

/**
 * Correlação entre tipos de análise
 */
export interface AnalysisCorrelation {
  sourceType: AnalysisType;
  targetType: AnalysisType;
  correlationStrength: number; // 0-1
  direction: 'positive' | 'negative'; // positive = same result, negative = opposite
  lag: number; // horas
  confidence: number;
}

/**
 * Influência contextual entre decisões
 */
export interface ContextualInfluence {
  sourceDecisionId: string;
  sourceType: AnalysisType;
  targetType: AnalysisType;
  influenceScore: number; // 0-1
  recommendedAdjustment: {
    criticality: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
    confidenceAdjustment: number; // delta
    contextBoost: Record<string, number>;
  };
  reasoning: string;
}

/**
 * CrossDecisionIntelligence: Aprende como decisões de um tipo influenciam outro
 *
 * Padrões descobertos:
 * - CI/CD falha → aumenta probabilidade de Incident
 * - High latency (Observability) → aumenta risco (Risk)
 * - Teste instável (Test) → CI/CD falha → Incident
 * - Maintenance pendente → risco de quebra
 *
 * Mecanismo:
 * 1. Registrar decisão + resultado
 * 2. Detectar correlações com decisões futuras
 * 3. Aplicar boost/penalidade automática
 * 4. Calibrar criticidade dinamicamente
 */
export class CrossDecisionIntelligence {
  private readonly pgPool: Pool;
  private readonly redis: Redis;
  private readonly logger: Logger;
  private readonly cacheTTL = 3600; // 1 hora

  // Correlações conhecidas (bootstrap)
  private readonly knownCorrelations: Map<string, AnalysisCorrelation> = new Map([
    // CICD → Incident: build failure often leads to production issue
    ['cicd→incident', {
      sourceType: 'cicd' as AnalysisType,
      targetType: 'incident' as AnalysisType,
      correlationStrength: 0.7,
      direction: 'positive',
      lag: 1, // within 1 hour
      confidence: 0.85,
    }],
    // Observability → Risk: high latency can indicate security issue
    ['observability→risk', {
      sourceType: 'observability' as AnalysisType,
      targetType: 'risk' as AnalysisType,
      correlationStrength: 0.4,
      direction: 'positive',
      lag: 2,
      confidence: 0.6,
    }],
    // Test failures → CICD failure
    ['test-intelligence→cicd', {
      sourceType: 'test-intelligence' as AnalysisType,
      targetType: 'cicd' as AnalysisType,
      correlationStrength: 0.65,
      direction: 'positive',
      lag: 0,
      confidence: 0.8,
    }],
  ]);

  constructor(pgPool: Pool, redis: Redis, logger: Logger) {
    this.pgPool = pgPool;
    this.redis = redis;
    this.logger = logger;
  }

  /**
   * Registrar decisão para análise de correlação
   */
  async recordDecision(
    decisionId: string,
    analysisType: AnalysisType,
    qualityScore: number,
    actionTaken: boolean,
    contextData: Record<string, any>,
  ): Promise<void> {
    try {
      const client = await this.pgPool.connect();

      try {
        await client.query(
          `INSERT INTO cross_decision_log
          (decision_id, analysis_type, quality_score, action_taken, context_data, timestamp)
          VALUES ($1, $2, $3, $4, $5, NOW())`,
          [decisionId, analysisType, qualityScore, actionTaken, JSON.stringify(contextData)],
        );
      } finally {
        client.release();
      }
    } catch (error) {
      this.logger.warn('Failed to record decision for correlation', {
        error: error instanceof Error ? error.message : 'unknown',
      });
    }
  }

  /**
   * Detectar influência de decisão anterior
   */
  async detectInfluence(
    targetType: AnalysisType,
    contextData: Record<string, any>,
    timeWindowHours: number = 24,
  ): Promise<ContextualInfluence[]> {
    const client = await this.pgPool.connect();

    try {
      // Buscar decisões relevantes no período
      const result = await client.query(
        `SELECT
          decision_id,
          analysis_type,
          quality_score,
          action_taken,
          context_data,
          timestamp
        FROM cross_decision_log
        WHERE timestamp > NOW() - INTERVAL '${timeWindowHours} hours'
        ORDER BY timestamp DESC
        LIMIT 20`,
      );

      if (result.rows.length === 0) {
        return [];
      }

      const influences: ContextualInfluence[] = [];

      for (const row of result.rows) {
        const sourceType = row.analysis_type as AnalysisType;
        const correlation = this.knownCorrelations.get(`${sourceType}→${targetType}`);

        if (!correlation) {
          continue;
        }

        // Verificar se correlação é relevante
        if (row.action_taken && row.quality_score > 0.6) {
          // Decisão boa foi tomada → aumenta risco no target
          const influence: ContextualInfluence = {
            sourceDecisionId: row.decision_id,
            sourceType,
            targetType,
            influenceScore: correlation.correlationStrength,
            recommendedAdjustment: {
              criticality: this._elevateCriticality(correlation),
              confidenceAdjustment: correlation.correlationStrength * 0.2,
              contextBoost: this._generateContextBoost(sourceType, contextData),
            },
            reasoning: `${sourceType} decision quality=${row.quality_score.toFixed(2)}, action_taken=${row.action_taken} → ${correlation.correlationStrength * 100}% influence on ${targetType}`,
          };

          influences.push(influence);
        }
      }

      return influences;
    } finally {
      client.release();
    }
  }

  /**
   * Aplicar influências para ajustar análise atual
   */
  async applyInfluences(targetType: AnalysisType, baseContext: Record<string, any>): Promise<{
    adjustedContext: Record<string, any>;
    adjustedCriticality: string;
    confidenceAdjustment: number;
    influences: string[];
  }> {
    const influences = await this.detectInfluence(targetType, baseContext);

    if (influences.length === 0) {
      return {
        adjustedContext: baseContext,
        adjustedCriticality: 'NORMAL',
        confidenceAdjustment: 0,
        influences: [],
      };
    }

    // Agregar influências
    const totalInfluenceScore = influences.reduce((s, i) => s + i.influenceScore, 0) / influences.length;
    const maxCriticality = influences.map((i) => i.recommendedAdjustment.criticality).sort((a, b) => {
      const order = { LOW: 0, NORMAL: 1, HIGH: 2, CRITICAL: 3 };
      return order[b as keyof typeof order] - order[a as keyof typeof order];
    })[0];

    // Mesclar context boosts
    const mergedBoosts = {};
    for (const influence of influences) {
      for (const [key, value] of Object.entries(influence.recommendedAdjustment.contextBoost)) {
        mergedBoosts[key] = Math.max(mergedBoosts[key] || 0, value);
      }
    }

    const adjustedContext = {
      ...baseContext,
      _cross_decision_influences: {
        source_decisions: influences.map((i) => i.sourceDecisionId),
        total_influence_score: totalInfluenceScore,
        applied_boosts: mergedBoosts,
      },
    };

    const influenceReasons = influences.map((i) => i.reasoning);

    return {
      adjustedContext,
      adjustedCriticality: maxCriticality || 'NORMAL',
      confidenceAdjustment: totalInfluenceScore * 0.15,
      influences: influenceReasons,
    };
  }

  /**
   * Descobrir novas correlações através de análise histórica
   */
  async discoverCorrelations(minSupportCount: number = 20): Promise<
    Array<{
      sourceType: AnalysisType;
      targetType: AnalysisType;
      correlation: number;
      support: number; // quantas vezes observado
      confidence: number;
      lag: number;
      recommendation: string;
    }>
  > {
    const client = await this.pgPool.connect();

    try {
      // Análise complexa: encontrar decisões similares que tendem a ocorrer juntas
      const result = await client.query(`
        WITH decision_pairs AS (
          SELECT
            a.analysis_type as source_type,
            b.analysis_type as target_type,
            COUNT(*) as co_occurrence,
            AVG(ABS(EXTRACT(EPOCH FROM (b.timestamp - a.timestamp)) / 3600)) as avg_lag_hours,
            CORR(a.quality_score, b.quality_score)::float as quality_correlation
          FROM cross_decision_log a
          JOIN cross_decision_log b ON
            ABS(EXTRACT(EPOCH FROM (b.timestamp - a.timestamp))) < 86400  -- within 24h
            AND a.analysis_type != b.analysis_type
          WHERE a.timestamp > NOW() - INTERVAL '90 days'
          GROUP BY a.analysis_type, b.analysis_type
          HAVING COUNT(*) >= $1
        )
        SELECT
          source_type,
          target_type,
          co_occurrence,
          avg_lag_hours,
          quality_correlation,
          CASE
            WHEN quality_correlation > 0.3 THEN 'positive'
            WHEN quality_correlation < -0.3 THEN 'negative'
            ELSE 'weak'
          END as correlation_type
        FROM decision_pairs
        ORDER BY ABS(quality_correlation) DESC
      `, [minSupportCount]);

      return result.rows
        .filter((row) => row.correlation_type !== 'weak')
        .map((row) => ({
          sourceType: row.source_type as AnalysisType,
          targetType: row.target_type as AnalysisType,
          correlation: row.quality_correlation,
          support: parseInt(row.co_occurrence),
          confidence: Math.min(1, row.co_occurrence / (minSupportCount * 2)),
          lag: Math.round(row.avg_lag_hours),
          recommendation:
            Math.abs(row.quality_correlation) > 0.5
              ? 'STRONG: consider adding to known correlations'
              : 'MODERATE: monitor for confirmation',
        }));
    } finally {
      client.release();
    }
  }

  /**
   * Gerar matriz de influências
   */
  async getInfluenceMatrix(): Promise<
    Array<{
      source: AnalysisType;
      target: AnalysisType;
      strength: number;
      direction: string;
    }>
  > {
    const influences = Array.from(this.knownCorrelations.values());

    return influences.map((corr) => ({
      source: corr.sourceType,
      target: corr.targetType,
      strength: corr.correlationStrength,
      direction: corr.direction,
    }));
  }

  /**
   * Exemplo de uso em chain: CICD → Incident → Risk
   */
  async analyzeDecisionChain(initialDecisionId: string): Promise<{
    chain: Array<{
      step: number;
      type: AnalysisType;
      influence: number;
    }>;
    totalPropagation: number;
  }> {
    const client = await this.pgPool.connect();

    try {
      const result = await client.query(
        `SELECT analysis_type, quality_score FROM cross_decision_log WHERE decision_id = $1`,
        [initialDecisionId],
      );

      if (result.rows.length === 0) {
        return { chain: [], totalPropagation: 0 };
      }

      const initial = result.rows[0];
      const chain = [
        {
          step: 0,
          type: initial.analysis_type as AnalysisType,
          influence: 1.0,
        },
      ];

      let totalPropagation = 1.0;
      let currentType = initial.analysis_type as AnalysisType;

      // Seguir cadeia por até 3 hops
      for (let i = 1; i < 3; i++) {
        const correlation = this.knownCorrelations.get(`${currentType}→*`);
        if (!correlation) {
          break;
        }

        const nextInfluence = chain[i - 1].influence * correlation.correlationStrength;

        chain.push({
          step: i,
          type: correlation.targetType,
          influence: nextInfluence,
        });

        totalPropagation += nextInfluence;
        currentType = correlation.targetType;
      }

      return { chain, totalPropagation };
    } finally {
      client.release();
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // Private methods
  // ═══════════════════════════════════════════════════════════════════

  private _elevateCriticality(correlation: AnalysisCorrelation): 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL' {
    if (correlation.correlationStrength > 0.7) {
      return 'HIGH';
    } else if (correlation.correlationStrength > 0.5) {
      return 'NORMAL';
    }
    return 'LOW';
  }

  private _generateContextBoost(
    sourceType: AnalysisType,
    baseContext: Record<string, any>,
  ): Record<string, number> {
    const boosts: Record<string, number> = {};

    // Diferentes tipos geram diferentes boosts
    switch (sourceType) {
      case 'cicd':
        boosts['error_logs'] = 0.15;
        boosts['infrastructure_events'] = 0.1;
        break;

      case 'observability':
        boosts['metrics'] = 0.12;
        boosts['anomalies'] = 0.15;
        break;

      case 'test-intelligence':
        boosts['failure_patterns'] = 0.15;
        boosts['coverage_gaps'] = 0.08;
        break;

      case 'incident':
        boosts['timeline'] = 0.15;
        boosts['error_context'] = 0.12;
        break;
    }

    return boosts;
  }
}
