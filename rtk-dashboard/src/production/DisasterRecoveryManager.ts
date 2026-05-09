import { Logger } from 'winston';
import { Redis } from 'ioredis';
import { Pool } from 'pg';

export interface DisasterRecoveryPlan {
  name: string;
  trigger: 'database_down' | 'redis_down' | 'llm_api_down' | 'all_services_down';
  fallbackStrategy: 'cache' | 'queue' | 'local_model' | 'read_only';
  recoveryScript: string;
  estimatedRecoveryMinutes: number;
  rtoMinutes: number; // Recovery Time Objective
  rpoMinutes: number; // Recovery Point Objective
}

export interface RecoveryStatus {
  plan: string;
  status: 'active' | 'recovering' | 'recovered' | 'degraded';
  startTime: Date;
  elapsedMinutes: number;
  progress: number; // 0-100
  nextCheck: Date;
}

/**
 * DisasterRecoveryManager: Lidar com falhas críticas
 *
 * Scenarios:
 * 1. Database down → Use Redis cache, queue writes
 * 2. Redis down → Degrade to simple cache, use memory
 * 3. LLM API down → Use local fallback model
 * 4. All services down → Read-only mode
 */
export class DisasterRecoveryManager {
  private readonly redis: Redis;
  private readonly pgPool: Pool;
  private readonly logger: Logger;

  private recoveryPlans: Map<string, DisasterRecoveryPlan> = new Map();
  private activeRecoveries: Set<string> = new Set();
  private healthChecks: Map<string, Date> = new Map();

  constructor(redis: Redis, pgPool: Pool, logger: Logger) {
    this.redis = redis;
    this.pgPool = pgPool;
    this.logger = logger;
    this._initializeRecoveryPlans();
  }

  /**
   * Iniciar verificação de saúde periódica
   */
  startHealthChecks(intervalSeconds: number = 30): void {
    setInterval(async () => {
      await this._performHealthCheck();
    }, intervalSeconds * 1000);

    this.logger.info('Health checks started', {
      interval: intervalSeconds + 's',
    });
  }

  /**
   * Executar plano de recuperação
   */
  async executeRecoveryPlan(planName: string): Promise<boolean> {
    const plan = this.recoveryPlans.get(planName);

    if (!plan) {
      this.logger.error('Recovery plan not found', { planName });
      return false;
    }

    if (this.activeRecoveries.has(planName)) {
      this.logger.warn('Recovery plan already active', { planName });
      return false;
    }

    this.activeRecoveries.add(planName);

    this.logger.error(`🚨 DISASTER RECOVERY INITIATED: ${planName}`, {
      trigger: plan.trigger,
      fallback: plan.fallbackStrategy,
      eta: plan.estimatedRecoveryMinutes + ' minutes',
    });

    try {
      // Ativar fallback strategy
      await this._activateFallback(plan.fallbackStrategy);

      // Executar recovery script
      const recovered = await this._executeRecoveryScript(plan);

      if (recovered) {
        this.logger.info(`✅ Recovery successful: ${planName}`, {
          duration: plan.estimatedRecoveryMinutes + ' minutes',
        });

        this.activeRecoveries.delete(planName);
        return true;
      } else {
        this.logger.error(`❌ Recovery failed: ${planName}`, {
          fallbackActive: true,
          manualInterventionRequired: true,
        });

        // Manter em modo fallback até recuperação manual
        return false;
      }
    } catch (error) {
      this.logger.error('Recovery execution error', {
        plan: planName,
        error: error instanceof Error ? error.message : 'unknown',
      });

      return false;
    }
  }

  /**
   * Obter status de recuperação
   */
  async getRecoveryStatus(planName?: string): Promise<RecoveryStatus | RecoveryStatus[]> {
    if (planName) {
      return this._getIndividualStatus(planName);
    }

    const statuses: RecoveryStatus[] = [];

    for (const [name] of this.recoveryPlans) {
      statuses.push(await this._getIndividualStatus(name));
    }

    return statuses;
  }

  /**
   * Obter RTO/RPO (recovery objectives)
   */
  getRecoveryObjectives(): Array<{
    service: string;
    rtoMinutes: number; // máximo tempo de downtime aceitável
    rpoMinutes: number; // máximo de dados que pode ser perdido
  }> {
    return Array.from(this.recoveryPlans.values()).map((plan) => ({
      service: plan.trigger,
      rtoMinutes: plan.rtoMinutes,
      rpoMinutes: plan.rpoMinutes,
    }));
  }

  // ════════════════════════════════════════════════════════════════
  // Private methods
  // ════════════════════════════════════════════════════════════════

  private _initializeRecoveryPlans(): void {
    // Plan 1: Database Down
    this.recoveryPlans.set('database_failover', {
      name: 'Database Failover',
      trigger: 'database_down',
      fallbackStrategy: 'cache',
      recoveryScript: 'scripts/db_failover.sh',
      estimatedRecoveryMinutes: 5,
      rtoMinutes: 15, // Máx 15 min de downtime
      rpoMinutes: 5, // Máx 5 min de dados perdidos
    });

    // Plan 2: Redis Down
    this.recoveryPlans.set('redis_failover', {
      name: 'Redis Failover',
      trigger: 'redis_down',
      fallbackStrategy: 'queue',
      recoveryScript: 'scripts/redis_failover.sh',
      estimatedRecoveryMinutes: 2,
      rtoMinutes: 10,
      rpoMinutes: 2,
    });

    // Plan 3: LLM API Down
    this.recoveryPlans.set('llm_fallback', {
      name: 'LLM API Fallback',
      trigger: 'llm_api_down',
      fallbackStrategy: 'local_model',
      recoveryScript: 'scripts/llm_fallback.sh',
      estimatedRecoveryMinutes: 1,
      rtoMinutes: 5,
      rpoMinutes: 1,
    });

    // Plan 4: All Services Down
    this.recoveryPlans.set('full_failover', {
      name: 'Full Service Failover',
      trigger: 'all_services_down',
      fallbackStrategy: 'read_only',
      recoveryScript: 'scripts/full_failover.sh',
      estimatedRecoveryMinutes: 10,
      rtoMinutes: 60,
      rpoMinutes: 30,
    });
  }

  private async _performHealthCheck(): Promise<void> {
    const checks = [
      { name: 'database', check: () => this._checkDatabase() },
      { name: 'redis', check: () => this._checkRedis() },
      { name: 'llm_api', check: () => this._checkLLMAPI() },
    ];

    for (const { name, check } of checks) {
      try {
        const healthy = await check();

        if (!healthy) {
          this.logger.error(`⚠️ Health check failed: ${name}`);

          // Determinar qual plano de recuperação executar
          if (name === 'database') {
            await this.executeRecoveryPlan('database_failover');
          } else if (name === 'redis') {
            await this.executeRecoveryPlan('redis_failover');
          } else if (name === 'llm_api') {
            await this.executeRecoveryPlan('llm_fallback');
          }
        } else {
          this.healthChecks.set(name, new Date());
        }
      } catch (error) {
        this.logger.warn(`Health check error: ${name}`, {
          error: error instanceof Error ? error.message : 'unknown',
        });
      }
    }
  }

  private async _checkDatabase(): Promise<boolean> {
    try {
      const client = await this.pgPool.connect();

      try {
        await client.query('SELECT 1');
        return true;
      } finally {
        client.release();
      }
    } catch {
      return false;
    }
  }

  private async _checkRedis(): Promise<boolean> {
    try {
      await this.redis.ping();
      return true;
    } catch {
      return false;
    }
  }

  private async _checkLLMAPI(): Promise<boolean> {
    // Verificar último sucesso de chamada a LLM (armazenado em Redis)
    try {
      const lastSuccess = await this.redis.get('llm_api:last_success');

      if (!lastSuccess) {
        return false; // Nunca funcionou
      }

      const lastSuccessTime = parseInt(lastSuccess);
      const ageMinutes = (Date.now() - lastSuccessTime) / 60000;

      return ageMinutes < 5; // Se falhou há > 5 min, considerar down
    } catch {
      return false;
    }
  }

  private async _activateFallback(strategy: string): Promise<void> {
    this.logger.info(`Activating fallback strategy: ${strategy}`);

    switch (strategy) {
      case 'cache':
        await this.redis.hset(
          'system_state',
          'mode',
          'cache_fallback',
        );
        break;

      case 'queue':
        await this.redis.hset('system_state', 'mode', 'queue_fallback');
        break;

      case 'local_model':
        await this.redis.hset('system_state', 'mode', 'local_model');
        break;

      case 'read_only':
        await this.redis.hset('system_state', 'mode', 'read_only');
        break;
    }
  }

  private async _executeRecoveryScript(plan: DisasterRecoveryPlan): Promise<boolean> {
    // Em produção, executar script real
    // Por enquanto, simular sucesso após delay
    this.logger.info(`Executing recovery script: ${plan.recoveryScript}`);

    // Simular: aguardar tempo estimado
    await new Promise((resolve) =>
      setTimeout(resolve, plan.estimatedRecoveryMinutes * 60 * 1000),
    );

    // Verificar saúde após "recuperação"
    const healthy = await this._checkDatabase();

    return healthy;
  }

  private async _getIndividualStatus(planName: string): Promise<RecoveryStatus> {
    const isActive = this.activeRecoveries.has(planName);
    const lastCheck = this.healthChecks.get(planName.split('_')[0]);

    let status: 'active' | 'recovering' | 'recovered' | 'degraded' = 'recovered';

    if (isActive) {
      status = 'recovering';
    } else if (!lastCheck || Date.now() - lastCheck.getTime() > 60000) {
      status = 'degraded';
    }

    const plan = this.recoveryPlans.get(planName);
    const startTime = new Date(Date.now() - 5 * 60000); // Simulate 5 min ago
    const elapsedMinutes = Math.floor((Date.now() - startTime.getTime()) / 60000);
    const progress = isActive
      ? Math.min(100, (elapsedMinutes / (plan?.estimatedRecoveryMinutes || 10)) * 100)
      : 100;

    return {
      plan: planName,
      status,
      startTime,
      elapsedMinutes,
      progress,
      nextCheck: new Date(Date.now() + 30 * 1000),
    };
  }
}
