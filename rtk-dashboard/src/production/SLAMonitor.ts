import { Logger } from 'winston';
import { Redis } from 'ioredis';
import { Pool } from 'pg';
import { AnalysisType } from '../types/analysis.types';

export interface SLATarget {
  metric: 'latency' | 'availability' | 'error_rate' | 'cost';
  p99?: number; // latency in ms
  p95?: number;
  p50?: number;
  uptime?: number; // 0-1 (99.5 = 0.995)
  errorRateMax?: number; // 0-1 (1% = 0.01)
  costPerAnalysis?: number; // USD
  window: 'minute' | 'hour' | 'day' | 'month';
}

export interface SLAViolation {
  metric: string;
  target: number;
  actual: number;
  severity: 'warning' | 'critical';
  timestamp: Date;
  duration: number; // milliseconds
  affectedAnalysisType?: AnalysisType;
}

export interface SLAStatus {
  metric: string;
  target: number;
  actual: number;
  compliance: number; // 0-1
  status: 'ok' | 'warning' | 'critical';
  trendMinutes: number[];
}

/**
 * SLAMonitor: Monitora SLAs e alerta sobre violações
 *
 * Targets padrão (configuráveis):
 * - Latency p99: < 5s (< 5000ms)
 * - Availability: 99.5% uptime
 * - Error rate: < 2%
 * - Cost: $0.054 per analysis
 */
export class SLAMonitor {
  private readonly redis: Redis;
  private readonly pgPool: Pool;
  private readonly logger: Logger;

  private slaTargets: Map<string, SLATarget> = new Map();
  private violationHistory: SLAViolation[] = [];

  constructor(redis: Redis, pgPool: Pool, logger: Logger) {
    this.redis = redis;
    this.pgPool = pgPool;
    this.logger = logger;
    this._initializeDefaults();
  }

  /**
   * Registrar métrica para verificação de SLA
   */
  async recordMetric(
    metric: 'latency' | 'availability' | 'error_rate' | 'cost',
    value: number,
    analysisType?: AnalysisType,
  ): Promise<void> {
    const key = `metric:${metric}:${new Date().getMinutes()}`;

    try {
      // Armazenar métrica em Redis (série temporal)
      await this.redis.lpush(key, value.toString());
      await this.redis.expire(key, 3600); // 1 hora

      // Também armazenar em PostgreSQL para histórico
      const client = await this.pgPool.connect();

      try {
        await client.query(
          `INSERT INTO sla_metrics (metric, value, analysis_type, timestamp)
          VALUES ($1, $2, $3, NOW())`,
          [metric, value, analysisType || null],
        );
      } finally {
        client.release();
      }

      // Verificar violação
      await this._checkViolation(metric, value, analysisType);
    } catch (error) {
      this.logger.warn('Failed to record metric', {
        metric,
        error: error instanceof Error ? error.message : 'unknown',
      });
    }
  }

  /**
   * Obter status atual de SLA
   */
  async getStatus(metric: string): Promise<SLAStatus | null> {
    const target = this.slaTargets.get(metric);

    if (!target) {
      return null;
    }

    // Obter últimas métricas (última hora)
    const key = `metric:${metric}:*`;
    const pattern = `metric:${metric}:`;

    try {
      // Simular: obter valores recentes
      const actualValue = await this._calculateActualMetric(metric);

      if (actualValue === null) {
        return null;
      }

      const targetValue = this._getTargetValue(target);

      // Calcular compliance (quanto perto do alvo)
      const compliance = this._calculateCompliance(
        metric,
        actualValue,
        targetValue,
      );

      // Determinar status
      let status: 'ok' | 'warning' | 'critical' = 'ok';

      if (compliance < 0.85) {
        status = 'critical';
      } else if (compliance < 0.95) {
        status = 'warning';
      }

      // Trend dos últimos minutos
      const trendMinutes = await this._getMetricTrend(metric, 10);

      return {
        metric,
        target: targetValue,
        actual: actualValue,
        compliance,
        status,
        trendMinutes,
      };
    } catch (error) {
      this.logger.warn('Failed to get SLA status', {
        metric,
        error: error instanceof Error ? error.message : 'unknown',
      });

      return null;
    }
  }

  /**
   * Obter todas as violações no período
   */
  async getViolations(
    startTime: Date,
    endTime: Date,
  ): Promise<SLAViolation[]> {
    const client = await this.pgPool.connect();

    try {
      const result = await client.query(
        `SELECT * FROM sla_violations
        WHERE timestamp BETWEEN $1 AND $2
        ORDER BY timestamp DESC`,
        [startTime, endTime],
      );

      return result.rows.map((row) => ({
        metric: row.metric,
        target: row.target,
        actual: row.actual,
        severity: row.severity,
        timestamp: new Date(row.timestamp),
        duration: row.duration,
        affectedAnalysisType: row.affected_analysis_type,
      }));
    } finally {
      client.release();
    }
  }

  /**
   * Gerar relatório de compliance do mês
   */
  async getMonthlyCompliance(): Promise<{
    latency: number; // 0-1
    availability: number;
    errorRate: number;
    cost: number;
    overall: number;
  }> {
    const client = await this.pgPool.connect();

    try {
      // Latency p99
      const latencyResult = await client.query(
        `SELECT PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY value) as p99
        FROM sla_metrics
        WHERE metric = 'latency'
        AND timestamp > NOW() - INTERVAL '30 days'`,
      );

      const p99Latency =
        latencyResult.rows[0]?.p99 || 5000;
      const latencyCompliance = Math.min(1.0, 5000 / Math.max(1, p99Latency));

      // Availability
      const availResult = await client.query(
        `SELECT 1.0 - (COUNT(CASE WHEN metric = 'availability' AND value = 0 THEN 1 END)::float / COUNT(*))
        as uptime
        FROM sla_metrics
        WHERE timestamp > NOW() - INTERVAL '30 days'`,
      );

      const availability = availResult.rows[0]?.uptime || 0.99;

      // Error rate
      const errResult = await client.query(
        `SELECT AVG(value) as error_rate
        FROM sla_metrics
        WHERE metric = 'error_rate'
        AND timestamp > NOW() - INTERVAL '30 days'`,
      );

      const errorRate = errResult.rows[0]?.error_rate || 0;
      const errorCompliance = Math.min(1.0, (1 - Math.min(0.02, errorRate)) / 0.98);

      // Cost
      const costResult = await client.query(
        `SELECT AVG(value) as avg_cost
        FROM sla_metrics
        WHERE metric = 'cost'
        AND timestamp > NOW() - INTERVAL '30 days'`,
      );

      const avgCost = costResult.rows[0]?.avg_cost || 0.054;
      const costCompliance = Math.min(1.0, 0.054 / Math.max(0.001, avgCost));

      const overall =
        (latencyCompliance + availability + errorCompliance + costCompliance) /
        4;

      return {
        latency: latencyCompliance,
        availability,
        errorRate: errorCompliance,
        cost: costCompliance,
        overall,
      };
    } finally {
      client.release();
    }
  }

  /**
   * Configurar SLA customizado
   */
  setSLATarget(metric: string, target: SLATarget): void {
    this.slaTargets.set(metric, target);

    this.logger.info('SLA target set', {
      metric,
      target,
    });
  }

  // ════════════════════════════════════════════════════════════════
  // Private methods
  // ════════════════════════════════════════════════════════════════

  private _initializeDefaults(): void {
    // Latency SLA: p99 < 5s
    this.slaTargets.set('latency_p99', {
      metric: 'latency',
      p99: 5000,
      window: 'minute',
    });

    // Availability: 99.5% uptime
    this.slaTargets.set('availability', {
      metric: 'availability',
      uptime: 0.995,
      window: 'day',
    });

    // Error rate: < 2%
    this.slaTargets.set('error_rate', {
      metric: 'error_rate',
      errorRateMax: 0.02,
      window: 'hour',
    });

    // Cost: $0.054 per analysis
    this.slaTargets.set('cost', {
      metric: 'cost',
      costPerAnalysis: 0.054,
      window: 'day',
    });
  }

  private async _checkViolation(
    metric: string,
    value: number,
    analysisType?: AnalysisType,
  ): Promise<void> {
    const target = this.slaTargets.get(metric);

    if (!target) {
      return;
    }

    const targetValue = this._getTargetValue(target);

    if (!this._isViolation(metric, value, targetValue)) {
      return;
    }

    // Registrar violação
    const violation: SLAViolation = {
      metric,
      target: targetValue,
      actual: value,
      severity: this._calculateSeverity(metric, value, targetValue),
      timestamp: new Date(),
      duration: 0,
      affectedAnalysisType: analysisType,
    };

    this.violationHistory.push(violation);

    // Armazenar em banco de dados
    const client = await this.pgPool.connect();

    try {
      await client.query(
        `INSERT INTO sla_violations (metric, target, actual, severity, timestamp, affected_analysis_type)
        VALUES ($1, $2, $3, $4, NOW(), $5)`,
        [metric, targetValue, value, violation.severity, analysisType || null],
      );
    } catch (error) {
      this.logger.warn('Failed to record violation', {
        error: error instanceof Error ? error.message : 'unknown',
      });
    } finally {
      client.release();
    }

    // Alertar
    if (violation.severity === 'critical') {
      this.logger.error('CRITICAL SLA VIOLATION', {
        metric,
        target: targetValue,
        actual: value,
        analysisType,
      });
    } else {
      this.logger.warn('SLA Warning', {
        metric,
        target: targetValue,
        actual: value,
      });
    }
  }

  private _isViolation(metric: string, actual: number, target: number): boolean {
    switch (metric) {
      case 'latency':
        return actual > target; // Latency: lower is better
      case 'availability':
        return actual < target; // Availability: higher is better
      case 'error_rate':
        return actual > target; // Error rate: lower is better
      case 'cost':
        return actual > target; // Cost: lower is better
      default:
        return false;
    }
  }

  private _calculateSeverity(
    metric: string,
    actual: number,
    target: number,
  ): 'warning' | 'critical' {
    if (metric === 'latency') {
      return actual > target * 1.5 ? 'critical' : 'warning';
    }

    if (metric === 'error_rate') {
      return actual > target * 2 ? 'critical' : 'warning';
    }

    if (metric === 'availability') {
      return actual < target * 0.95 ? 'critical' : 'warning';
    }

    return 'warning';
  }

  private _getTargetValue(target: SLATarget): number {
    if (target.p99) return target.p99;
    if (target.uptime) return target.uptime;
    if (target.errorRateMax) return target.errorRateMax;
    if (target.costPerAnalysis) return target.costPerAnalysis;
    return 0;
  }

  private _calculateCompliance(
    metric: string,
    actual: number,
    target: number,
  ): number {
    if (metric === 'latency') {
      return Math.min(1.0, target / Math.max(1, actual));
    }

    if (metric === 'availability') {
      return Math.min(1.0, actual / Math.max(0.9, target));
    }

    if (metric === 'error_rate') {
      return Math.min(1.0, (target - actual) / target);
    }

    return 0.5;
  }

  private async _calculateActualMetric(metric: string): Promise<number | null> {
    // Simulação: em produção, agregar métricas reais
    try {
      const cached = await this.redis.get(`actual_metric:${metric}`);

      if (cached) {
        return parseFloat(cached);
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  private async _getMetricTrend(
    metric: string,
    minutes: number,
  ): Promise<number[]> {
    const trend: number[] = [];

    for (let i = 0; i < minutes; i++) {
      const key = `metric:${metric}:${i}`;

      try {
        const value = await this.redis.lrange(key, 0, 0);

        if (value.length > 0) {
          trend.push(parseFloat(value[0]));
        }
      } catch (error) {
        // Skip if error
      }
    }

    return trend;
  }
}
