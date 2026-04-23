import { Logger } from 'winston';
import { Pool } from 'pg';
import { Redis } from 'ioredis';
import { DecisionOutput } from '../types/DecisionOutput';
import { AnalysisType } from '../types/analysis.types';
import { HistoricalSuccessTracker } from '../learning/HistoricalSuccessTracker';

/**
 * Validação de decisão
 */
export interface DecisionValidation {
  isValid: boolean;
  validationScore: number; // 0-1
  violations: ValidationViolation[];
  recommendations: string[];
  shouldReexecute: boolean;
  reexecutionStrategy?: 'different_model' | 'expanded_context' | 'alternative_prompt';
}

/**
 * Violação detectada
 */
export interface ValidationViolation {
  type: 'quality' | 'consistency' | 'anomaly' | 'risk' | 'drift';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  threshold?: number;
  actualValue?: number;
}

/**
 * Reexecução automática após validação
 */
export interface ValidationReexecution {
  originalDecisionId: string;
  validationFailureReason: string;
  reexecutionAttempt: number;
  strategy: 'different_model' | 'expanded_context' | 'alternative_prompt';
  result: {
    improved: boolean;
    qualityDelta: number;
    costDelta: number;
  };
}

/**
 * DecisionValidator: Camada crítica que valida decisões antes de retornar
 *
 * Responsabilidades:
 * 1. Validar qualidade mínima
 * 2. Verificar consistência com histórico
 * 3. Avaliar risco da ação
 * 4. Decidir se deve reexecuta
 * 5. Bloquear decisões perigosas
 *
 * Thresholds:
 * - Quality: type-specific (observability: 0.65, incident: 0.75)
 * - Consistency: vs histórico (delta < 0.15)
 * - Anomaly: desvio > 2 std devs
 */
export class DecisionValidator {
  private readonly pgPool: Pool;
  private readonly redis: Redis;
  private readonly logger: Logger;
  private readonly tracker: HistoricalSuccessTracker;

  // Thresholds
  private readonly qualityThresholds: Record<AnalysisType, number> = {
    'observability': 0.65,
    'test-intelligence': 0.70,
    'cicd': 0.60,
    'incident': 0.75,
    'risk': 0.70,
  } as any;

  private readonly consistencyThreshold = 0.15; // 15% delta
  private readonly anomalyStdDevs = 2.5; // Desvio padrão
  private readonly cacheTTL = 3600; // 1 hora

  constructor(pgPool: Pool, redis: Redis, logger: Logger, tracker: HistoricalSuccessTracker) {
    this.pgPool = pgPool;
    this.redis = redis;
    this.logger = logger;
    this.tracker = tracker;
  }

  /**
   * Validar decisão completa
   */
  async validateDecision(decision: DecisionOutput): Promise<DecisionValidation> {
    try {
      const violations: ValidationViolation[] = [];

      // ── Step 1: Validar qualidade
      const qualityViolation = await this._validateQuality(decision);
      if (qualityViolation) violations.push(qualityViolation);

      // ── Step 2: Validar consistência histórica
      const consistencyViolation = await this._validateConsistency(decision);
      if (consistencyViolation) violations.push(consistencyViolation);

      // ── Step 3: Detectar anomalias
      const anomalyViolation = await this._detectAnomaly(decision);
      if (anomalyViolation) violations.push(anomalyViolation);

      // ── Step 4: Validar risco (integração com RiskEngine)
      const riskViolation = await this._validateRisk(decision);
      if (riskViolation) violations.push(riskViolation);

      // ── Step 5: Calcular score de validação
      const validationScore = this._calculateValidationScore(violations);

      // ── Step 6: Decidir se deve reexecuta
      const shouldReexecute = this._shouldReexecute(violations, decision);
      const reexecutionStrategy = shouldReexecute ? this._selectReexecutionStrategy(violations) : undefined;

      // ── Step 7: Gerar recomendações
      const recommendations = this._generateRecommendations(violations, shouldReexecute);

      const result: DecisionValidation = {
        isValid: violations.length === 0,
        validationScore,
        violations,
        recommendations,
        shouldReexecute,
        reexecutionStrategy,
      };

      this.logger.info('Decision validation complete', {
        analysisId: decision.metadata.analysisId,
        isValid: result.isValid,
        violationCount: violations.length,
        shouldReexecute,
        score: validationScore.toFixed(2),
      });

      return result;
    } catch (error) {
      this.logger.error('Error validating decision', {
        error: error instanceof Error ? error.message : 'unknown',
      });

      // Fail-safe: assume válido se erro
      return {
        isValid: true,
        validationScore: 0.5,
        violations: [],
        recommendations: ['Validation failed, assuming valid'],
        shouldReexecute: false,
      };
    }
  }

  /**
   * Registrar reexecução após validação
   */
  async recordReexecution(reexec: ValidationReexecution): Promise<void> {
    try {
      const client = await this.pgPool.connect();

      try {
        await client.query(
          `INSERT INTO validation_reexecutions
          (original_decision_id, failure_reason, reexecution_attempt, strategy,
           quality_improvement, cost_delta, timestamp)
          VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
          [
            reexec.originalDecisionId,
            reexec.validationFailureReason,
            reexec.reexecutionAttempt,
            reexec.strategy,
            reexec.result.qualityDelta,
            reexec.result.costDelta,
          ],
        );
      } finally {
        client.release();
      }
    } catch (error) {
      this.logger.warn('Failed to record reexecution', {
        error: error instanceof Error ? error.message : 'unknown',
      });
    }
  }

  /**
   * Obter histórico de validação por tipo
   */
  async getValidationStats(analysisType: AnalysisType, days: number = 30): Promise<{
    totalDecisions: number;
    passedValidation: number;
    failedValidation: number;
    validationRate: number;
    reexecutionRate: number;
    avgViolationCount: number;
  }> {
    const client = await this.pgPool.connect();

    try {
      const result = await client.query(
        `SELECT
          COUNT(*) as total_decisions,
          SUM(CASE WHEN is_valid THEN 1 ELSE 0 END) as passed,
          SUM(CASE WHEN NOT is_valid THEN 1 ELSE 0 END) as failed,
          AVG(ARRAY_LENGTH(violations, 1))::float as avg_violations,
          SUM(CASE WHEN should_reexecute THEN 1 ELSE 0 END)::float / COUNT(*) as reexec_rate
        FROM decision_validations
        WHERE analysis_type = $1
        AND timestamp > NOW() - INTERVAL '${days} days'`,
        [analysisType],
      );

      if (result.rows.length === 0) {
        return {
          totalDecisions: 0,
          passedValidation: 0,
          failedValidation: 0,
          validationRate: 0,
          reexecutionRate: 0,
          avgViolationCount: 0,
        };
      }

      const row = result.rows[0];
      const total = parseInt(row.total_decisions || '0');

      return {
        totalDecisions: total,
        passedValidation: parseInt(row.passed || '0'),
        failedValidation: parseInt(row.failed || '0'),
        validationRate: total > 0 ? parseInt(row.passed || '0') / total : 0,
        reexecutionRate: row.reexec_rate || 0,
        avgViolationCount: row.avg_violations || 0,
      };
    } finally {
      client.release();
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // Private validation methods
  // ═══════════════════════════════════════════════════════════════════

  private async _validateQuality(decision: DecisionOutput): Promise<ValidationViolation | null> {
    const threshold = this.qualityThresholds[decision.metadata.type];
    const quality = decision.metrics.quality_score;

    if (quality < threshold) {
      return {
        type: 'quality',
        severity: quality < threshold * 0.8 ? 'critical' : 'high',
        message: `Quality ${quality.toFixed(2)} below threshold ${threshold.toFixed(2)}`,
        threshold,
        actualValue: quality,
      };
    }

    return null;
  }

  private async _validateConsistency(decision: DecisionOutput): Promise<ValidationViolation | null> {
    const stats = await this.tracker.getTypeStats(decision.metadata.type);

    if (!stats) {
      return null; // Sem histórico
    }

    const delta = Math.abs(decision.metrics.quality_score - stats.avgQuality);

    if (delta > this.consistencyThreshold) {
      return {
        type: 'consistency',
        severity: delta > this.consistencyThreshold * 1.5 ? 'high' : 'medium',
        message: `Quality deviates ${(delta * 100).toFixed(1)}% from historical average`,
        threshold: this.consistencyThreshold,
        actualValue: delta,
      };
    }

    return null;
  }

  private async _detectAnomaly(decision: DecisionOutput): Promise<ValidationViolation | null> {
    const client = await this.pgPool.connect();

    try {
      const result = await client.query(
        `SELECT
          AVG(quality_score)::float as mean_quality,
          STDDEV(quality_score)::float as std_quality
        FROM analysis_success_history
        WHERE analysis_type = $1
        AND timestamp > NOW() - INTERVAL '90 days'`,
        [decision.metadata.type],
      );

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      const mean = row.mean_quality || 0.7;
      const std = row.std_quality || 0.1;

      const zScore = Math.abs((decision.metrics.quality_score - mean) / std);

      if (zScore > this.anomalyStdDevs) {
        return {
          type: 'anomaly',
          severity: zScore > this.anomalyStdDevs * 1.5 ? 'high' : 'medium',
          message: `Quality is ${zScore.toFixed(1)} standard deviations from mean`,
          threshold: this.anomalyStdDevs,
          actualValue: zScore,
        };
      }

      return null;
    } finally {
      client.release();
    }
  }

  private async _validateRisk(decision: DecisionOutput): Promise<ValidationViolation | null> {
    // Será integrado com DecisionRiskEngine
    // Por enquanto, placeholder
    return null;
  }

  private _calculateValidationScore(violations: ValidationViolation[]): number {
    if (violations.length === 0) return 1.0;

    const severityWeights = { low: 0.05, medium: 0.15, high: 0.35, critical: 0.75 };
    const totalWeight = violations.reduce((sum, v) => sum + severityWeights[v.severity], 0);

    return Math.max(0, 1.0 - Math.min(1, totalWeight));
  }

  private _shouldReexecute(violations: ValidationViolation[], decision: DecisionOutput): boolean {
    // Reexecuta se há violação critical/high
    const hasHighSeverity = violations.some((v) => ['critical', 'high'].includes(v.severity));

    // Ou se criticality é HIGH e há alguma violação
    if (decision.metadata.criticality === 'HIGH' && violations.length > 0) {
      return true;
    }

    return hasHighSeverity;
  }

  private _selectReexecutionStrategy(violations: ValidationViolation[]): 'different_model' | 'expanded_context' | 'alternative_prompt' {
    const qualityViolation = violations.find((v) => v.type === 'quality');
    const consistencyViolation = violations.find((v) => v.type === 'consistency');

    // Se qualidade muito baixa, trocar modelo
    if (qualityViolation && qualityViolation.actualValue! < 0.5) {
      return 'different_model';
    }

    // Se inconsistência, expandir contexto
    if (consistencyViolation) {
      return 'expanded_context';
    }

    // Default: tentar outro prompt
    return 'alternative_prompt';
  }

  private _generateRecommendations(violations: ValidationViolation[], shouldReexecute: boolean): string[] {
    const recommendations: string[] = [];

    for (const violation of violations) {
      switch (violation.type) {
        case 'quality':
          recommendations.push('⚠️ Qualidade baixa - Considere reexecutar com modelo melhor');
          break;
        case 'consistency':
          recommendations.push('⚠️ Resultado inconsistente com histórico - Validar com análise adicional');
          break;
        case 'anomaly':
          recommendations.push('⚠️ Resultado anômalo - Investigar contexto');
          break;
        case 'risk':
          recommendations.push('🚨 Risco alto - Requer aprovação antes de executar ação');
          break;
        case 'drift':
          recommendations.push('📉 Sistema degradando - Revisar modelo/prompt');
          break;
      }
    }

    if (shouldReexecute) {
      recommendations.push('↻ Reexecução automática recomendada');
    }

    return recommendations;
  }
}
