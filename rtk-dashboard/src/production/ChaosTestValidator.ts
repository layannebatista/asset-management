import { Logger } from 'winston';
import { Pool } from 'pg';
import { Redis } from 'ioredis';
import { DecisionOutput } from '../types/DecisionOutput';
import { AnalysisType } from '../types/analysis.types';

/**
 * Cenários de caos para testar resiliência
 */
export interface ChaosScenario {
  name: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  injectionType: ChaosInjectionType;

  // Parâmetros
  targetComponent: string;
  affectedMetrics: string[];
  degradationPercent: number;      // 0-100% degradação

  // Timing
  startAt: Date;
  duration: number;                // segundos

  // Recuperação esperada
  expectedRecoveryTime: number;     // segundos

  createdAt: Date;
}

export enum ChaosInjectionType {
  LATENCY = 'latency',                    // Aumentar latência
  ERROR_RATE = 'error_rate',              // Aumentar taxa de erro
  DATA_CORRUPTION = 'data_corruption',    // Corromper dados
  SERVICE_DEGRADATION = 'service_degradation', // Simular degradação
  PARTIAL_FAILURE = 'partial_failure',    // Falha de alguns requests
  CASCADING_FAILURE = 'cascading_failure', // Falha em cascata
  RESOURCE_EXHAUSTION = 'resource_exhaustion', // Esgotamento de recursos
  CLOCK_SKEW = 'clock_skew',              // Dessincronização de relógios
}

/**
 * Resultado da validação de caos
 */
export interface ChaosTestResult {
  testId: string;
  scenario: ChaosScenario;

  // Execução
  startedAt: Date;
  completedAt: Date;
  duration: number;              // ms

  // Métricas durante caos
  metricsUnderChaos: {
    errorRateUnderChaos: number;
    latencyUnderChaos: number;
    availabilityUnderChaos: number;
    systemHealthScore: number;    // 0-1
  };

  // Recuperação
  recoveredAt?: Date;
  actualRecoveryTime?: number;    // ms
  recoverySuccessful: boolean;

  // Observações
  failures: string[];
  alerts: string[];

  // Score: quanto melhor, mais resiliente
  resilienceScore: number;        // 0-1
  passed: boolean;                // true se resilienceScore > 0.7

  recommendations: string[];
  timestamp: Date;
}

/**
 * ChaosTestValidator: Testa resiliência do sistema contra cenários adversos
 *
 * Responsabilidades:
 * 1. Definir cenários de caos realistas
 * 2. Injetar falhas controladas
 * 3. Monitorar comportamento sob stress
 * 4. Medir tempo de recuperação
 * 5. Identificar single points of failure
 * 6. Validar que sistema não piora SLOs durante falhas
 * 7. Gerar relatórios de resiliência
 *
 * Cenários:
 * - Latência aumenta 50%: sistema continua operacional?
 * - Taxa de erro sobe para 10%: fallbacks funcionam?
 * - Um serviço fica indisponível: cascata de falhas?
 * - Memória esgotada: graceful degradation?
 * - BD lenta: queries com timeout?
 *
 * Estratégia:
 * - Testar em ambiente staging antes de produção
 * - Injetar caos de forma controlada (não aleatória)
 * - Medir recuperação automática
 * - Se resiliência < 70%, bloqueia produção
 */
export class ChaosTestValidator {
  private readonly pgPool: Pool;
  private readonly redis: Redis;
  private readonly logger: Logger;

  // Cenários pré-definidos
  private readonly defaultScenarios: Record<string, ChaosScenario> = {
    latency_spike: {
      name: 'Latency Spike',
      description: 'API latency increases 50%',
      severity: 'medium',
      injectionType: ChaosInjectionType.LATENCY,
      targetComponent: 'api_gateway',
      affectedMetrics: ['p99_latency', 'response_time'],
      degradationPercent: 50,
      startAt: new Date(),
      duration: 300, // 5 min
      expectedRecoveryTime: 30, // 30s para se recuperar
      createdAt: new Date(),
    },
    error_rate_spike: {
      name: 'Error Rate Spike',
      description: 'Error rate increases to 10%',
      severity: 'high',
      injectionType: ChaosInjectionType.ERROR_RATE,
      targetComponent: 'decision_engine',
      affectedMetrics: ['error_rate', 'success_rate'],
      degradationPercent: 10,
      startAt: new Date(),
      duration: 180,
      expectedRecoveryTime: 60,
      createdAt: new Date(),
    },
    service_degradation: {
      name: 'Service Degradation',
      description: 'One backend service becomes 70% slower',
      severity: 'high',
      injectionType: ChaosInjectionType.SERVICE_DEGRADATION,
      targetComponent: 'analysis_service',
      affectedMetrics: ['service_latency', 'throughput'],
      degradationPercent: 70,
      startAt: new Date(),
      duration: 240,
      expectedRecoveryTime: 45,
      createdAt: new Date(),
    },
    partial_failure: {
      name: 'Partial Failure',
      description: '20% of requests fail',
      severity: 'critical',
      injectionType: ChaosInjectionType.PARTIAL_FAILURE,
      targetComponent: 'decision_executor',
      affectedMetrics: ['error_rate', 'availability'],
      degradationPercent: 20,
      startAt: new Date(),
      duration: 120,
      expectedRecoveryTime: 90,
      createdAt: new Date(),
    },
    cascading_failure: {
      name: 'Cascading Failure',
      description: 'Failure in one service cascades to others',
      severity: 'critical',
      injectionType: ChaosInjectionType.CASCADING_FAILURE,
      targetComponent: 'database',
      affectedMetrics: ['availability', 'error_rate', 'latency'],
      degradationPercent: 100,
      startAt: new Date(),
      duration: 60,
      expectedRecoveryTime: 120,
      createdAt: new Date(),
    },
  };

  constructor(pgPool: Pool, redis: Redis, logger: Logger) {
    this.pgPool = pgPool;
    this.redis = redis;
    this.logger = logger;

    this.logger.info('ChaosTestValidator initialized');
  }

  /**
   * Executar teste de caos
   */
  async runChaosTest(
    scenarioName: string,
    monitoringWindowSeconds: number = 600, // 10 min
  ): Promise<ChaosTestResult> {
    const testId = `chaos-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      const scenario = this.defaultScenarios[scenarioName];
      if (!scenario) {
        throw new Error(`Unknown chaos scenario: ${scenarioName}`);
      }

      this.logger.info('Starting chaos test', { testId, scenario: scenarioName });

      const startedAt = new Date();

      // 1. Injetar caos
      await this._injectChaos(testId, scenario);

      // 2. Monitorar durante o caos
      const metricsUnderChaos = await this._monitorDuringChaos(
        testId,
        scenario,
        monitoringWindowSeconds,
      );

      // 3. Remover injeção de caos
      await this._removeChaos(testId);

      // 4. Monitorar recuperação
      const recoveryData = await this._monitorRecovery(testId, scenario);

      // 5. Calcular score de resiliência
      const resilienceScore = this._calculateResilienceScore(metricsUnderChaos, recoveryData, scenario);

      const failures = this._detectFailures(metricsUnderChaos, scenario);
      const alerts = this._generateAlerts(metricsUnderChaos, recoveryData, scenario);
      const recommendations = this._generateRecommendations(failures, resilienceScore);

      const result: ChaosTestResult = {
        testId,
        scenario,
        startedAt,
        completedAt: new Date(),
        duration: Date.now() - startedAt.getTime(),
        metricsUnderChaos,
        recoveredAt: recoveryData.recoveredAt,
        actualRecoveryTime: recoveryData.recoveryTime,
        recoverySuccessful: recoveryData.successful,
        failures,
        alerts,
        resilienceScore,
        passed: resilienceScore > 0.7,
        recommendations,
        timestamp: new Date(),
      };

      // Registrar resultado
      await this._recordResult(result);

      // Alertar se falhou
      if (!result.passed) {
        this.logger.warn('Chaos test FAILED - low resilience', {
          testId,
          scenario: scenarioName,
          resilienceScore,
          failures,
        });
      } else {
        this.logger.info('Chaos test PASSED', {
          testId,
          scenario: scenarioName,
          resilienceScore,
        });
      }

      return result;
    } catch (error) {
      this.logger.error('Error running chaos test', {
        testId,
        error: error instanceof Error ? error.message : 'unknown',
      });
      throw error;
    }
  }

  /**
   * Validar que sistema pode tolerar falhas
   */
  async validateResilience(environment: 'staging' | 'production'): Promise<{
    canProceed: boolean;
    overallScore: number;
    results: ChaosTestResult[];
    blockers: string[];
  }> {
    try {
      const testScenarios = ['latency_spike', 'error_rate_spike', 'service_degradation'];
      const results: ChaosTestResult[] = [];
      const blockers: string[] = [];

      for (const scenarioName of testScenarios) {
        try {
          const result = await this.runChaosTest(scenarioName);
          results.push(result);

          if (!result.passed) {
            blockers.push(`${scenarioName}: resilience score ${result.resilienceScore.toFixed(2)}`);
          }
        } catch (error) {
          blockers.push(`${scenarioName}: execution error`);
        }
      }

      const overallScore = results.length > 0
        ? results.reduce((sum, r) => sum + r.resilienceScore, 0) / results.length
        : 0;

      const canProceed = blockers.length === 0 && overallScore > 0.7;

      this.logger.info('Resilience validation completed', {
        environment,
        canProceed,
        overallScore,
        blockers: blockers.length,
      });

      return { canProceed, overallScore, results, blockers };
    } catch (error) {
      this.logger.error('Error validating resilience', {
        error: error instanceof Error ? error.message : 'unknown',
      });
      throw error;
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // Private methods
  // ═══════════════════════════════════════════════════════════════════

  private async _injectChaos(testId: string, scenario: ChaosScenario): Promise<void> {
    try {
      const injectionConfig = {
        testId,
        component: scenario.targetComponent,
        injectionType: scenario.injectionType,
        degradation: scenario.degradationPercent,
        duration: scenario.duration,
      };

      // Armazenar configuração no Redis para o sistema reconhecer
      await this.redis.setex(
        `chaos:${testId}`,
        scenario.duration,
        JSON.stringify(injectionConfig),
      );

      this.logger.debug('Chaos injected', {
        testId,
        type: scenario.injectionType,
        component: scenario.targetComponent,
      });
    } catch (error) {
      this.logger.warn('Failed to inject chaos', {
        error: error instanceof Error ? error.message : 'unknown',
      });
    }
  }

  private async _removeChaos(testId: string): Promise<void> {
    try {
      await this.redis.del(`chaos:${testId}`);
      this.logger.debug('Chaos removed', { testId });
    } catch (error) {
      this.logger.warn('Failed to remove chaos', {
        error: error instanceof Error ? error.message : 'unknown',
      });
    }
  }

  private async _monitorDuringChaos(
    testId: string,
    scenario: ChaosScenario,
    windowSeconds: number,
  ): Promise<{
    errorRateUnderChaos: number;
    latencyUnderChaos: number;
    availabilityUnderChaos: number;
    systemHealthScore: number;
  }> {
    const client = await this.pgPool.connect();

    try {
      // Coletar métricas durante o caos
      const result = await client.query(
        `SELECT
          SUM(CASE WHEN executed = false THEN 1 ELSE 0 END)::float / NULLIF(COUNT(*), 0) as error_rate,
          PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY execution_time_ms) as latency_p99,
          COUNT(CASE WHEN executed = true THEN 1 END)::float / NULLIF(COUNT(*), 0) as availability,
          AVG(quality_score)::float as quality_score
        FROM autonomous_decision_log
        WHERE timestamp > NOW() - INTERVAL '${Math.min(windowSeconds, 600)} seconds'
          AND (
            metadata->>'type' = $1
            OR metadata->>'criticality' = $2
          )`,
        [scenario.targetComponent, 'HIGH'],
      );

      const row = result.rows[0] || {};

      // Calcular health score (0-1)
      const errorRate = row.error_rate || 0;
      const availabilityScore = row.availability || 0;
      const qualityScore = row.quality_score || 0.5;

      // Health = média ponderada (availability mais importante)
      const systemHealthScore = availabilityScore * 0.5 + qualityScore * 0.3 + (1 - errorRate) * 0.2;

      return {
        errorRateUnderChaos: errorRate,
        latencyUnderChaos: row.latency_p99 || 0,
        availabilityUnderChaos: availabilityScore,
        systemHealthScore: Math.max(0, Math.min(1, systemHealthScore)),
      };
    } finally {
      client.release();
    }
  }

  private async _monitorRecovery(
    testId: string,
    scenario: ChaosScenario,
  ): Promise<{ successful: boolean; recoveredAt?: Date; recoveryTime?: number }> {
    const client = await this.pgPool.connect();

    try {
      // Verificar se recuperou (métricas retornam ao normal)
      const result = await client.query(
        `SELECT
          MAX(timestamp) as recovered_at,
          AVG(quality_score)::float as recovery_quality
        FROM autonomous_decision_log
        WHERE timestamp > NOW() - INTERVAL '5 minutes'
          AND executed = true
        GROUP BY DATE_TRUNC('minute', timestamp)
        ORDER BY DATE_TRUNC('minute', timestamp) DESC
        LIMIT 1`,
      );

      const row = result.rows[0];
      const recoveryQuality = row?.recovery_quality || 0;

      // Recuperado se qualidade >= 0.7
      const successful = recoveryQuality >= 0.7;

      return {
        successful,
        recoveredAt: successful ? new Date(row.recovered_at) : undefined,
        recoveryTime: successful ? Date.now() - new Date(row.recovered_at).getTime() : undefined,
      };
    } catch (error) {
      return { successful: false };
    } finally {
      client.release();
    }
  }

  private _calculateResilienceScore(
    metrics: any,
    recovery: any,
    scenario: ChaosScenario,
  ): number {
    let score = 1.0;

    // Penalizar por erros durante caos
    const errorPenalty = metrics.errorRateUnderChaos * 0.5;
    score -= errorPenalty;

    // Penalizar por indisponibilidade
    const availabilityPenalty = (1 - metrics.availabilityUnderChaos) * 0.3;
    score -= availabilityPenalty;

    // Bonus se recuperou bem
    if (recovery.successful && recovery.recoveryTime <= scenario.expectedRecoveryTime * 1000) {
      score += 0.2;
    } else if (!recovery.successful) {
      score -= 0.3;
    }

    return Math.max(0, Math.min(1, score));
  }

  private _detectFailures(metrics: any, scenario: ChaosScenario): string[] {
    const failures: string[] = [];

    if (metrics.errorRateUnderChaos > 0.05) {
      failures.push(`High error rate during ${scenario.injectionType}: ${(metrics.errorRateUnderChaos * 100).toFixed(1)}%`);
    }

    if (metrics.availabilityUnderChaos < 0.9) {
      failures.push(`Low availability during chaos: ${(metrics.availabilityUnderChaos * 100).toFixed(1)}%`);
    }

    if (metrics.systemHealthScore < 0.6) {
      failures.push(`System health critical: ${(metrics.systemHealthScore * 100).toFixed(1)}%`);
    }

    return failures;
  }

  private _generateAlerts(metrics: any, recovery: any, scenario: ChaosScenario): string[] {
    const alerts: string[] = [];

    if (metrics.errorRateUnderChaos > scenario.degradationPercent / 200) {
      alerts.push('Error rate exceeded expectations during chaos test');
    }

    if (metrics.availabilityUnderChaos < 0.85) {
      alerts.push('Availability degraded significantly - check fallback mechanisms');
    }

    if (!recovery.successful) {
      alerts.push('System did not recover automatically - may require manual intervention');
    }

    if (recovery.recoveryTime > scenario.expectedRecoveryTime * 1000 * 1.5) {
      alerts.push(`Recovery took ${(recovery.recoveryTime / 1000).toFixed(0)}s - exceeds expected ${scenario.expectedRecoveryTime}s`);
    }

    return alerts;
  }

  private _generateRecommendations(failures: string[], score: number): string[] {
    const recommendations: string[] = [];

    if (failures.length > 0) {
      recommendations.push('Review error handling and fallback mechanisms');
      recommendations.push('Add circuit breakers for cascading failure prevention');
      recommendations.push('Implement health checks for rapid failure detection');
    }

    if (score < 0.6) {
      recommendations.push('System needs significant resilience improvements before production');
      recommendations.push('Consider adding redundancy and replication');
    }

    if (score < 0.5) {
      recommendations.push('DO NOT DEPLOY - critical resilience issues detected');
    }

    return recommendations;
  }

  private async _recordResult(result: ChaosTestResult): Promise<void> {
    const client = await this.pgPool.connect();

    try {
      await client.query(
        `INSERT INTO chaos_test_results
         (test_id, scenario_name, resilience_score, passed, failures, alerts, recommendations)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          result.testId,
          result.scenario.name,
          result.resilienceScore,
          result.passed,
          JSON.stringify(result.failures),
          JSON.stringify(result.alerts),
          JSON.stringify(result.recommendations),
        ],
      );
    } catch (error) {
      this.logger.warn('Failed to record chaos test result', {
        error: error instanceof Error ? error.message : 'unknown',
      });
    } finally {
      client.release();
    }
  }
}
