import { Logger } from 'winston';
import { Pool } from 'pg';
import { Redis } from 'ioredis';
import { AnalysisType } from '../types/analysis.types';

/**
 * Indicador de drift
 */
export interface DriftIndicator {
  metric: 'quality' | 'latency' | 'cost' | 'reexecution' | 'error_rate' | 'feedback_negative';
  value: number;
  baseline: number;
  change: number; // percentual
  severity: 'normal' | 'warning' | 'critical';
  trend: 'improving' | 'stable' | 'degrading';
}

/**
 * Detecção de drift completa
 */
export interface DriftDetectionResult {
  isDrifting: boolean;
  driftScore: number; // 0-1
  indicators: DriftIndicator[];
  affectedTypes: AnalysisType[];
  rootCauses: string[];
  recommendedActions: string[];
  requiresIntervention: boolean;
  interventionLevel?: 'logging' | 'alert' | 'investigate' | 'emergency';
}

/**
 * DriftDetector: Detecta quando o sistema está degradando
 *
 * Sinais de degradação:
 * - Quality score caindo (trend)
 * - Latência aumentando
 * - Custo divergindo
 * - Taxa de reexecução subindo
 * - Feedback negativo aumentando
 * - Taxa de erro crescendo
 *
 * Algoritmo:
 * 1. Compara últimas 7 dias vs 7 dias antes
 * 2. Detecta trend (improving/stable/degrading)
 * 3. Se 2+ métricas em degradação = drift
 * 4. Se qualidade caindo + reexecução subindo = crítico
 *
 * Causa raiz:
 * - Model degradation (histórico ruim)
 * - Prompt versioning issue
 * - Context quality issue
 * - External API issue
 */
export class DriftDetector {
  private readonly pgPool: Pool;
  private readonly redis: Redis;
  private readonly logger: Logger;

  // Thresholds para alertas
  private readonly thresholds = {
    qualityDrop: -0.08, // -8% é warning
    latencyIncrease: 0.15, // +15% é warning
    costIncrease: 0.2, // +20% é warning
    reexecutionRise: 0.05, // +5 pontos é warning
    negativeRateRise: 0.1, // +10% é warning
    errorRateIncrease: 0.03, // +3% é warning
  };

  constructor(pgPool: Pool, redis: Redis, logger: Logger) {
    this.pgPool = pgPool;
    this.redis = redis;
    this.logger = logger;
  }

  /**
   * Detectar drift no sistema
   */
  async detectDrift(analysisTypes?: AnalysisType[]): Promise<DriftDetectionResult> {
    try {
      const indicators: DriftIndicator[] = [];

      // ── Step 1: Analizar qualidade
      const qualityIndicator = await this._analyzeQualityTrend(analysisTypes);
      if (qualityIndicator) indicators.push(qualityIndicator);

      // ── Step 2: Analisar latência
      const latencyIndicator = await this._analyzeLatencyTrend(analysisTypes);
      if (latencyIndicator) indicators.push(latencyIndicator);

      // ── Step 3: Analisar custo
      const costIndicator = await this._analyzeCostTrend(analysisTypes);
      if (costIndicator) indicators.push(costIndicator);

      // ── Step 4: Analisar taxa de reexecução
      const reexecutionIndicator = await this._analyzeReexecutionTrend(analysisTypes);
      if (reexecutionIndicator) indicators.push(reexecutionIndicator);

      // ── Step 5: Analisar feedback negativo
      const feedbackIndicator = await this._analyzeFeedbackTrend(analysisTypes);
      if (feedbackIndicator) indicators.push(feedbackIndicator);

      // ── Step 6: Detectar drift
      const isDrifting = indicators.filter((i) => i.severity !== 'normal').length >= 2;
      const driftScore = this._calculateDriftScore(indicators);

      // ── Step 7: Identificar tipos afetados
      const affectedTypes = await this._identifyAffectedTypes(indicators);

      // ── Step 8: Identificar causa raiz
      const rootCauses = this._identifyRootCauses(indicators);

      // ── Step 9: Recomendar ações
      const recommendedActions = this._generateRecommendations(indicators, rootCauses);

      // ── Step 10: Determinar nível de intervenção
      const { requiresIntervention, interventionLevel } = this._assessInterventionLevel(driftScore, indicators);

      const result: DriftDetectionResult = {
        isDrifting,
        driftScore,
        indicators,
        affectedTypes,
        rootCauses,
        recommendedActions,
        requiresIntervention,
        interventionLevel,
      };

      this.logger.info('Drift detection complete', {
        isDrifting,
        driftScore: driftScore.toFixed(2),
        indicatorCount: indicators.length,
        requiresIntervention,
        interventionLevel,
      });

      // ── Step 11: Registrar detecção
      await this._recordDriftDetection(result);

      return result;
    } catch (error) {
      this.logger.error('Error detecting drift', {
        error: error instanceof Error ? error.message : 'unknown',
      });

      return {
        isDrifting: false,
        driftScore: 0,
        indicators: [],
        affectedTypes: [],
        rootCauses: [],
        recommendedActions: [],
        requiresIntervention: false,
      };
    }
  }

  /**
   * Obter histórico de drift
   */
  async getDriftHistory(days: number = 30): Promise<
    Array<{
      date: Date;
      driftScore: number;
      isDrifting: boolean;
      indicatorCount: number;
    }>
  > {
    const client = await this.pgPool.connect();

    try {
      const result = await client.query(
        `SELECT
          DATE(timestamp) as date,
          AVG(drift_score)::float as avg_drift,
          MAX(is_drifting::int)::boolean as is_drifting,
          AVG(ARRAY_LENGTH(indicators, 1))::float as avg_indicators
        FROM drift_detections
        WHERE timestamp > NOW() - INTERVAL '${days} days'
        GROUP BY DATE(timestamp)
        ORDER BY date ASC`,
      );

      return result.rows.map((row) => ({
        date: new Date(row.date),
        driftScore: row.avg_drift || 0,
        isDrifting: row.is_drifting || false,
        indicatorCount: Math.round(row.avg_indicators || 0),
      }));
    } finally {
      client.release();
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // Private analysis methods
  // ═══════════════════════════════════════════════════════════════════

  private async _analyzeQualityTrend(analysisTypes?: AnalysisType[]): Promise<DriftIndicator | null> {
    const client = await this.pgPool.connect();

    try {
      const typeFilter = analysisTypes ? `AND analysis_type = ANY($2)` : '';
      const params = analysisTypes ? [analysisTypes] : [];

      const result = await client.query(
        `WITH weeks AS (
          SELECT
            (CASE WHEN timestamp > NOW() - INTERVAL '7 days' THEN 'current' ELSE 'previous' END) as week,
            AVG(overall_score)::float as avg_quality
          FROM analysis_success_history
          WHERE timestamp > NOW() - INTERVAL '14 days'
          ${typeFilter}
          GROUP BY week
        )
        SELECT
          MAX(CASE WHEN week = 'current' THEN avg_quality END) as current_quality,
          MAX(CASE WHEN week = 'previous' THEN avg_quality END) as previous_quality
        FROM weeks`,
        params,
      );

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      const current = row.current_quality || 0.7;
      const previous = row.previous_quality || 0.7;
      const change = (current - previous) / previous;

      const trend = change > 0.02 ? 'improving' : change < -0.02 ? 'degrading' : 'stable';
      const severity = Math.abs(change) < 0.05 ? 'normal' : Math.abs(change) < 0.12 ? 'warning' : 'critical';

      return {
        metric: 'quality',
        value: current,
        baseline: previous,
        change,
        severity: severity as any,
        trend: trend as any,
      };
    } finally {
      client.release();
    }
  }

  private async _analyzeLatencyTrend(analysisTypes?: AnalysisType[]): Promise<DriftIndicator | null> {
    // Similar a quality, mas para latência
    return null; // Placeholder
  }

  private async _analyzeCostTrend(analysisTypes?: AnalysisType[]): Promise<DriftIndicator | null> {
    // Analisar custo por decisão
    return null; // Placeholder
  }

  private async _analyzeReexecutionTrend(analysisTypes?: AnalysisType[]): Promise<DriftIndicator | null> {
    const client = await this.pgPool.connect();

    try {
      const result = await client.query(
        `WITH weeks AS (
          SELECT
            (CASE WHEN timestamp > NOW() - INTERVAL '7 days' THEN 'current' ELSE 'previous' END) as week,
            SUM(CASE WHEN should_reexecute THEN 1 ELSE 0 END)::float / COUNT(*) as reexec_rate
          FROM decision_validations
          WHERE timestamp > NOW() - INTERVAL '14 days'
          GROUP BY week
        )
        SELECT
          MAX(CASE WHEN week = 'current' THEN reexec_rate END) as current_rate,
          MAX(CASE WHEN week = 'previous' THEN reexec_rate END) as previous_rate
        FROM weeks`,
      );

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      const current = row.current_rate || 0.1;
      const previous = row.previous_rate || 0.1;
      const change = current - previous;

      const trend = change < -0.02 ? 'improving' : change > 0.02 ? 'degrading' : 'stable';
      const severity = Math.abs(change) < 0.05 ? 'normal' : Math.abs(change) < 0.15 ? 'warning' : 'critical';

      return {
        metric: 'reexecution',
        value: current,
        baseline: previous,
        change,
        severity: severity as any,
        trend: trend as any,
      };
    } finally {
      client.release();
    }
  }

  private async _analyzeFeedbackTrend(analysisTypes?: AnalysisType[]): Promise<DriftIndicator | null> {
    const client = await this.pgPool.connect();

    try {
      const result = await client.query(
        `WITH weeks AS (
          SELECT
            (CASE WHEN timestamp > NOW() - INTERVAL '7 days' THEN 'current' ELSE 'previous' END) as week,
            SUM(CASE WHEN user_feedback = 'unhelpful' THEN 1 ELSE 0 END)::float /
            NULLIF(COUNT(*), 0) as negative_rate
          FROM analysis_success_history
          WHERE timestamp > NOW() - INTERVAL '14 days'
          GROUP BY week
        )
        SELECT
          MAX(CASE WHEN week = 'current' THEN negative_rate END) as current_negative,
          MAX(CASE WHEN week = 'previous' THEN negative_rate END) as previous_negative
        FROM weeks`,
      );

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      const current = row.current_negative || 0.1;
      const previous = row.previous_negative || 0.1;
      const change = current - previous;

      const trend = change < 0 ? 'improving' : change > 0 ? 'degrading' : 'stable';
      const severity = Math.abs(change) < 0.05 ? 'normal' : Math.abs(change) < 0.15 ? 'warning' : 'critical';

      return {
        metric: 'feedback_negative',
        value: current,
        baseline: previous,
        change,
        severity: severity as any,
        trend: trend as any,
      };
    } finally {
      client.release();
    }
  }

  private _calculateDriftScore(indicators: DriftIndicator[]): number {
    if (indicators.length === 0) return 0;

    const severityWeights = { normal: 0, warning: 0.25, critical: 0.75 };
    const totalWeight = indicators.reduce((sum, i) => sum + severityWeights[i.severity], 0);

    return Math.min(1, totalWeight / indicators.length);
  }

  private async _identifyAffectedTypes(indicators: DriftIndicator[]): Promise<AnalysisType[]> {
    // Query para encontrar quais tipos estão com problemas
    return [];
  }

  private _identifyRootCauses(indicators: DriftIndicator[]): string[] {
    const causes: string[] = [];

    const qualityInd = indicators.find((i) => i.metric === 'quality');
    const reexecInd = indicators.find((i) => i.metric === 'reexecution');
    const feedbackInd = indicators.find((i) => i.metric === 'feedback_negative');

    if (qualityInd && qualityInd.trend === 'degrading') {
      causes.push('Quality degradation detected - likely model or prompt issue');
    }

    if (reexecInd && reexecInd.value > 0.3) {
      causes.push('High reexecution rate - validation thresholds may be too strict');
    }

    if (feedbackInd && feedbackInd.value > 0.2) {
      causes.push('Increasing negative feedback - user satisfaction declining');
    }

    if (qualityInd && reexecInd && qualityInd.trend === 'degrading' && reexecInd.trend === 'degrading') {
      causes.push('CRITICAL: Both quality and reexecution trending poorly - system under stress');
    }

    return causes;
  }

  private _generateRecommendations(indicators: DriftIndicator[], rootCauses: string[]): string[] {
    const actions: string[] = [];

    if (rootCauses.length === 0) {
      return actions;
    }

    if (rootCauses.some((c) => c.includes('model or prompt'))) {
      actions.push('🔄 Review model selection and prompt versions');
      actions.push('📊 Compare recent model performance vs historical baseline');
    }

    if (rootCauses.some((c) => c.includes('validation thresholds'))) {
      actions.push('⚙️ Review and adjust validation thresholds');
      actions.push('🎯 Consider lowering minimum quality requirements temporarily');
    }

    if (rootCauses.some((c) => c.includes('user satisfaction'))) {
      actions.push('📞 Review recent feedback comments for patterns');
      actions.push('🚀 Increase model quality for critical analyses');
    }

    if (rootCauses.some((c) => c.includes('CRITICAL'))) {
      actions.push('🚨 ESCALATE: Contact on-call engineer immediately');
      actions.push('⏸️ Consider temporarily disabling auto-execution for high-risk types');
    }

    return actions;
  }

  private _assessInterventionLevel(
    driftScore: number,
    indicators: DriftIndicator[],
  ): { requiresIntervention: boolean; interventionLevel?: 'logging' | 'alert' | 'investigate' | 'emergency' } {
    const criticalCount = indicators.filter((i) => i.severity === 'critical').length;

    if (driftScore > 0.8 || criticalCount >= 3) {
      return { requiresIntervention: true, interventionLevel: 'emergency' };
    }

    if (driftScore > 0.6 || criticalCount >= 2) {
      return { requiresIntervention: true, interventionLevel: 'investigate' };
    }

    if (driftScore > 0.4) {
      return { requiresIntervention: true, interventionLevel: 'alert' };
    }

    if (driftScore > 0.2) {
      return { requiresIntervention: false, interventionLevel: 'logging' };
    }

    return { requiresIntervention: false };
  }

  private async _recordDriftDetection(result: DriftDetectionResult): Promise<void> {
    try {
      const client = await this.pgPool.connect();

      try {
        await client.query(
          `INSERT INTO drift_detections
          (is_drifting, drift_score, indicators, affected_types, root_causes,
           requires_intervention, intervention_level, timestamp)
          VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
          [
            result.isDrifting,
            result.driftScore,
            JSON.stringify(result.indicators),
            JSON.stringify(result.affectedTypes),
            JSON.stringify(result.rootCauses),
            result.requiresIntervention,
            result.interventionLevel || null,
          ],
        );
      } finally {
        client.release();
      }
    } catch (error) {
      this.logger.warn('Failed to record drift detection', {
        error: error instanceof Error ? error.message : 'unknown',
      });
    }
  }
}
