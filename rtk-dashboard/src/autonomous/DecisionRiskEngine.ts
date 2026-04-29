import { Logger } from 'winston';
import { Pool } from 'pg';
import { Redis } from 'ioredis';
import { DecisionOutput, DecisionAction } from '../types/DecisionOutput';
import { AnalysisType } from '../types/analysis.types';

/**
 * Análise de risco de uma ação
 */
export interface ActionRiskAssessment {
  action: DecisionAction;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number; // 0-1
  factors: RiskFactor[];
  requiredApprovals?: string[]; // Para decisões críticas
  estimatedImpact: {
    positive: number; // Se bem-sucedida
    negative: number; // Se falhar
  };
  mitigationStrategies: string[];
}

/**
 * Fator de risco individual
 */
export interface RiskFactor {
  category: 'infrastructure' | 'data' | 'security' | 'compliance' | 'operational' | 'financial';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  weight: number; // 0-1
}

/**
 * Análise de risco da decisão completa
 */
export interface DecisionRiskAnalysis {
  overallRiskLevel: 'low' | 'medium' | 'high' | 'critical';
  overallRiskScore: number;
  actionRisks: ActionRiskAssessment[];
  decisionSafety: {
    isSafe: boolean;
    requiresApproval: boolean;
    approvalLevel?: 'manager' | 'director' | 'executive';
  };
  recommendations: string[];
}

/**
 * DecisionRiskEngine: Avalia risco das ações sugeridas
 *
 * Rastreamento de risco:
 * - Infrastructure: escalar, provisionar, alterar config
 * - Data: modificar DB, apagar, exportar
 * - Security: alterar permissões, secrets
 * - Compliance: LGPD, auditoria
 * - Operational: mudanças em produção
 * - Financial: reduzir custos, alterar SLAs
 *
 * Risco aumenta com:
 * - Criticidade da análise
 * - Historicamente alto custo
 * - Contexto incerto
 * - Falta de rollback
 */
export class DecisionRiskEngine {
  private readonly pgPool: Pool;
  private readonly redis: Redis;
  private readonly logger: Logger;

  // Padrões de risco por tipo de ação
  private readonly riskPatterns: Record<string, { keywords: string[]; baseRisk: number }> = {
    infrastructure: {
      keywords: ['scale', 'provision', 'remove', 'delete', 'resize', 'terminate', 'recreate'],
      baseRisk: 0.6,
    },
    database: {
      keywords: ['alter', 'drop', 'truncate', 'delete', 'modify', 'backup', 'restore'],
      baseRisk: 0.8,
    },
    security: {
      keywords: ['permission', 'credential', 'password', 'key', 'grant', 'revoke', 'access'],
      baseRisk: 0.9,
    },
    network: {
      keywords: ['firewall', 'route', 'dns', 'lb', 'vpn', 'proxy', 'gateway'],
      baseRisk: 0.7,
    },
    monitoring: {
      keywords: ['disable', 'alert', 'threshold', 'monitor', 'shutdown'],
      baseRisk: 0.5,
    },
  };

  constructor(pgPool: Pool, redis: Redis, logger: Logger) {
    this.pgPool = pgPool;
    this.redis = redis;
    this.logger = logger;
  }

  /**
   * Analisar risco completo de uma decisão
   */
  async analyzeDecisionRisk(decision: DecisionOutput): Promise<DecisionRiskAnalysis> {
    try {
      const actionRisks: ActionRiskAssessment[] = [];

      // Avaliar cada ação
      for (const action of decision.decision.actions) {
        const risk = await this._assessActionRisk(action, decision);
        actionRisks.push(risk);
      }

      // Calcular risco geral
      const overallRisk = this._calculateOverallRisk(actionRisks, decision);

      // Determinar se seguro
      const decisionSafety = this._assessDecisionSafety(overallRisk, decision);

      // Gerar recomendações
      const recommendations = this._generateRiskRecommendations(actionRisks, overallRisk);

      const result: DecisionRiskAnalysis = {
        overallRiskLevel: overallRisk.level,
        overallRiskScore: overallRisk.score,
        actionRisks,
        decisionSafety,
        recommendations,
      };

      this.logger.info('Decision risk analysis complete', {
        analysisId: decision.metadata.analysisId,
        riskLevel: result.overallRiskLevel,
        actionCount: actionRisks.length,
        requiresApproval: decisionSafety.requiresApproval,
      });

      // Registrar análise
      await this._recordRiskAnalysis(decision.metadata.analysisId, result);

      return result;
    } catch (error) {
      this.logger.error('Error analyzing decision risk', {
        error: error instanceof Error ? error.message : 'unknown',
      });

      // Fail-safe: assume low risk se erro
      return {
        overallRiskLevel: 'low',
        overallRiskScore: 0.2,
        actionRisks: [],
        decisionSafety: { isSafe: true, requiresApproval: false },
        recommendations: [],
      };
    }
  }

  /**
   * Obter histórico de risco por tipo
   */
  async getRiskTrend(analysisType: AnalysisType, days: number = 30): Promise<
    Array<{
      date: Date;
      avgRiskScore: number;
      criticalCount: number;
      highCount: number;
      approvalRate: number;
    }>
  > {
    const client = await this.pgPool.connect();

    try {
      const result = await client.query(
        `SELECT
          DATE(timestamp) as date,
          AVG(risk_score)::float as avg_risk,
          SUM(CASE WHEN risk_level = 'critical' THEN 1 ELSE 0 END) as critical_count,
          SUM(CASE WHEN risk_level = 'high' THEN 1 ELSE 0 END) as high_count,
          SUM(CASE WHEN required_approval THEN 1 ELSE 0 END)::float / COUNT(*) as approval_rate
        FROM decision_risk_analyses
        WHERE analysis_type = $1
        AND timestamp > NOW() - INTERVAL '${days} days'
        GROUP BY DATE(timestamp)
        ORDER BY date ASC`,
        [analysisType],
      );

      return result.rows.map((row) => ({
        date: new Date(row.date),
        avgRiskScore: row.avg_risk,
        criticalCount: parseInt(row.critical_count || '0'),
        highCount: parseInt(row.high_count || '0'),
        approvalRate: row.approval_rate || 0,
      }));
    } finally {
      client.release();
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // Private methods
  // ═══════════════════════════════════════════════════════════════════

  private async _assessActionRisk(action: DecisionAction, decision: DecisionOutput): Promise<ActionRiskAssessment> {
    const factors: RiskFactor[] = [];

    // ── Detectar padrão de risco por keywords
    const baseRisk = this._detectRiskPattern(action.description);

    // ── Fator 1: Complexidade da ação
    const complexityFactor = this._assessComplexity(action);
    factors.push({
      category: 'operational',
      severity: complexityFactor > 0.6 ? 'high' : 'medium',
      description: `Action complexity: ${action.estimated_effort}`,
      weight: complexityFactor,
    });

    // ── Fator 2: Impacto estimado
    const impactFactor = action.estimated_impact === 'high' ? 0.8 : action.estimated_impact === 'medium' ? 0.5 : 0.2;
    factors.push({
      category: 'operational',
      severity: action.estimated_impact === 'high' ? 'high' : 'medium',
      description: `Estimated impact: ${action.estimated_impact}`,
      weight: impactFactor,
    });

    // ── Fator 3: Criticidade da análise
    const criticalityWeight = decision.metadata.criticality === 'CRITICAL' ? 0.7 : decision.metadata.criticality === 'HIGH' ? 0.5 : 0.3;
    factors.push({
      category: 'operational',
      severity: decision.metadata.criticality === 'CRITICAL' ? 'high' : 'medium',
      description: `Analysis criticality: ${decision.metadata.criticality}`,
      weight: criticalityWeight,
    });

    // ── Fator 4: Confidence do modelo
    const confidenceRisk = 1 - decision.metrics.confidence_score;
    factors.push({
      category: 'operational',
      severity: confidenceRisk > 0.4 ? 'high' : 'medium',
      description: `Model confidence: ${decision.metrics.confidence_score.toFixed(2)}`,
      weight: confidenceRisk,
    });

    // ── Calcular risco final
    const totalWeight = factors.reduce((sum, f) => sum + f.weight, 0);
    const riskScore = Math.min(1, (baseRisk + totalWeight) / (1 + factors.length));

    const riskLevel = this._riskScoreTolevel(riskScore);

    // ── Estratégias de mitigação
    const mitigationStrategies = this._generateMitigation(action, riskScore);

    // ── Impacto estimado
    const estimatedImpact = {
      positive: action.estimated_impact === 'high' ? 0.8 : action.estimated_impact === 'medium' ? 0.5 : 0.2,
      negative: riskScore * 0.8, // Perda potencial se falhar
    };

    return {
      action,
      riskLevel,
      riskScore,
      factors,
      requiredApprovals: riskScore > 0.7 ? ['manager', 'tech-lead'] : undefined,
      estimatedImpact,
      mitigationStrategies,
    };
  }

  private _detectRiskPattern(description: string): number {
    const lower = description.toLowerCase();

    for (const [category, pattern] of Object.entries(this.riskPatterns)) {
      const matches = pattern.keywords.filter((k) => lower.includes(k));
      if (matches.length > 0) {
        return pattern.baseRisk;
      }
    }

    return 0.3; // Risk padrão
  }

  private _assessComplexity(action: DecisionAction): number {
    const effortMap = { XS: 0.1, S: 0.3, M: 0.5, L: 0.8, XL: 1.0 };
    return effortMap[action.estimated_effort as keyof typeof effortMap] || 0.5;
  }

  private _riskScoreTolevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score < 0.3) return 'low';
    if (score < 0.6) return 'medium';
    if (score < 0.85) return 'high';
    return 'critical';
  }

  private _calculateOverallRisk(
    actionRisks: ActionRiskAssessment[],
    decision: DecisionOutput,
  ): { level: 'low' | 'medium' | 'high' | 'critical'; score: number } {
    if (actionRisks.length === 0) {
      return { level: 'low', score: 0 };
    }

    // Max risk (worst action)
    const maxRisk = Math.max(...actionRisks.map((r) => r.riskScore));

    // Weighted average (mais ações críticas = risco maior)
    const criticalActions = actionRisks.filter((r) => r.riskLevel === 'critical').length;
    const weightedRisk = maxRisk * 0.7 + (criticalActions / actionRisks.length) * 0.3;

    // Penalidade por criticality
    const criticalityPenalty = decision.metadata.criticality === 'CRITICAL' ? 0.2 : 0;
    const overallScore = Math.min(1, weightedRisk + criticalityPenalty);

    return {
      level: this._riskScoreTolevel(overallScore),
      score: overallScore,
    };
  }

  private _assessDecisionSafety(
    overallRisk: { level: string; score: number },
    decision: DecisionOutput,
  ): { isSafe: boolean; requiresApproval: boolean; approvalLevel?: 'manager' | 'director' | 'executive' } {
    if (overallRisk.score > 0.85) {
      return {
        isSafe: false,
        requiresApproval: true,
        approvalLevel: 'executive',
      };
    }

    if (overallRisk.score > 0.7) {
      return {
        isSafe: false,
        requiresApproval: true,
        approvalLevel: 'director',
      };
    }

    if (overallRisk.score > 0.5 || decision.metadata.criticality === 'CRITICAL') {
      return {
        isSafe: true,
        requiresApproval: true,
        approvalLevel: 'manager',
      };
    }

    return {
      isSafe: true,
      requiresApproval: false,
    };
  }

  private _generateMitigation(action: DecisionAction, riskScore: number): string[] {
    const strategies: string[] = [];

    if (riskScore > 0.8) {
      strategies.push('⚠️ Escalate to risk management team');
      strategies.push('🛡️ Require executive approval before execution');
    }

    if (riskScore > 0.6) {
      strategies.push('📋 Create detailed rollback plan');
      strategies.push('⏱️ Execute during low-traffic window');
    }

    if (action.estimated_effort === 'XL') {
      strategies.push('🔄 Break into smaller, sequential steps');
    }

    if (riskScore > 0.5) {
      strategies.push('🚨 Enable enhanced monitoring during execution');
      strategies.push('👥 Have on-call engineer available');
    }

    return strategies;
  }

  private _generateRiskRecommendations(actionRisks: ActionRiskAssessment[], overall: { level: string; score: number }): string[] {
    const recommendations: string[] = [];

    const critical = actionRisks.filter((r) => r.riskLevel === 'critical').length;
    const high = actionRisks.filter((r) => r.riskLevel === 'high').length;

    if (overall.score > 0.85) {
      recommendations.push('🚨 CRITICAL RISK: This decision requires executive approval and careful execution');
    } else if (overall.score > 0.7) {
      recommendations.push('⚠️ HIGH RISK: Multiple mitigation strategies recommended before execution');
    }

    if (critical > 0) {
      recommendations.push(`${critical} critical-risk action(s) detected - review carefully`);
    }

    if (high > 0) {
      recommendations.push(`${high} high-risk action(s) - apply mitigation strategies`);
    }

    return recommendations;
  }

  private async _recordRiskAnalysis(analysisId: string, analysis: DecisionRiskAnalysis): Promise<void> {
    try {
      const client = await this.pgPool.connect();

      try {
        await client.query(
          `INSERT INTO decision_risk_analyses
          (analysis_id, risk_level, risk_score, required_approval, analysis_details, timestamp)
          VALUES ($1, $2, $3, $4, $5, NOW())`,
          [
            analysisId,
            analysis.overallRiskLevel,
            analysis.overallRiskScore,
            analysis.decisionSafety.requiresApproval,
            JSON.stringify(analysis),
          ],
        );
      } finally {
        client.release();
      }
    } catch (error) {
      this.logger.warn('Failed to record risk analysis', {
        error: error instanceof Error ? error.message : 'unknown',
      });
    }
  }
}
