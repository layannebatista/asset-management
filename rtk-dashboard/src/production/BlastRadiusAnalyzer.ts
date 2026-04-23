import { Logger } from 'winston';
import { Pool } from 'pg';

/**
 * Impacto potencial de uma ação
 */
export enum ImpactSeverity {
  NEGLIGIBLE = 'negligible',  // Usuário isolado, rollback imediato
  LOW = 'low',                // Alguns usuários, impacto < 1h
  MEDIUM = 'medium',          // Múltiplos serviços, impacto 1-4h
  HIGH = 'high',              // Sistema crítico, impacto > 4h
  CRITICAL = 'critical',      // Infraestrutura central, data loss, compliance
}

/**
 * Análise de Blast Radius — por que? Para evitar decisões autonomas que quebram produção
 *
 * Exemplo de ações diferentes:
 * 1. "Aumentar log level" → NEGLIGIBLE (rollback imediato, sem estado)
 * 2. "Escalar replicas" → LOW (serviço escala, sem risco data)
 * 3. "Ajustar timeout" → MEDIUM (conexões podem falhar)
 * 4. "Dropar índice temporário" → HIGH (query performance cai)
 * 5. "Deletar dados de backup" → CRITICAL (impossível reverter)
 *
 * Cada ação tem impacto, reversibilidade e "affected parties"
 */
export interface BlastRadiusAssessment {
  actionId: string;
  actionDescription: string;
  severity: ImpactSeverity;

  // Estimativa de usuários/sistemas afetados
  estimatedAffectedUsers: number;
  estimatedAffectedServices: string[];
  estimatedAffectedDataRecords: number;

  // Reversibilidade
  isReversible: boolean;
  reversibilityScore: number;          // 0-1 (1 = completamente reversível)
  reversalTimeEstimateMinutes: number;

  // Limite de execução
  canExecuteAutonomously: boolean;
  requiresApprovalLevel: 'manager' | 'director' | 'executive';

  // Risco específico
  hasDataLoss: boolean;
  hasComplianceRisk: boolean;          // LGPD, SOC2, etc.
  hasSecurityRisk: boolean;
  hasCostImpact: boolean;
  estimatedCostImpact: number;         // USD

  // Recomendações
  recommendations: string[];
  emergencyContact?: string;

  timestamp: Date;
}

/**
 * BlastRadiusAnalyzer: Calcula impacto de ações antes de executar
 *
 * Responsabilidades:
 * 1. Estimar usuários/sistemas afetados
 * 2. Avaliar reversibilidade
 * 3. Detectar ações perigosas (data loss, compliance)
 * 4. Bloquear ações irreversíveis sem aprovação
 * 5. Prover alternatives mais seguras
 *
 * Estratégia: Knowledge base de "known actions" + contexto de produção
 */
export class BlastRadiusAnalyzer {
  private readonly pgPool: Pool;
  private readonly logger: Logger;

  // Knowledge base de ações conhecidas
  private readonly knownActions = new Map<string, Partial<BlastRadiusAssessment>>();

  constructor(pgPool: Pool, logger: Logger) {
    this.pgPool = pgPool;
    this.logger = logger;

    this._initializeKnownActions();
    this.logger.info('BlastRadiusAnalyzer initialized');
  }

  /**
   * Analisar impacto de ação recomendada
   */
  async analyzeAction(
    actionDescription: string,
    affectedServices: string[],
    isDataModifying: boolean,
    estimatedCost: number,
  ): Promise<BlastRadiusAssessment> {
    try {
      const actionId = `action-${Date.now()}-${Math.random().toString(36).slice(7)}`;

      // 1. Verificar knowledge base
      const knownAction = this._findSimilarAction(actionDescription);

      // 2. Estimar usuários afetados
      const affectedUsers = await this._estimateAffectedUsers(affectedServices);

      // 3. Estimar registros afetados
      const affectedRecords = isDataModifying ? await this._estimateAffectedRecords(affectedServices) : 0;

      // 4. Avaliar reversibilidade
      const reversibility = this._assessReversibility(
        actionDescription,
        isDataModifying,
        affectedServices,
      );

      // 5. Detectar riscos
      const hasDataLoss = isDataModifying && !reversibility.isReversible;
      const hasCompliance = this._detectComplianceRisk(actionDescription);
      const hasSecurity = this._detectSecurityRisk(actionDescription);

      // 6. Determinar severity
      const severity = this._calculateSeverity(
        affectedUsers,
        reversibility.reversibilityScore,
        hasDataLoss,
        affectedServices.length,
      );

      // 7. Determinar aprovação
      const { canAutoExecute, approvalLevel } = this._determineApprovalLevel(
        severity,
        hasDataLoss,
        hasCompliance,
        hasSecurity,
      );

      // 8. Gerar recomendações
      const recommendations = this._generateRecommendations(
        severity,
        reversibility,
        affectedServices,
        hasDataLoss,
      );

      const assessment: BlastRadiusAssessment = {
        actionId,
        actionDescription,
        severity,
        estimatedAffectedUsers: affectedUsers,
        estimatedAffectedServices: affectedServices,
        estimatedAffectedDataRecords: affectedRecords,
        isReversible: reversibility.isReversible,
        reversibilityScore: reversibility.reversibilityScore,
        reversalTimeEstimateMinutes: reversibility.reversalTimeMinutes,
        canExecuteAutonomously: canAutoExecute,
        requiresApprovalLevel: approvalLevel,
        hasDataLoss,
        hasComplianceRisk: hasCompliance,
        hasSecurityRisk: hasSecurity,
        hasCostImpact: estimatedCost > 100,
        estimatedCostImpact: estimatedCost,
        recommendations,
        timestamp: new Date(),
      };

      this.logger.info('Blast radius assessment', {
        actionId,
        severity,
        affectedUsers,
        affectedServices: affectedServices.length,
        canAutoExecute,
        approvalLevel,
      });

      // Registrar para auditoria
      await this._recordAssessment(assessment);

      return assessment;
    } catch (error) {
      this.logger.error('Error analyzing blast radius', {
        error: error instanceof Error ? error.message : 'unknown',
      });
      throw error;
    }
  }

  /**
   * Bloquear ação se impacto muito alto
   */
  shouldBlockExecution(assessment: BlastRadiusAssessment): { blocked: boolean; reason?: string } {
    // Sempre bloquear data loss sem reversibilidade
    if (assessment.hasDataLoss && !assessment.isReversible) {
      return {
        blocked: true,
        reason: 'Action causes irreversible data loss',
      };
    }

    // Bloquear ações críticas com compliance risk
    if (assessment.severity === ImpactSeverity.CRITICAL && assessment.hasComplianceRisk) {
      return {
        blocked: true,
        reason: 'Critical action with compliance risk requires explicit approval',
      };
    }

    // Bloquear ações críticas/high
    if ([ImpactSeverity.CRITICAL, ImpactSeverity.HIGH].includes(assessment.severity)) {
      if (!assessment.canExecuteAutonomously) {
        return {
          blocked: true,
          reason: `Severity ${assessment.severity} requires approval from ${assessment.requiresApprovalLevel}`,
        };
      }
    }

    return { blocked: false };
  }

  /**
   * Sugerir alternativas mais seguras
   */
  suggestAlternatives(assessment: BlastRadiusAssessment): string[] {
    const alternatives: string[] = [];

    if (assessment.severity === ImpactSeverity.CRITICAL) {
      alternatives.push('Execute in shadow mode first (parallel, no actual changes)');
      alternatives.push('Request explicit approval before proceeding');
      alternatives.push('Schedule execution during maintenance window');
    }

    if (assessment.hasDataLoss) {
      alternatives.push('Create backup before execution');
      alternatives.push('Execute on staging environment first');
      alternatives.push('Use gradual rollout (affect 5% initially)');
    }

    if (!assessment.isReversible) {
      alternatives.push('Implement comprehensive rollback plan');
      alternatives.push('Add monitoring/alerts for immediate detection');
      alternatives.push('Consider feature flag for quick disable');
    }

    if (assessment.hasComplianceRisk) {
      alternatives.push('Audit trail enabled for this action');
      alternatives.push('Compliance team notified');
    }

    return alternatives;
  }

  // ═══════════════════════════════════════════════════════════════════
  // Private methods
  // ═══════════════════════════════════════════════════════════════════

  private _initializeKnownActions(): void {
    // Ações conhecidas e seus perfis de risco
    this.knownActions.set('scale_replicas', {
      severity: ImpactSeverity.LOW,
      isReversible: true,
      reversibilityScore: 0.95,
    });

    this.knownActions.set('increase_log_level', {
      severity: ImpactSeverity.NEGLIGIBLE,
      isReversible: true,
      reversibilityScore: 1.0,
    });

    this.knownActions.set('adjust_timeout', {
      severity: ImpactSeverity.MEDIUM,
      isReversible: true,
      reversibilityScore: 0.9,
    });

    this.knownActions.set('drop_index', {
      severity: ImpactSeverity.HIGH,
      isReversible: true,
      reversibilityScore: 0.85,
    });

    this.knownActions.set('delete_data', {
      severity: ImpactSeverity.CRITICAL,
      isReversible: false,
      reversibilityScore: 0.0,
    });

    this.knownActions.set('enable_circuit_breaker', {
      severity: ImpactSeverity.LOW,
      isReversible: true,
      reversibilityScore: 1.0,
    });

    this.knownActions.set('purge_cache', {
      severity: ImpactSeverity.LOW,
      isReversible: true,
      reversibilityScore: 1.0,
    });

    this.knownActions.set('disable_feature', {
      severity: ImpactSeverity.MEDIUM,
      isReversible: true,
      reversibilityScore: 1.0,
    });

    this.knownActions.set('modify_security_group', {
      severity: ImpactSeverity.HIGH,
      isReversible: true,
      reversibilityScore: 0.95,
      hasSecurityRisk: true,
    });

    this.knownActions.set('export_user_data', {
      severity: ImpactSeverity.MEDIUM,
      hasComplianceRisk: true,
    });
  }

  private _findSimilarAction(
    description: string,
  ): Partial<BlastRadiusAssessment> | undefined {
    const lower = description.toLowerCase();

    for (const [key, action] of this.knownActions.entries()) {
      if (lower.includes(key.replace('_', ' '))) {
        return action;
      }
    }

    return undefined;
  }

  private async _estimateAffectedUsers(services: string[]): Promise<number> {
    try {
      const client = await this.pgPool.connect();

      try {
        const result = await client.query(
          `SELECT COALESCE(SUM(active_users), 0)::int as total
           FROM service_metrics
           WHERE service_name = ANY($1)`,
          [services],
        );

        return result.rows[0].total || 0;
      } finally {
        client.release();
      }
    } catch (error) {
      this.logger.warn('Could not estimate affected users', {
        error: error instanceof Error ? error.message : 'unknown',
      });
      return services.length * 100; // Conservative estimate
    }
  }

  private async _estimateAffectedRecords(services: string[]): Promise<number> {
    try {
      const client = await this.pgPool.connect();

      try {
        const result = await client.query(
          `SELECT COALESCE(SUM(record_count), 0)::bigint as total
           FROM service_databases
           WHERE service_name = ANY($1)`,
          [services],
        );

        return result.rows[0].total || 0;
      } finally {
        client.release();
      }
    } catch (error) {
      return 0;
    }
  }

  private _assessReversibility(
    actionDescription: string,
    isDataModifying: boolean,
    services: string[],
  ): { isReversible: boolean; reversibilityScore: number; reversalTimeMinutes: number } {
    const lower = actionDescription.toLowerCase();

    // Data-modifying operations are harder to reverse
    if (isDataModifying) {
      if (lower.includes('delete') || lower.includes('drop')) {
        return { isReversible: false, reversibilityScore: 0, reversalTimeMinutes: 1440 }; // Never reversible
      }

      if (lower.includes('modify') || lower.includes('update')) {
        return { isReversible: true, reversibilityScore: 0.7, reversalTimeMinutes: 30 };
      }
    }

    // Configuration changes are usually reversible
    if (lower.includes('config') || lower.includes('setting') || lower.includes('parameter')) {
      return { isReversible: true, reversibilityScore: 0.95, reversalTimeMinutes: 5 };
    }

    // Infrastructure changes
    if (lower.includes('scale') || lower.includes('replica')) {
      return { isReversible: true, reversibilityScore: 0.95, reversalTimeMinutes: 10 };
    }

    // Default: assume somewhat reversible
    return { isReversible: true, reversibilityScore: 0.8, reversalTimeMinutes: 15 };
  }

  private _detectComplianceRisk(actionDescription: string): boolean {
    const complianceKeywords = [
      'data',
      'export',
      'user',
      'customer',
      'personal',
      'lgpd',
      'gdpr',
      'pii',
      'delete',
      'sensitive',
    ];

    const lower = actionDescription.toLowerCase();
    return complianceKeywords.some((keyword) => lower.includes(keyword));
  }

  private _detectSecurityRisk(actionDescription: string): boolean {
    const securityKeywords = [
      'security',
      'auth',
      'token',
      'password',
      'encryption',
      'key',
      'credential',
      'permission',
      'access',
      'group',
    ];

    const lower = actionDescription.toLowerCase();
    return securityKeywords.some((keyword) => lower.includes(keyword));
  }

  private _calculateSeverity(
    affectedUsers: number,
    reversibilityScore: number,
    hasDataLoss: boolean,
    serviceCount: number,
  ): ImpactSeverity {
    // Data loss é sempre crítico
    if (hasDataLoss) {
      return ImpactSeverity.CRITICAL;
    }

    // Múltiplos serviços críticos = HIGH ou CRITICAL
    if (serviceCount >= 3) {
      if (affectedUsers > 10000 || reversibilityScore < 0.5) {
        return ImpactSeverity.CRITICAL;
      }
      return ImpactSeverity.HIGH;
    }

    // Muitos usuários = HIGH ou MEDIUM
    if (affectedUsers > 5000) {
      return ImpactSeverity.HIGH;
    }

    if (affectedUsers > 1000) {
      return ImpactSeverity.MEDIUM;
    }

    return reversibilityScore > 0.95 ? ImpactSeverity.LOW : ImpactSeverity.MEDIUM;
  }

  private _determineApprovalLevel(
    severity: ImpactSeverity,
    hasDataLoss: boolean,
    hasCompliance: boolean,
    hasSecurity: boolean,
  ): { canAutoExecute: boolean; approvalLevel: 'manager' | 'director' | 'executive' } {
    if (severity === ImpactSeverity.CRITICAL || hasDataLoss) {
      return { canAutoExecute: false, approvalLevel: 'executive' };
    }

    if (severity === ImpactSeverity.HIGH || hasCompliance || hasSecurity) {
      return { canAutoExecute: false, approvalLevel: 'director' };
    }

    if (severity === ImpactSeverity.MEDIUM) {
      return { canAutoExecute: false, approvalLevel: 'manager' };
    }

    return { canAutoExecute: true, approvalLevel: 'manager' };
  }

  private _generateRecommendations(
    severity: ImpactSeverity,
    reversibility: { isReversible: boolean; reversalTimeMinutes: number },
    services: string[],
    hasDataLoss: boolean,
  ): string[] {
    const recommendations: string[] = [];

    if (severity === ImpactSeverity.CRITICAL) {
      recommendations.push('Get approval from executive leadership before execution');
      recommendations.push('Execute during scheduled maintenance window');
      recommendations.push('Have rollback team standing by');
    }

    if (hasDataLoss) {
      recommendations.push('Create backup before execution');
      recommendations.push('Test rollback procedure in staging');
      recommendations.push('Enable enhanced monitoring during execution');
    }

    if (!reversibility.isReversible) {
      recommendations.push('This action cannot be automatically reversed');
      recommendations.push('Manual recovery will be required if issues occur');
    } else {
      recommendations.push(
        `Rollback estimated to take ${reversibility.reversalTimeMinutes} minutes`,
      );
    }

    if (services.length > 1) {
      recommendations.push(`Multiple services affected (${services.length}): ${services.join(', ')}`);
    }

    recommendations.push('Enable detailed logging for this execution');

    return recommendations;
  }

  private async _recordAssessment(assessment: BlastRadiusAssessment): Promise<void> {
    try {
      const client = await this.pgPool.connect();

      try {
        await client.query(
          `INSERT INTO blast_radius_assessments
           (action_id, action_description, severity, affected_users, affected_services,
            is_reversible, reversibility_score, can_execute_autonomously, has_data_loss,
            has_compliance_risk, has_security_risk, cost_impact, recommendations)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
          [
            assessment.actionId,
            assessment.actionDescription,
            assessment.severity,
            assessment.estimatedAffectedUsers,
            JSON.stringify(assessment.estimatedAffectedServices),
            assessment.isReversible,
            assessment.reversibilityScore,
            assessment.canExecuteAutonomously,
            assessment.hasDataLoss,
            assessment.hasComplianceRisk,
            assessment.hasSecurityRisk,
            assessment.estimatedCostImpact,
            JSON.stringify(assessment.recommendations),
          ],
        );
      } finally {
        client.release();
      }
    } catch (error) {
      this.logger.warn('Failed to record blast radius assessment', {
        error: error instanceof Error ? error.message : 'unknown',
      });
    }
  }
}
