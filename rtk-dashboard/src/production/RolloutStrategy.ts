import { Logger } from 'winston';
import { Redis } from 'ioredis';

export enum RolloutPhase {
  CANARY = 'canary',          // 5% traffic
  EARLY_ADOPTERS = 'early',  // 25% traffic
  GRADUAL = 'gradual',       // 50% traffic
  FULL = 'full',             // 100% traffic
}

export interface RolloutConfig {
  phase: RolloutPhase;
  trafficPercent: number; // 0-100
  maxErrorRate: number; // 0-1, rollback if exceeded
  maxLatencyMs: number; // p99 threshold
  minDurationMinutes: number; // min time in this phase
  targetDatetime: Date;
  rollbackOnError: boolean;
  rollbackThreshold: number;
}

export interface RolloutMetrics {
  phase: RolloutPhase;
  trafficPercent: number;
  errorRate: number;
  p99Latency: number;
  userCount: number;
  startTime: Date;
  elapsedMinutes: number;
  status: 'in_progress' | 'completed' | 'rolled_back';
}

/**
 * RolloutStrategy: Deployment seguro com rollback automático
 *
 * Estratégia:
 * 1. CANARY: 5% traffic, monitor for 30 min
 * 2. EARLY: 25% traffic, monitor for 1 hour
 * 3. GRADUAL: 50% traffic, monitor for 2 hours
 * 4. FULL: 100% traffic
 *
 * Rollback automático se:
 * - Error rate > threshold
 * - P99 latency > threshold
 * - Usuários reclamam
 */
export class RolloutStrategy {
  private readonly redis: Redis;
  private readonly logger: Logger;

  private currentPhase: RolloutPhase = RolloutPhase.CANARY;
  private phaseStartTime: Date = new Date();
  private metricsHistory: RolloutMetrics[] = [];

  constructor(redis: Redis, logger: Logger) {
    this.redis = redis;
    this.logger = logger;
  }

  /**
   * Iniciar rollout em fase CANARY
   */
  async startCanaryDeployment(config: RolloutConfig): Promise<void> {
    this.currentPhase = RolloutPhase.CANARY;
    this.phaseStartTime = new Date();

    await this.redis.hset('rollout_config', 'phase', 'canary');
    await this.redis.hset('rollout_config', 'traffic_percent', '5');
    await this.redis.hset('rollout_config', 'status', 'in_progress');

    this.logger.info('🚀 Canary deployment started', {
      phase: 'canary',
      traffic: '5%',
      minDuration: config.minDurationMinutes + ' minutes',
      errorThreshold: (config.maxErrorRate * 100).toFixed(1) + '%',
      latencyThreshold: config.maxLatencyMs + 'ms',
    });
  }

  /**
   * Promover para próxima fase após validação
   */
  async promotePhase(): Promise<boolean> {
    const metrics = await this._getCurrentMetrics();

    if (!metrics) {
      this.logger.warn('Cannot promote: no metrics available');
      return false;
    }

    // Validar saúde antes de promover
    if (!this._isHealthy(metrics)) {
      this.logger.error('❌ Phase promotion blocked: metrics unhealthy', {
        phase: this.currentPhase,
        errorRate: (metrics.errorRate * 100).toFixed(2) + '%',
        p99: metrics.p99Latency + 'ms',
      });

      return false;
    }

    // Determinar próxima fase
    let nextPhase: RolloutPhase;

    switch (this.currentPhase) {
      case RolloutPhase.CANARY:
        nextPhase = RolloutPhase.EARLY_ADOPTERS;
        break;
      case RolloutPhase.EARLY_ADOPTERS:
        nextPhase = RolloutPhase.GRADUAL;
        break;
      case RolloutPhase.GRADUAL:
        nextPhase = RolloutPhase.FULL;
        break;
      default:
        this.logger.info('✅ Rollout complete: at full traffic');
        return true;
    }

    const trafficPercent = this._getTrafficPercent(nextPhase);

    await this.redis.hset('rollout_config', 'phase', nextPhase);
    await this.redis.hset('rollout_config', 'traffic_percent', trafficPercent.toString());

    this.currentPhase = nextPhase;
    this.phaseStartTime = new Date();

    this.logger.info(`✅ Promoted to ${nextPhase} phase`, {
      newPhase: nextPhase,
      trafficPercent: trafficPercent + '%',
      previousMetrics: metrics,
    });

    return true;
  }

  /**
   * Rollback automático se métricas degradarem
   */
  async checkAndRollback(): Promise<boolean> {
    const metrics = await this._getCurrentMetrics();

    if (!metrics) {
      return false;
    }

    if (this._isHealthy(metrics)) {
      return false; // Sem problemas, não fazer rollback
    }

    // Problema detectado: fazer rollback
    await this._performRollback(metrics);
    return true;
  }

  /**
   * Obter status atual do rollout
   */
  async getStatus(): Promise<{
    phase: RolloutPhase;
    traffic: number;
    metrics: RolloutMetrics | null;
    health: 'healthy' | 'warning' | 'critical';
  }> {
    const metrics = await this._getCurrentMetrics();

    const health = this._assessHealth(metrics);

    return {
      phase: this.currentPhase,
      traffic: this._getTrafficPercent(this.currentPhase),
      metrics,
      health,
    };
  }

  /**
   * Relatório de progresso do rollout
   */
  getProgressReport(): {
    phase: RolloutPhase;
    elapsedMinutes: number;
    completionPercent: number;
    nextPhase: RolloutPhase | null;
    eta: Date | null;
  } {
    const elapsedMinutes = Math.floor(
      (Date.now() - this.phaseStartTime.getTime()) / 60000,
    );

    const phaseMinutesRequired = this._getPhaseMinutesRequired(this.currentPhase);

    const completionPercent = Math.min(
      100,
      Math.floor((elapsedMinutes / phaseMinutesRequired) * 100),
    );

    const nextPhase = this._getNextPhase();

    let eta = null;

    if (nextPhase) {
      const remainingMinutes = Math.max(0, phaseMinutesRequired - elapsedMinutes);
      eta = new Date(Date.now() + remainingMinutes * 60000);
    }

    return {
      phase: this.currentPhase,
      elapsedMinutes,
      completionPercent,
      nextPhase,
      eta,
    };
  }

  // ════════════════════════════════════════════════════════════════
  // Private methods
  // ════════════════════════════════════════════════════════════════

  private async _getCurrentMetrics(): Promise<RolloutMetrics | null> {
    try {
      const phase = await this.redis.hget('rollout_config', 'phase');
      const traffic = await this.redis.hget('rollout_config', 'traffic_percent');
      const errorRate = await this.redis.hget('rollout_metrics', 'error_rate');
      const p99Latency = await this.redis.hget('rollout_metrics', 'p99_latency');
      const userCount = await this.redis.hget('rollout_metrics', 'user_count');

      if (!phase || !traffic || !errorRate || !p99Latency || !userCount) {
        return null;
      }

      return {
        phase: phase as RolloutPhase,
        trafficPercent: parseInt(traffic),
        errorRate: parseFloat(errorRate),
        p99Latency: parseInt(p99Latency),
        userCount: parseInt(userCount),
        startTime: this.phaseStartTime,
        elapsedMinutes: Math.floor(
          (Date.now() - this.phaseStartTime.getTime()) / 60000,
        ),
        status: 'in_progress',
      };
    } catch (error) {
      return null;
    }
  }

  private _isHealthy(metrics: RolloutMetrics): boolean {
    // Thresholds por fase
    const errorThreshold = 0.02; // 2%
    const latencyThreshold = 5000; // 5s p99

    return (
      metrics.errorRate <= errorThreshold &&
      metrics.p99Latency <= latencyThreshold
    );
  }

  private _assessHealth(
    metrics: RolloutMetrics | null,
  ): 'healthy' | 'warning' | 'critical' {
    if (!metrics) return 'warning';

    if (metrics.errorRate > 0.05 || metrics.p99Latency > 6000) {
      return 'critical';
    }

    if (metrics.errorRate > 0.02 || metrics.p99Latency > 5000) {
      return 'warning';
    }

    return 'healthy';
  }

  private _getTrafficPercent(phase: RolloutPhase): number {
    switch (phase) {
      case RolloutPhase.CANARY:
        return 5;
      case RolloutPhase.EARLY_ADOPTERS:
        return 25;
      case RolloutPhase.GRADUAL:
        return 50;
      case RolloutPhase.FULL:
        return 100;
    }
  }

  private _getPhaseMinutesRequired(phase: RolloutPhase): number {
    switch (phase) {
      case RolloutPhase.CANARY:
        return 30;
      case RolloutPhase.EARLY_ADOPTERS:
        return 60;
      case RolloutPhase.GRADUAL:
        return 120;
      case RolloutPhase.FULL:
        return 0; // Ongoing
    }
  }

  private _getNextPhase(): RolloutPhase | null {
    switch (this.currentPhase) {
      case RolloutPhase.CANARY:
        return RolloutPhase.EARLY_ADOPTERS;
      case RolloutPhase.EARLY_ADOPTERS:
        return RolloutPhase.GRADUAL;
      case RolloutPhase.GRADUAL:
        return RolloutPhase.FULL;
      case RolloutPhase.FULL:
        return null;
    }
  }

  private async _performRollback(metrics: RolloutMetrics): Promise<void> {
    this.logger.error('🔄 ROLLBACK INITIATED', {
      reason: 'Metrics unhealthy',
      errorRate: (metrics.errorRate * 100).toFixed(2) + '%',
      p99Latency: metrics.p99Latency + 'ms',
      affectedUsers: metrics.userCount,
    });

    // Voltar para fase anterior (ou canary se crítico)
    const rollbackPhase =
      this.currentPhase === RolloutPhase.FULL
        ? RolloutPhase.GRADUAL
        : RolloutPhase.CANARY;

    await this.redis.hset('rollout_config', 'phase', rollbackPhase);
    await this.redis.hset(
      'rollout_config',
      'traffic_percent',
      this._getTrafficPercent(rollbackPhase).toString(),
    );
    await this.redis.hset('rollout_config', 'status', 'rolled_back');

    this.currentPhase = rollbackPhase;
    this.phaseStartTime = new Date();

    this.logger.info('✅ Rollback completed', {
      rolledBackTo: rollbackPhase,
      traffic: this._getTrafficPercent(rollbackPhase) + '%',
    });
  }
}
