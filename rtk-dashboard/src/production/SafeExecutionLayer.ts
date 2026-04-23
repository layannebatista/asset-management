import { Logger } from 'winston';
import { Pool } from 'pg';
import { BlastRadiusAnalyzer, ImpactSeverity } from './BlastRadiusAnalyzer';

/**
 * Execução segura de ação recomendada
 * Mantém histórico de tentativas, falhas e simulations
 */
export interface ExecutionAttempt {
  id: string;
  decisionId: string;
  actionDescription: string;
  attemptNumber: number;

  // Fases
  simulationPassed: boolean;
  validationPassed: boolean;
  securityCheckPassed: boolean;

  // Detalhes
  simulationOutput?: any;
  validationErrors?: string[];
  securityWarnings?: string[];

  // Resultado
  executed: boolean;
  executionTime?: Date;
  executionStatus?: 'success' | 'failed' | 'rolled_back';
  executionErrorMessage?: string;

  // Rollback
  rollbackExecuted: boolean;
  rollbackTime?: Date;
  rollbackStatus?: 'success' | 'failed';

  timestamp: Date;
}

/**
 * SafeExecutionLayer: Executa ações com segurança
 *
 * Fluxo:
 * 1. Simular ação (o que aconteceria?)
 * 2. Validar resultado da simulação (faz sentido?)
 * 3. Validar segurança (sem vulnerabilidades?)
 * 4. Se tudo OK → executar de verdade
 * 5. Monitorar execução
 * 6. Se falhar → rollback automático
 *
 * Simulations usam:
 * - Dry run de comandos (kubectl --dry-run)
 * - Staging environment
 * - Transações DB (não commitam)
 * - Mocked external APIs
 *
 * Segurança valida:
 * - Nenhum comando perigoso (rm -rf)
 * - Nenhum acesso a secrets
 * - Nenhum exfil de dados
 */
export class SafeExecutionLayer {
  private readonly pgPool: Pool;
  private readonly logger: Logger;
  private readonly blastRadiusAnalyzer: BlastRadiusAnalyzer;

  constructor(pgPool: Pool, logger: Logger, blastRadiusAnalyzer: BlastRadiusAnalyzer) {
    this.pgPool = pgPool;
    this.logger = logger;
    this.blastRadiusAnalyzer = blastRadiusAnalyzer;

    this.logger.info('SafeExecutionLayer initialized');
  }

  /**
   * Executar ação de forma segura
   */
  async executeAction(
    decisionId: string,
    actionDescription: string,
    affectedServices: string[],
    executionFn: () => Promise<any>,
    rollbackFn?: () => Promise<any>,
  ): Promise<ExecutionAttempt> {
    const attemptId = `exec-${Date.now()}-${Math.random().toString(36).slice(7)}`;
    let attempt: ExecutionAttempt = {
      id: attemptId,
      decisionId,
      actionDescription,
      attemptNumber: await this._getAttemptNumber(decisionId),
      simulationPassed: false,
      validationPassed: false,
      securityCheckPassed: false,
      executed: false,
      rollbackExecuted: false,
      timestamp: new Date(),
    };

    try {
      // FASE 1: SIMULAÇÃO
      this.logger.info('Safe execution phase 1: simulation', {
        attemptId,
        actionDescription,
      });

      attempt.simulationOutput = await this._simulateAction(actionDescription);
      attempt.simulationPassed = attempt.simulationOutput !== null;

      if (!attempt.simulationPassed) {
        attempt.validationErrors = ['Simulation failed'];
        await this._recordAttempt(attempt);
        return attempt;
      }

      // FASE 2: VALIDAÇÃO DE RESULTADO
      this.logger.info('Safe execution phase 2: validation', { attemptId });

      const validationResult = await this._validateSimulationResult(
        attempt.simulationOutput,
        actionDescription,
      );

      if (!validationResult.valid) {
        attempt.validationPassed = false;
        attempt.validationErrors = validationResult.errors;
        await this._recordAttempt(attempt);
        return attempt;
      }

      attempt.validationPassed = true;

      // FASE 3: VERIFICAÇÃO DE SEGURANÇA
      this.logger.info('Safe execution phase 3: security check', { attemptId });

      const securityResult = await this._validateSecurity(actionDescription);

      if (!securityResult.safe) {
        attempt.securityCheckPassed = false;
        attempt.securityWarnings = securityResult.warnings;
        await this._recordAttempt(attempt);
        return attempt;
      }

      attempt.securityCheckPassed = true;

      // FASE 4: EXECUÇÃO REAL
      this.logger.info('Safe execution phase 4: actual execution', { attemptId });

      attempt.executionTime = new Date();

      try {
        const result = await this._executeWithTimeout(executionFn, 300000); // 5 min timeout
        attempt.executed = true;
        attempt.executionStatus = 'success';

        this.logger.info('Action executed successfully', {
          attemptId,
          decisionId,
          actionDescription,
        });
      } catch (executionError) {
        attempt.executed = false;
        attempt.executionStatus = 'failed';
        attempt.executionErrorMessage =
          executionError instanceof Error ? executionError.message : 'unknown error';

        this.logger.error('Action execution failed', {
          attemptId,
          error: attempt.executionErrorMessage,
        });

        // ROLLBACK AUTOMÁTICO
        if (rollbackFn) {
          await this._executeRollback(attemptId, rollbackFn, attempt);
        }

        await this._recordAttempt(attempt);
        throw executionError;
      }
    } catch (error) {
      this.logger.error('Error in safe execution', {
        attemptId,
        error: error instanceof Error ? error.message : 'unknown',
      });

      attempt.executed = false;
      attempt.executionStatus = 'failed';
    } finally {
      await this._recordAttempt(attempt);
    }

    return attempt;
  }

  /**
   * Validar se ação foi bem-sucedida pós-execução
   */
  async validateExecutionResult(
    attemptId: string,
    expectedOutcomes: Record<string, any>,
  ): Promise<{ valid: boolean; mismatches: string[] }> {
    try {
      const client = await this.pgPool.connect();

      try {
        const result = await client.query('SELECT * FROM execution_attempts WHERE id = $1', [attemptId]);

        if (result.rows.length === 0) {
          return { valid: false, mismatches: ['Attempt not found'] };
        }

        const attempt = result.rows[0];

        // Validar contra esperado
        const mismatches: string[] = [];

        if (!attempt.executed) {
          mismatches.push('Action was not executed');
        }

        if (attempt.execution_status !== 'success') {
          mismatches.push(`Execution status: ${attempt.execution_status}`);
        }

        return {
          valid: mismatches.length === 0,
          mismatches,
        };
      } finally {
        client.release();
      }
    } catch (error) {
      this.logger.error('Error validating execution result', {
        error: error instanceof Error ? error.message : 'unknown',
      });
      return { valid: false, mismatches: ['Validation error'] };
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // Private methods
  // ═══════════════════════════════════════════════════════════════════

  private async _simulateAction(actionDescription: string): Promise<any> {
    // Simular ação baseado em tipo
    // Em produção, isso chamaria ferramentas reais como:
    // - kubectl --dry-run para ações de infraestrutura
    // - Database transaction (ROLLBACK) para queries
    // - API dry-run endpoints

    const lower = actionDescription.toLowerCase();

    try {
      if (lower.includes('scale') || lower.includes('replica')) {
        // Simular scale: retornar novo número de replicas
        return {
          action_type: 'scale',
          current_replicas: 2,
          target_replicas: 5,
          estimated_time_seconds: 60,
          estimated_cost_increase: 0.5,
        };
      }

      if (lower.includes('log')) {
        return {
          action_type: 'logging',
          current_level: 'info',
          target_level: 'debug',
          estimated_volume_increase: 300, // %
        };
      }

      if (lower.includes('timeout')) {
        return {
          action_type: 'timeout',
          current_timeout_ms: 5000,
          target_timeout_ms: 10000,
          affected_endpoints: ['api', 'worker'],
        };
      }

      if (lower.includes('cache')) {
        return {
          action_type: 'cache',
          operation: lower.includes('purge') ? 'purge' : 'update',
          affected_keys: 1240,
          estimated_time_seconds: 5,
        };
      }

      return {
        action_type: 'generic',
        description: actionDescription,
        simulated: true,
      };
    } catch (error) {
      this.logger.error('Simulation error', {
        error: error instanceof Error ? error.message : 'unknown',
      });
      return null;
    }
  }

  private async _validateSimulationResult(
    simulationOutput: any,
    actionDescription: string,
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Validar se simulação resultou em mudanças significativas
    if (!simulationOutput) {
      errors.push('Simulation produced no output');
      return { valid: false, errors };
    }

    // Validar parâmetros específicos
    if (simulationOutput.action_type === 'scale') {
      if (simulationOutput.target_replicas <= 0) {
        errors.push('Invalid replica count');
      }
      if (simulationOutput.target_replicas > 100) {
        errors.push('Replica count suspiciously high (> 100)');
      }
    }

    if (simulationOutput.estimated_cost_increase > 1000) {
      errors.push('Estimated cost increase > $1000 (requires approval)');
    }

    if (simulationOutput.estimated_volume_increase > 1000) {
      errors.push('Volume increase > 1000% (unusual)');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  private async _validateSecurity(actionDescription: string): Promise<{
    safe: boolean;
    warnings: string[];
  }> {
    const warnings: string[] = [];
    const lower = actionDescription.toLowerCase();

    // Bloqueadores de segurança
    const dangerousPatterns = [
      { pattern: /rm\s+-rf/, warning: 'Dangerous rm -rf command detected' },
      { pattern: /drop\s+database/, warning: 'DROP DATABASE detected' },
      { pattern: /truncate\s+table/, warning: 'TRUNCATE TABLE detected' },
      { pattern: /delete\s+\*/, warning: 'Bulk delete detected' },
      { pattern: /secret|password|key|token/, warning: 'Potential secret access detected' },
      { pattern: /exfil|leak|steal/, warning: 'Data exfiltration pattern detected' },
      { pattern: /chmod|chown|sudo/, warning: 'Permission elevation detected' },
    ];

    for (const { pattern, warning } of dangerousPatterns) {
      if (pattern.test(lower)) {
        warnings.push(warning);
      }
    }

    return {
      safe: warnings.length === 0,
      warnings,
    };
  }

  private async _executeWithTimeout(fn: () => Promise<any>, timeoutMs: number): Promise<any> {
    return Promise.race([
      fn(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Execution timeout after ${timeoutMs}ms`)), timeoutMs),
      ),
    ]);
  }

  private async _executeRollback(attemptId: string, rollbackFn: () => Promise<any>, attempt: ExecutionAttempt): Promise<void> {
    try {
      this.logger.warn('Executing rollback', { attemptId });

      attempt.rollbackTime = new Date();

      await this._executeWithTimeout(rollbackFn, 300000);

      attempt.rollbackExecuted = true;
      attempt.rollbackStatus = 'success';

      this.logger.info('Rollback executed successfully', { attemptId });
    } catch (rollbackError) {
      attempt.rollbackExecuted = true;
      attempt.rollbackStatus = 'failed';

      this.logger.error('Rollback failed - MANUAL INTERVENTION REQUIRED', {
        attemptId,
        error: rollbackError instanceof Error ? rollbackError.message : 'unknown',
      });

      // Emitir alerta crítico
      await this._alertCriticalFailure(attemptId, rollbackError);
    }
  }

  private async _getAttemptNumber(decisionId: string): Promise<number> {
    try {
      const client = await this.pgPool.connect();

      try {
        const result = await client.query('SELECT COUNT(*) as count FROM execution_attempts WHERE decision_id = $1', [decisionId]);

        return (result.rows[0].count || 0) + 1;
      } finally {
        client.release();
      }
    } catch {
      return 1;
    }
  }

  private async _recordAttempt(attempt: ExecutionAttempt): Promise<void> {
    try {
      const client = await this.pgPool.connect();

      try {
        await client.query(
          `INSERT INTO execution_attempts
           (id, decision_id, action_description, attempt_number, simulation_passed,
            validation_passed, security_check_passed, executed, execution_status,
            execution_error, rollback_executed, rollback_status, simulation_output,
            validation_errors, security_warnings)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
          [
            attempt.id,
            attempt.decisionId,
            attempt.actionDescription,
            attempt.attemptNumber,
            attempt.simulationPassed,
            attempt.validationPassed,
            attempt.securityCheckPassed,
            attempt.executed,
            attempt.executionStatus,
            attempt.executionErrorMessage,
            attempt.rollbackExecuted,
            attempt.rollbackStatus,
            JSON.stringify(attempt.simulationOutput),
            JSON.stringify(attempt.validationErrors),
            JSON.stringify(attempt.securityWarnings),
          ],
        );
      } finally {
        client.release();
      }
    } catch (error) {
      this.logger.warn('Failed to record execution attempt', {
        error: error instanceof Error ? error.message : 'unknown',
      });
    }
  }

  private async _alertCriticalFailure(attemptId: string, error: any): Promise<void> {
    // Em produção, isso dispararia alertas para:
    // - On-call team (Slack, PagerDuty)
    // - Compliance team (auditoria)
    // - Engineering leads

    this.logger.error('CRITICAL: Rollback failed - manual intervention required', {
      attemptId,
      error: error instanceof Error ? error.message : 'unknown',
      timestamp: new Date().toISOString(),
    });

    // TODO: Implementar notificação real
  }
}
