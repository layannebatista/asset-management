import { Logger } from 'winston';
import { Pool } from 'pg';
import { Redis } from 'ioredis';
import { AnalysisType } from '../types/analysis.types';

/**
 * Níveis de Autonomia — controla quanta decisão é tomada sem aprovação
 */
export enum AutonomyLevel {
  MANUAL = 'manual',                    // Tudo requer aprovação explícita
  SEMI_AUTONOMOUS = 'semi_autonomous',  // Baixo risco (score >= 0.8) automático
  FULL_AUTONOMOUS = 'full_autonomous',  // Prod controlada, auto-executa se seguro
}

/**
 * Contexto onde política é aplicada
 */
export enum AutonomyContext {
  DEV = 'dev',
  STAGING = 'staging',
  PRODUCTION = 'production',
}

/**
 * Política de Autonomia para tipo de análise + criticidade + contexto
 */
export interface AutonomyPolicy {
  id: string;
  analysisType: AnalysisType;
  criticality: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
  context: AutonomyContext;
  autonomyLevel: AutonomyLevel;

  // Thresholds para auto-execution
  minQualityScore: number;              // Default: 0.75
  maxRiskLevel: string;                 // 'low', 'medium', 'high' (crítico sempre requer)
  maxApprovalWaitTime: number;          // minutes

  // Rate limiting
  maxExecutionsPerHour: number;
  maxCostPerHour: number;               // USD
  maxReexecutionsPerDecision: number;

  // Escalação
  requiresApprovalFor: string[];        // tipos de ações que precisam aprovação
  approvalLevel: 'manager' | 'director' | 'executive';

  // Experiência
  allowShadowMode: boolean;
  allowRollback: boolean;

  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

/**
 * Aplicação da Política em tempo real
 */
export interface PolicyApplication {
  policyId: string;
  decisionId: string;
  analysisType: AnalysisType;
  criticality: string;
  context: AutonomyContext;

  // Decisão
  autonomyLevelAllowed: AutonomyLevel;
  canAutoExecute: boolean;
  requiresApproval: boolean;
  approvalLevel?: string;

  // Razões
  blockedBecause: string[];             // [qualidade baixa, risco alto, ...]
  warnings: string[];

  timestamp: Date;
}

/**
 * AutonomyPolicyEngine: Controla quando/como o sistema pode agir autonomamente
 *
 * Funciona como guardrail:
 * 1. Define política por análise type + criticality + environment
 * 2. Avalia se decisão pode ser executada autonomamente
 * 3. Bloqueia ações perigosas
 * 4. Escala para aprovação quando necessário
 *
 * Exemplo:
 * - observability HIGH em PROD → SEMI_AUTONOMOUS (calcula risco antes)
 * - incident CRITICAL em PROD → MANUAL (sempre requer diretor)
 * - test LOW em DEV → FULL_AUTONOMOUS (qualquer coisa automática)
 */
export class AutonomyPolicyEngine {
  private readonly pgPool: Pool;
  private readonly redis: Redis;
  private readonly logger: Logger;
  private readonly policyCache = new Map<string, AutonomyPolicy>();
  private readonly executionTracker = new Map<string, { count: number; cost: number; timestamp: Date }>();

  constructor(pgPool: Pool, redis: Redis, logger: Logger) {
    this.pgPool = pgPool;
    this.redis = redis;
    this.logger = logger;

    this.logger.info('AutonomyPolicyEngine initialized');
  }

  /**
   * Registrar ou atualizar política de autonomia
   */
  async upsertPolicy(policy: AutonomyPolicy, userId: string): Promise<void> {
    try {
      const client = await this.pgPool.connect();

      try {
        // Validar política
        this._validatePolicy(policy);

        const existingPolicy = await client.query(
          `SELECT id FROM autonomy_policies
           WHERE analysis_type = $1 AND criticality = $2 AND context = $3`,
          [policy.analysisType, policy.criticality, policy.context],
        );

        if (existingPolicy.rows.length > 0) {
          // Update
          await client.query(
            `UPDATE autonomy_policies
             SET autonomy_level = $1, min_quality_score = $2, max_risk_level = $3,
                 max_executions_per_hour = $4, max_cost_per_hour = $5,
                 requires_approval_for = $6, approval_level = $7,
                 allow_shadow_mode = $8, allow_rollback = $9,
                 updated_at = NOW(), updated_by = $10
             WHERE analysis_type = $1 AND criticality = $2 AND context = $3`,
            [
              policy.autonomyLevel,
              policy.minQualityScore,
              policy.maxRiskLevel,
              policy.maxExecutionsPerHour,
              policy.maxCostPerHour,
              JSON.stringify(policy.requiresApprovalFor),
              policy.approvalLevel,
              policy.allowShadowMode,
              policy.allowRollback,
              userId,
            ],
          );
        } else {
          // Insert
          await client.query(
            `INSERT INTO autonomy_policies
             (analysis_type, criticality, context, autonomy_level, min_quality_score,
              max_risk_level, max_executions_per_hour, max_cost_per_hour,
              requires_approval_for, approval_level, allow_shadow_mode, allow_rollback,
              created_by, updated_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $13)`,
            [
              policy.analysisType,
              policy.criticality,
              policy.context,
              policy.autonomyLevel,
              policy.minQualityScore,
              policy.maxRiskLevel,
              policy.maxExecutionsPerHour,
              policy.maxCostPerHour,
              JSON.stringify(policy.requiresApprovalFor),
              policy.approvalLevel,
              policy.allowShadowMode,
              policy.allowRollback,
              userId,
            ],
          );
        }

        // Invalidate cache
        this.policyCache.delete(`${policy.analysisType}:${policy.criticality}:${policy.context}`);

        this.logger.info('Autonomy policy upserted', {
          analysisType: policy.analysisType,
          criticality: policy.criticality,
          context: policy.context,
          autonomyLevel: policy.autonomyLevel,
          updatedBy: userId,
        });
      } finally {
        client.release();
      }
    } catch (error) {
      this.logger.error('Error upserting autonomy policy', {
        error: error instanceof Error ? error.message : 'unknown',
      });
      throw error;
    }
  }

  /**
   * Avaliar se decisão pode ser executada autonomamente
   */
  async evaluateAutonomy(
    analysisType: AnalysisType,
    criticality: string,
    context: AutonomyContext,
    decisionMetrics: {
      qualityScore: number;
      riskLevel: string;
      estimatedCost: number;
      executionCount: number;
      actionType?: string;
    },
  ): Promise<PolicyApplication> {
    try {
      const policy = await this._getOrLoadPolicy(analysisType, criticality, context);

      if (!policy) {
        // Sem política = default conservador (manual)
        return {
          policyId: 'default-policy',
          decisionId: '',
          analysisType,
          criticality,
          context,
          autonomyLevelAllowed: AutonomyLevel.MANUAL,
          canAutoExecute: false,
          requiresApproval: true,
          approvalLevel: 'manager',
          blockedBecause: ['No policy defined for this combination'],
          warnings: [],
          timestamp: new Date(),
        };
      }

      const blockedBecause: string[] = [];
      const warnings: string[] = [];

      // 1. Validar qualidade
      if (decisionMetrics.qualityScore < policy.minQualityScore) {
        blockedBecause.push(`Quality score ${decisionMetrics.qualityScore} < ${policy.minQualityScore}`);
      }

      // 2. Validar risco
      const riskLevels = ['low', 'medium', 'high', 'critical'];
      const maxRiskIndex = riskLevels.indexOf(policy.maxRiskLevel);
      const currentRiskIndex = riskLevels.indexOf(decisionMetrics.riskLevel);

      if (currentRiskIndex > maxRiskIndex) {
        blockedBecause.push(`Risk level ${decisionMetrics.riskLevel} exceeds ${policy.maxRiskLevel}`);
      }

      // 3. Validar rate limiting
      const hourlyTracker = this.executionTracker.get(`${analysisType}:${context}`);
      if (hourlyTracker && hourlyTracker.timestamp.getTime() > Date.now() - 3600000) {
        if (hourlyTracker.count >= policy.maxExecutionsPerHour) {
          blockedBecause.push(`Execution limit ${policy.maxExecutionsPerHour}/hour exceeded`);
        }
        if (hourlyTracker.cost + decisionMetrics.estimatedCost > policy.maxCostPerHour) {
          blockedBecause.push(
            `Cost limit $${policy.maxCostPerHour}/hour exceeded (current: $${hourlyTracker.cost})`,
          );
        }
      }

      // 4. Validar reexecuções
      if (decisionMetrics.executionCount > policy.maxReexecutionsPerDecision) {
        blockedBecause.push(
          `Reexecution limit ${policy.maxReexecutionsPerDecision} exceeded (${decisionMetrics.executionCount})`,
        );
      }

      // 5. Verificar ação específica
      if (decisionMetrics.actionType && policy.requiresApprovalFor.includes(decisionMetrics.actionType)) {
        warnings.push(`Action type "${decisionMetrics.actionType}" requires approval`);
      }

      // Decidir se pode executar
      const canAutoExecute = blockedBecause.length === 0;

      // Determinar nível de autonomia permitido
      let autonomyLevelAllowed = policy.autonomyLevel;
      if (blockedBecause.length > 0) {
        autonomyLevelAllowed = AutonomyLevel.MANUAL;
      } else if (policy.autonomyLevel === AutonomyLevel.FULL_AUTONOMOUS) {
        // Em FULL_AUTONOMOUS, ainda pode degradar para SEMI se qualidade está em zona cinzenta
        if (decisionMetrics.qualityScore < 0.85) {
          autonomyLevelAllowed = AutonomyLevel.SEMI_AUTONOMOUS;
        }
      }

      const application: PolicyApplication = {
        policyId: policy.id,
        decisionId: '',
        analysisType,
        criticality,
        context,
        autonomyLevelAllowed,
        canAutoExecute,
        requiresApproval: !canAutoExecute || autonomyLevelAllowed === AutonomyLevel.MANUAL,
        approvalLevel: policy.approvalLevel,
        blockedBecause,
        warnings,
        timestamp: new Date(),
      };

      this.logger.debug('Autonomy evaluation', {
        analysisType,
        criticality,
        context,
        autonomyLevelAllowed,
        canAutoExecute,
        blockedBecause: blockedBecause.length,
      });

      return application;
    } catch (error) {
      this.logger.error('Error evaluating autonomy', {
        error: error instanceof Error ? error.message : 'unknown',
      });
      throw error;
    }
  }

  /**
   * Registrar execução para rate limiting
   */
  async recordExecution(
    analysisType: AnalysisType,
    context: AutonomyContext,
    cost: number,
  ): Promise<void> {
    const key = `${analysisType}:${context}`;
    const tracker = this.executionTracker.get(key);

    if (tracker && tracker.timestamp.getTime() > Date.now() - 3600000) {
      tracker.count++;
      tracker.cost += cost;
    } else {
      this.executionTracker.set(key, {
        count: 1,
        cost,
        timestamp: new Date(),
      });
    }
  }

  /**
   * Obter todas as políticas
   */
  async getAllPolicies(): Promise<AutonomyPolicy[]> {
    const client = await this.pgPool.connect();

    try {
      const result = await client.query('SELECT * FROM autonomy_policies ORDER BY context, analysis_type');

      return result.rows.map((row) => ({
        id: row.id,
        analysisType: row.analysis_type,
        criticality: row.criticality,
        context: row.context,
        autonomyLevel: row.autonomy_level,
        minQualityScore: row.min_quality_score,
        maxRiskLevel: row.max_risk_level,
        maxExecutionsPerHour: row.max_executions_per_hour,
        maxCostPerHour: row.max_cost_per_hour,
        maxReexecutionsPerDecision: row.max_reexecutions_per_decision,
        requiresApprovalFor: row.requires_approval_for || [],
        approvalLevel: row.approval_level,
        allowShadowMode: row.allow_shadow_mode,
        allowRollback: row.allow_rollback,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        createdBy: row.created_by,
      }));
    } finally {
      client.release();
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // Private methods
  // ═══════════════════════════════════════════════════════════════════

  private async _getOrLoadPolicy(
    analysisType: AnalysisType,
    criticality: string,
    context: AutonomyContext,
  ): Promise<AutonomyPolicy | null> {
    const cacheKey = `${analysisType}:${criticality}:${context}`;

    if (this.policyCache.has(cacheKey)) {
      return this.policyCache.get(cacheKey) || null;
    }

    const client = await this.pgPool.connect();

    try {
      const result = await client.query(
        `SELECT * FROM autonomy_policies
         WHERE analysis_type = $1 AND criticality = $2 AND context = $3`,
        [analysisType, criticality, context],
      );

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      const policy: AutonomyPolicy = {
        id: row.id,
        analysisType: row.analysis_type,
        criticality: row.criticality,
        context: row.context,
        autonomyLevel: row.autonomy_level,
        minQualityScore: row.min_quality_score,
        maxRiskLevel: row.max_risk_level,
        maxExecutionsPerHour: row.max_executions_per_hour,
        maxCostPerHour: row.max_cost_per_hour,
        maxReexecutionsPerDecision: row.max_reexecutions_per_decision,
        requiresApprovalFor: row.requires_approval_for || [],
        approvalLevel: row.approval_level,
        allowShadowMode: row.allow_shadow_mode,
        allowRollback: row.allow_rollback,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        createdBy: row.created_by,
      };

      this.policyCache.set(cacheKey, policy);
      return policy;
    } finally {
      client.release();
    }
  }

  private _validatePolicy(policy: AutonomyPolicy): void {
    if (policy.minQualityScore < 0 || policy.minQualityScore > 1) {
      throw new Error('minQualityScore must be between 0 and 1');
    }

    if (!['low', 'medium', 'high'].includes(policy.maxRiskLevel)) {
      throw new Error('maxRiskLevel must be low, medium, or high');
    }

    if (policy.maxExecutionsPerHour <= 0) {
      throw new Error('maxExecutionsPerHour must be > 0');
    }

    if (policy.maxCostPerHour <= 0) {
      throw new Error('maxCostPerHour must be > 0');
    }

    if (policy.maxReexecutionsPerDecision <= 0) {
      throw new Error('maxReexecutionsPerDecision must be > 0');
    }
  }
}
