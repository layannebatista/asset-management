import { Logger } from 'winston';
import { Pool } from 'pg';
import { Redis } from 'ioredis';

/**
 * Plano de Rollback para ação
 * Cada ação que modifica estado deve ter rollback
 */
export interface RollbackPlan {
  id: string;
  decisionId: string;
  actionDescription: string;

  // Plano de reversão
  rollbackSteps: RollbackStep[];
  totalEstimatedTimeMinutes: number;

  // Validação pós-rollback
  verificationSteps: VerificationStep[];

  // Controle
  canAutoRollback: boolean;
  requiresApprovalForRollback: boolean;
  rollbackTimeoutMinutes: number;

  // Metadados
  createdAt: Date;
  createdBy: string;
}

export interface RollbackStep {
  order: number;
  description: string;
  command?: string;                 // kubectl, SQL, etc.
  expectedDuration: number;         // segundos
  isDangerous: boolean;
  requiresVerification: boolean;
  verificationCheck?: string;
  rollbackCommand?: string;         // Comando para reverter o próprio step
  parallel?: boolean;               // Pode rodar em paralelo com outros?
}

export interface VerificationStep {
  description: string;
  query: string;                    // SQL ou endpoint
  expectedResult: any;
  timeoutSeconds: number;
}

export interface RollbackExecution {
  id: string;
  decisionId: string;
  rollbackPlanId: string;
  initiatedBy: string;
  initiatedAt: Date;

  // Progresso
  stepsCompleted: number;
  stepsFailed: number;
  totalSteps: number;

  // Resultado
  status: 'in_progress' | 'completed' | 'failed' | 'manual_intervention_required';
  completedAt?: Date;
  totalDurationMinutes?: number;

  // Detalhes
  stepResults: { step: number; success: boolean; output?: any; error?: string }[];
  verificationResults: { step: string; passed: boolean; actual?: any; expected?: any }[];

  // Escalação
  requiresManualIntervention: boolean;
  manualInterventionReason?: string;

  timestamp: Date;
}

/**
 * RollbackManager: Gerencia planos e execução de rollback
 *
 * Responsabilidades:
 * 1. Gerar planos de rollback antes da execução
 * 2. Validar que plano é seguro (não causa mais dano)
 * 3. Executar rollback se ação falha
 * 4. Verificar que rollback funcionou
 * 5. Alertar se rollback falha
 *
 * Estratégia:
 * - Toda ação = múltiplos passos reversíveis
 * - Cada passo tem comando de rollback
 * - Rollback roda em paralelo quando seguro
 * - Verifica estado pós-rollback
 * - Se falhar, escala para on-call team
 */
export class RollbackManager {
  private readonly pgPool: Pool;
  private readonly redis: Redis;
  private readonly logger: Logger;

  constructor(pgPool: Pool, redis: Redis, logger: Logger) {
    this.pgPool = pgPool;
    this.redis = redis;
    this.logger = logger;

    this.logger.info('RollbackManager initialized');
  }

  /**
   * Gerar plano de rollback para ação
   */
  async generateRollbackPlan(
    decisionId: string,
    actionDescription: string,
    affectedServices: string[],
    userId: string,
  ): Promise<RollbackPlan> {
    try {
      const planId = `rollback-${Date.now()}-${Math.random().toString(36).slice(7)}`;
      const steps = this._generateRollbackSteps(actionDescription, affectedServices);
      const verification = this._generateVerificationSteps(actionDescription, affectedServices);

      const totalTime = steps.reduce((sum, step) => sum + step.expectedDuration, 0);

      const plan: RollbackPlan = {
        id: planId,
        decisionId,
        actionDescription,
        rollbackSteps: steps,
        totalEstimatedTimeMinutes: Math.ceil(totalTime / 60),
        verificationSteps: verification,
        canAutoRollback: this._assessIfCanAutoRollback(steps),
        requiresApprovalForRollback: this._needsApprovalForRollback(steps),
        rollbackTimeoutMinutes: Math.ceil(totalTime / 60) + 5, // 5 min buffer
        createdAt: new Date(),
        createdBy: userId,
      };

      // Salvar plano
      await this._savePlan(plan);

      this.logger.info('Rollback plan generated', {
        planId,
        decisionId,
        steps: steps.length,
        totalTime: plan.totalEstimatedTimeMinutes,
        canAutoRollback: plan.canAutoRollback,
      });

      return plan;
    } catch (error) {
      this.logger.error('Error generating rollback plan', {
        error: error instanceof Error ? error.message : 'unknown',
      });
      throw error;
    }
  }

  /**
   * Executar rollback
   */
  async executeRollback(
    decisionId: string,
    rollbackPlanId: string,
    initiatedBy: string,
    reason: string,
  ): Promise<RollbackExecution> {
    const executionId = `rollback-exec-${Date.now()}-${Math.random().toString(36).slice(7)}`;

    let execution: RollbackExecution = {
      id: executionId,
      decisionId,
      rollbackPlanId,
      initiatedBy,
      initiatedAt: new Date(),
      stepsCompleted: 0,
      stepsFailed: 0,
      totalSteps: 0,
      status: 'in_progress',
      stepResults: [],
      verificationResults: [],
      requiresManualIntervention: false,
      timestamp: new Date(),
    };

    try {
      this.logger.warn('Rollback initiated', {
        executionId,
        decisionId,
        reason,
        initiatedBy,
      });

      // Carregar plano
      const plan = await this._loadPlan(rollbackPlanId);
      if (!plan) {
        throw new Error(`Rollback plan ${rollbackPlanId} not found`);
      }

      execution.totalSteps = plan.rollbackSteps.length;

      // Executar steps
      const startTime = Date.now();

      for (const step of plan.rollbackSteps) {
        try {
          this.logger.info('Executing rollback step', {
            executionId,
            step: step.order,
            description: step.description,
          });

          // Executar o step (simular ou real)
          const result = await this._executeStep(step);

          execution.stepResults.push({
            step: step.order,
            success: result.success,
            output: result.output,
            error: result.error,
          });

          if (result.success) {
            execution.stepsCompleted++;
          } else {
            execution.stepsFailed++;

            // Se step é crítico, parar
            if (!step.rollbackCommand) {
              execution.status = 'failed';
              execution.requiresManualIntervention = true;
              execution.manualInterventionReason = `Step ${step.order} failed and no recovery available`;
              break;
            }
          }
        } catch (stepError) {
          this.logger.error('Rollback step failed', {
            executionId,
            step: step.order,
            error: stepError instanceof Error ? stepError.message : 'unknown',
          });

          execution.stepResults.push({
            step: step.order,
            success: false,
            error: stepError instanceof Error ? stepError.message : 'unknown',
          });

          execution.stepsFailed++;
        }
      }

      // Verificar se rollback funcionou
      if (execution.stepsFailed === 0) {
        this.logger.info('Rollback steps completed, running verification', { executionId });

        for (const verification of plan.verificationSteps) {
          const result = await this._runVerification(verification);

          execution.verificationResults.push({
            step: verification.description,
            passed: result.passed,
            actual: result.actual,
            expected: verification.expectedResult,
          });

          if (!result.passed) {
            execution.requiresManualIntervention = true;
            execution.manualInterventionReason = `Verification failed: ${verification.description}`;
          }
        }
      }

      // Finalizar
      const duration = Date.now() - startTime;
      execution.totalDurationMinutes = Math.round(duration / 60000);
      execution.completedAt = new Date();

      if (execution.requiresManualIntervention) {
        execution.status = 'manual_intervention_required';
        await this._alertManualIntervention(execution);
      } else if (execution.stepsFailed === 0) {
        execution.status = 'completed';
      } else {
        execution.status = 'failed';
      }

      await this._saveExecution(execution);

      this.logger.info('Rollback execution completed', {
        executionId,
        status: execution.status,
        duration: execution.totalDurationMinutes,
        stepsCompleted: execution.stepsCompleted,
        stepsFailed: execution.stepsFailed,
      });

      return execution;
    } catch (error) {
      execution.status = 'failed';
      execution.requiresManualIntervention = true;
      execution.manualInterventionReason =
        error instanceof Error ? error.message : 'Unknown error during rollback';

      await this._saveExecution(execution);
      await this._alertManualIntervention(execution);

      this.logger.error('Rollback execution error', {
        executionId,
        error: error instanceof Error ? error.message : 'unknown',
      });

      throw error;
    }
  }

  /**
   * Obter histórico de rollbacks
   */
  async getRollbackHistory(decisionId: string): Promise<RollbackExecution[]> {
    const client = await this.pgPool.connect();

    try {
      const result = await client.query(
        `SELECT * FROM rollback_executions WHERE decision_id = $1 ORDER BY timestamp DESC`,
        [decisionId],
      );

      return result.rows.map((row) => ({
        id: row.id,
        decisionId: row.decision_id,
        rollbackPlanId: row.rollback_plan_id,
        initiatedBy: row.initiated_by,
        initiatedAt: new Date(row.initiated_at),
        stepsCompleted: row.steps_completed,
        stepsFailed: row.steps_failed,
        totalSteps: row.total_steps,
        status: row.status,
        completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
        totalDurationMinutes: row.total_duration_minutes,
        stepResults: row.step_results || [],
        verificationResults: row.verification_results || [],
        requiresManualIntervention: row.requires_manual_intervention,
        manualInterventionReason: row.manual_intervention_reason,
        timestamp: new Date(row.timestamp),
      }));
    } finally {
      client.release();
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // Private methods
  // ═══════════════════════════════════════════════════════════════════

  private _generateRollbackSteps(actionDescription: string, affectedServices: string[]): RollbackStep[] {
    const steps: RollbackStep[] = [];
    const lower = actionDescription.toLowerCase();

    if (lower.includes('scale')) {
      steps.push({
        order: 1,
        description: 'Scale down replicas to original count',
        command: 'kubectl scale deployment api --replicas=2',
        expectedDuration: 30,
        isDangerous: false,
        requiresVerification: true,
        verificationCheck: 'kubectl get replicas',
      });
    }

    if (lower.includes('timeout')) {
      steps.push({
        order: 1,
        description: 'Revert timeout to original value',
        command: 'UPDATE config SET timeout = 5000 WHERE name = "api_timeout"',
        expectedDuration: 5,
        isDangerous: false,
        requiresVerification: true,
      });
    }

    if (lower.includes('cache')) {
      steps.push({
        order: 1,
        description: 'Warm cache with previous values',
        command: 'redis RESTORE from backup',
        expectedDuration: 10,
        isDangerous: false,
        requiresVerification: true,
      });
    }

    // Padrão genérico: reverter última mudança
    if (steps.length === 0) {
      steps.push({
        order: 1,
        description: `Revert ${actionDescription}`,
        expectedDuration: 15,
        isDangerous: false,
        requiresVerification: true,
      });
    }

    // Sempre finalize com validação
    steps.push({
      order: steps.length + 1,
      description: 'Validate system health',
      expectedDuration: 10,
      isDangerous: false,
      requiresVerification: true,
    });

    return steps;
  }

  private _generateVerificationSteps(
    actionDescription: string,
    affectedServices: string[],
  ): VerificationStep[] {
    return [
      {
        description: 'Check service health',
        query: 'GET /health',
        expectedResult: { status: 'up' },
        timeoutSeconds: 30,
      },
      {
        description: 'Verify no error spike',
        query: 'SELECT error_rate FROM metrics WHERE timestamp > now() - interval 1 minute',
        expectedResult: { error_rate: { $lt: 0.05 } }, // < 5% error rate
        timeoutSeconds: 30,
      },
      {
        description: 'Check data consistency',
        query: 'SELECT COUNT(*) FROM data_validation',
        expectedResult: { count: { $gt: 0 } },
        timeoutSeconds: 60,
      },
    ];
  }

  private _assessIfCanAutoRollback(steps: RollbackStep[]): boolean {
    // Pode auto-rollback se:
    // 1. Nenhum step é "dangerous"
    // 2. Todos têm rollback commands ou verificações
    // 3. Tempo total < 5 minutos

    const totalTime = steps.reduce((sum, step) => sum + step.expectedDuration, 0);

    if (totalTime > 300) return false; // > 5 minutos = requer approval

    return !steps.some((step) => step.isDangerous);
  }

  private _needsApprovalForRollback(steps: RollbackStep[]): boolean {
    // Precisa aprovação se:
    // 1. Qualquer step é dangerous
    // 2. Tempo > 10 minutos
    // 3. Sem verificação pós-rollback

    const hasVerifications = steps.some((step) => step.requiresVerification);
    const totalTime = steps.reduce((sum, step) => sum + step.expectedDuration, 0);

    return steps.some((step) => step.isDangerous) || totalTime > 600 || !hasVerifications;
  }

  private async _executeStep(step: RollbackStep): Promise<{ success: boolean; output?: any; error?: string }> {
    // Em produção, isso executaria:
    // - kubectl commands
    // - SQL queries
    // - API calls
    // - Etc.

    try {
      // Simular execução
      await new Promise((resolve) => setTimeout(resolve, step.expectedDuration * 1000));

      return {
        success: true,
        output: { executed: true, duration: step.expectedDuration },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'unknown error',
      };
    }
  }

  private async _runVerification(
    step: VerificationStep,
  ): Promise<{ passed: boolean; actual?: any }> {
    try {
      // Simular verificação
      return {
        passed: true,
        actual: step.expectedResult,
      };
    } catch (error) {
      return {
        passed: false,
        actual: { error: error instanceof Error ? error.message : 'unknown' },
      };
    }
  }

  private async _savePlan(plan: RollbackPlan): Promise<void> {
    const client = await this.pgPool.connect();

    try {
      await client.query(
        `INSERT INTO rollback_plans
         (id, decision_id, action_description, rollback_steps, verification_steps,
          can_auto_rollback, requires_approval, total_time_minutes, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          plan.id,
          plan.decisionId,
          plan.actionDescription,
          JSON.stringify(plan.rollbackSteps),
          JSON.stringify(plan.verificationSteps),
          plan.canAutoRollback,
          plan.requiresApprovalForRollback,
          plan.totalEstimatedTimeMinutes,
          plan.createdBy,
        ],
      );
    } finally {
      client.release();
    }
  }

  private async _loadPlan(planId: string): Promise<RollbackPlan | null> {
    const client = await this.pgPool.connect();

    try {
      const result = await client.query('SELECT * FROM rollback_plans WHERE id = $1', [planId]);

      if (result.rows.length === 0) return null;

      const row = result.rows[0];
      return {
        id: row.id,
        decisionId: row.decision_id,
        actionDescription: row.action_description,
        rollbackSteps: row.rollback_steps,
        totalEstimatedTimeMinutes: row.total_time_minutes,
        verificationSteps: row.verification_steps,
        canAutoRollback: row.can_auto_rollback,
        requiresApprovalForRollback: row.requires_approval,
        rollbackTimeoutMinutes: row.total_time_minutes + 5,
        createdAt: new Date(row.created_at),
        createdBy: row.created_by,
      };
    } finally {
      client.release();
    }
  }

  private async _saveExecution(execution: RollbackExecution): Promise<void> {
    const client = await this.pgPool.connect();

    try {
      await client.query(
        `INSERT INTO rollback_executions
         (id, decision_id, rollback_plan_id, initiated_by, status, steps_completed,
          steps_failed, total_steps, step_results, verification_results,
          requires_manual_intervention, manual_intervention_reason, total_duration_minutes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          execution.id,
          execution.decisionId,
          execution.rollbackPlanId,
          execution.initiatedBy,
          execution.status,
          execution.stepsCompleted,
          execution.stepsFailed,
          execution.totalSteps,
          JSON.stringify(execution.stepResults),
          JSON.stringify(execution.verificationResults),
          execution.requiresManualIntervention,
          execution.manualInterventionReason,
          execution.totalDurationMinutes,
        ],
      );
    } finally {
      client.release();
    }
  }

  private async _alertManualIntervention(execution: RollbackExecution): Promise<void> {
    this.logger.error('CRITICAL: Manual intervention required for rollback', {
      executionId: execution.id,
      decisionId: execution.decisionId,
      reason: execution.manualInterventionReason,
      stepsCompleted: execution.stepsCompleted,
      stepsFailed: execution.stepsFailed,
    });

    // TODO: Enviar alerta para on-call team (PagerDuty, Slack, etc)
  }
}
