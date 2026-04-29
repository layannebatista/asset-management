import { Logger } from 'winston';
import { Pool } from 'pg';
import { Redis } from 'ioredis';
import { DecisionOutput } from '../types/DecisionOutput';
import { AnalysisType } from '../types/analysis.types';

/**
 * Detecção de anomalia em decisão
 */
export interface AnomalyDetection {
  decisionId: string;
  isAnomaly: boolean;
  anomalyScore: number;           // 0-1 (1 = very anomalous)
  anomalyType: AnomalyType[];
  severity: 'warning' | 'critical';
  reasons: string[];
  suggestedAction: 'approve' | 'escalate' | 'block';
  timestamp: Date;
}

export enum AnomalyType {
  OUT_OF_DISTRIBUTION = 'out_of_distribution',           // Muito diferente do padrão histórico
  INCONSISTENT_WITH_CONTEXT = 'inconsistent_with_context', // Não faz sentido com contexto
  QUALITY_SUSPICION = 'quality_suspicion',               // Métrica de qualidade não bate
  CONTRADICTION = 'contradiction',                       // Contradiz decisões anteriores
  UNUSUAL_COST = 'unusual_cost',                         // Custo muito diferente
  UNUSUAL_RISK = 'unusual_risk',                         // Risco fora do padrão
  LOOP_DETECTED = 'loop_detected',                       // Mesma recomendação múltiplas vezes
  SYSTEM_STRESS = 'system_stress',                       // Sistema está sob stress
}

/**
 * Histórico de decisão (para comparação)
 */
export interface DecisionHistory {
  analysisType: AnalysisType;
  criticality: string;

  // Distribuição histórica
  avgQualityScore: number;
  stdQualityScore: number;
  qualityScoreRange: { min: number; max: number };

  avgRiskScore: number;
  stdRiskScore: number;
  riskLevelDistribution: Record<string, number>; // { low: 0.6, medium: 0.3, high: 0.1 }

  avgCost: number;
  stdCost: number;
  costRange: { min: number; max: number };

  // Frequência de recomendações
  topRecommendations: { recommendation: string; frequency: number }[];

  // Taxa de sucesso
  successRate: number;
  lastUpdated: Date;
}

/**
 * AnomalyGuard: Detecta decisões fora do padrão
 *
 * Responsabilidades:
 * 1. Manter histórico de decisões por tipo/criticidade
 * 2. Detectar decisões "estranhas" (outliers)
 * 3. Validar que decisão faz sentido com contexto
 * 4. Detectar loops (mesma recomendação repetida)
 * 5. Detectar degradação de sistema (muitas falhas)
 * 6. Bloquear decisões suspeitas
 * 7. Sugerir investigação
 *
 * Anomalias detectadas:
 * - Z-score > 3 (muito diferente do padrão)
 * - Contradição com contexto
 * - Mudança súbita de padrão
 * - Loop de recomendações
 * - Taxa de erro alta
 *
 * Se detectar anomalia crítica → bloqueia + escala para humano
 */
export class AnomalyGuard {
  private readonly pgPool: Pool;
  private readonly redis: Redis;
  private readonly logger: Logger;
  private readonly historyCache = new Map<string, DecisionHistory>();

  constructor(pgPool: Pool, redis: Redis, logger: Logger) {
    this.pgPool = pgPool;
    this.redis = redis;
    this.logger = logger;

    this.logger.info('AnomalyGuard initialized');
  }

  /**
   * Detectar anomalias em decisão
   */
  async detectAnomalies(
    decisionId: string,
    decision: DecisionOutput,
    context: any,
  ): Promise<AnomalyDetection> {
    try {
      const anomalies: AnomalyType[] = [];
      const reasons: string[] = [];
      let anomalyScore = 0;

      // 1. Obter histórico
      const history = await this._getHistory(decision.metadata.type, decision.metadata.criticality);

      if (!history) {
        // Sem histórico = não pode detectar anomalias
        return {
          decisionId,
          isAnomaly: false,
          anomalyScore: 0,
          anomalyType: [],
          severity: 'warning',
          reasons: ['No historical data for comparison'],
          suggestedAction: 'approve',
          timestamp: new Date(),
        };
      }

      // 2. Verificar distribuição (Z-score)
      const qualityZScore = Math.abs(
        (decision.metrics.quality_score - history.avgQualityScore) / (history.stdQualityScore || 0.1),
      );

      if (qualityZScore > 3) {
        anomalies.push(AnomalyType.OUT_OF_DISTRIBUTION);
        reasons.push(`Quality score ${(decision.metrics.quality_score * 100).toFixed(0)}% is ${qualityZScore.toFixed(1)} std devs from mean`);
        anomalyScore += 0.3;
      }

      // 3. Verificar consistência com contexto
      const contextConsistency = await this._validateContextConsistency(decision, context);
      if (!contextConsistency.consistent) {
        anomalies.push(AnomalyType.INCONSISTENT_WITH_CONTEXT);
        reasons.push(...contextConsistency.issues);
        anomalyScore += 0.2;
      }

      // 4. Verificar loops
      const loopDetection = await this._detectLoop(decisionId, decision.decision.recommendation);
      if (loopDetection.isLoop) {
        anomalies.push(AnomalyType.LOOP_DETECTED);
        reasons.push(`Same recommendation made ${loopDetection.count} times in last ${loopDetection.timespanMinutes} minutes`);
        anomalyScore += 0.25;
      }

      // 5. Verificar stress do sistema
      const systemStress = await this._detectSystemStress(decision.metadata.type);
      if (systemStress.isStressed) {
        anomalies.push(AnomalyType.SYSTEM_STRESS);
        reasons.push(`System is under stress: ${systemStress.reason}`);
        anomalyScore += 0.15;
      }

      // 6. Verificar custo
      const costZScore = Math.abs(
        (decision.metadata.execution_time_ms - history.avgCost) / (history.stdCost || 100),
      );

      if (costZScore > 3) {
        anomalies.push(AnomalyType.UNUSUAL_COST);
        reasons.push(`Estimated cost very different from historical average`);
        anomalyScore += 0.1;
      }

      const isAnomaly = anomalies.length > 0;
      const severity = anomalyScore > 0.6 ? 'critical' : 'warning';

      // Determinar ação
      let suggestedAction: 'approve' | 'escalate' | 'block';
      if (anomalyScore > 0.7) {
        suggestedAction = 'block'; // Anomalia crítica = bloqueia
      } else if (anomalyScore > 0.4) {
        suggestedAction = 'escalate'; // Anomalia moderada = escala
      } else {
        suggestedAction = 'approve'; // Anomalia leve = aprova com warning
      }

      const detection: AnomalyDetection = {
        decisionId,
        isAnomaly,
        anomalyScore: Math.min(1, anomalyScore),
        anomalyType: anomalies,
        severity,
        reasons,
        suggestedAction,
        timestamp: new Date(),
      };

      // Registrar detecção
      await this._recordDetection(detection);

      if (isAnomaly) {
        this.logger.warn('Anomaly detected', {
          decisionId,
          anomalyScore: detection.anomalyScore,
          types: anomalies,
          suggestedAction,
        });
      }

      return detection;
    } catch (error) {
      this.logger.error('Error detecting anomalies', {
        error: error instanceof Error ? error.message : 'unknown',
      });

      // Erro na detecção = assume seguro (não bloqueia)
      return {
        decisionId,
        isAnomaly: false,
        anomalyScore: 0,
        anomalyType: [],
        severity: 'warning',
        reasons: ['Anomaly detection error'],
        suggestedAction: 'approve',
        timestamp: new Date(),
      };
    }
  }

  /**
   * Atualizar histórico com execução bem-sucedida
   */
  async recordSuccess(
    analysisType: AnalysisType,
    criticality: string,
    decision: DecisionOutput,
    executionCost: number,
  ): Promise<void> {
    try {
      // Invalidate cache
      this.historyCache.delete(`${analysisType}:${criticality}`);

      // Atualizar BD (cálculos serão feitos quando carregar novamente)
      const client = await this.pgPool.connect();

      try {
        await client.query(
          `INSERT INTO decision_history
           (analysis_type, criticality, quality_score, cost, recommendation)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            analysisType,
            criticality,
            decision.metrics.quality_score,
            executionCost,
            decision.decision.recommendation,
          ],
        );
      } finally {
        client.release();
      }
    } catch (error) {
      this.logger.warn('Failed to record success', {
        error: error instanceof Error ? error.message : 'unknown',
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // Private methods
  // ═══════════════════════════════════════════════════════════════════

  private async _getHistory(
    analysisType: AnalysisType,
    criticality: string,
  ): Promise<DecisionHistory | null> {
    const cacheKey = `${analysisType}:${criticality}`;

    if (this.historyCache.has(cacheKey)) {
      return this.historyCache.get(cacheKey) || null;
    }

    try {
      const client = await this.pgPool.connect();

      try {
        const result = await client.query(
          `SELECT
            AVG(quality_score)::float as avg_quality,
            STDDEV(quality_score)::float as std_quality,
            MIN(quality_score)::float as min_quality,
            MAX(quality_score)::float as max_quality,
            AVG(cost)::float as avg_cost,
            STDDEV(cost)::float as std_cost,
            MODE() WITHIN GROUP (ORDER BY recommendation) as top_recommendation,
            COUNT(CASE WHEN success = true THEN 1 END)::float / COUNT(*) as success_rate
          FROM decision_history
          WHERE analysis_type = $1 AND criticality = $2
            AND created_at > NOW() - INTERVAL '30 days'`,
          [analysisType, criticality],
        );

        if (result.rows.length === 0 || result.rows[0].avg_quality === null) {
          return null;
        }

        const row = result.rows[0];
        const history: DecisionHistory = {
          analysisType,
          criticality,
          avgQualityScore: row.avg_quality,
          stdQualityScore: row.std_quality || 0.1,
          qualityScoreRange: {
            min: row.min_quality,
            max: row.max_quality,
          },
          avgRiskScore: 0.5, // TODO: implementar
          stdRiskScore: 0.15,
          riskLevelDistribution: { low: 0.6, medium: 0.3, high: 0.1 }, // TODO: implementar
          avgCost: row.avg_cost || 0,
          stdCost: row.std_cost || 100,
          costRange: { min: 0, max: 1000 }, // TODO: implementar
          topRecommendations: [], // TODO: implementar
          successRate: row.success_rate || 0.8,
          lastUpdated: new Date(),
        };

        this.historyCache.set(cacheKey, history);
        return history;
      } finally {
        client.release();
      }
    } catch (error) {
      this.logger.debug('Could not load history', {
        error: error instanceof Error ? error.message : 'unknown',
      });
      return null;
    }
  }

  private async _validateContextConsistency(
    decision: DecisionOutput,
    context: any,
  ): Promise<{ consistent: boolean; issues: string[] }> {
    const issues: string[] = [];

    // Verificar se contexto contém dados relevantes
    const contextSize = Object.keys(context).length;
    if (contextSize === 0) {
      issues.push('No context provided for decision');
    }

    // Verificar contradições (recomendação vs contexto)
    const lower = decision.decision.recommendation.toLowerCase();

    if (lower.includes('scale') && context.current_load < 50) {
      issues.push('Recommendation to scale, but current load is low');
    }

    if (lower.includes('increase') && context.error_rate === 0) {
      issues.push('Recommendation to increase monitoring, but no errors detected');
    }

    return {
      consistent: issues.length === 0,
      issues,
    };
  }

  private async _detectLoop(
    decisionId: string,
    recommendation: string,
    timeWindowMinutes: number = 60,
  ): Promise<{ isLoop: boolean; count: number; timespanMinutes: number }> {
    try {
      const client = await this.pgPool.connect();

      try {
        const result = await client.query(
          `SELECT COUNT(*) as count
           FROM decision_history
           WHERE recommendation = $1
             AND created_at > NOW() - INTERVAL '${timeWindowMinutes} minutes'`,
          [recommendation],
        );

        const count = result.rows[0].count || 0;

        // Loop se mesma recomendação > 5 vezes em 1 hora
        return {
          isLoop: count > 5,
          count,
          timespanMinutes: timeWindowMinutes,
        };
      } finally {
        client.release();
      }
    } catch (error) {
      return { isLoop: false, count: 0, timespanMinutes: 0 };
    }
  }

  private async _detectSystemStress(analysisType: AnalysisType): Promise<{
    isStressed: boolean;
    reason: string;
  }> {
    try {
      const client = await this.pgPool.connect();

      try {
        // Checar taxa de erro nos últimos 30 minutos
        const result = await client.query(
          `SELECT
            COUNT(CASE WHEN success = false THEN 1 END)::float / NULLIF(COUNT(*), 0) as error_rate
           FROM decision_history
           WHERE analysis_type = $1
             AND created_at > NOW() - INTERVAL '30 minutes'`,
          [analysisType],
        );

        const errorRate = result.rows[0]?.error_rate || 0;

        if (errorRate > 0.3) {
          return {
            isStressed: true,
            reason: `Error rate ${(errorRate * 100).toFixed(0)}% in last 30 minutes`,
          };
        }

        return { isStressed: false, reason: '' };
      } finally {
        client.release();
      }
    } catch (error) {
      return { isStressed: false, reason: '' };
    }
  }

  private async _recordDetection(detection: AnomalyDetection): Promise<void> {
    try {
      const client = await this.pgPool.connect();

      try {
        await client.query(
          `INSERT INTO anomaly_detections
           (decision_id, is_anomaly, anomaly_score, anomaly_types, severity,
            reasons, suggested_action)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            detection.decisionId,
            detection.isAnomaly,
            detection.anomalyScore,
            JSON.stringify(detection.anomalyType),
            detection.severity,
            JSON.stringify(detection.reasons),
            detection.suggestedAction,
          ],
        );
      } finally {
        client.release();
      }
    } catch (error) {
      this.logger.warn('Failed to record anomaly detection', {
        error: error instanceof Error ? error.message : 'unknown',
      });
    }
  }
}
