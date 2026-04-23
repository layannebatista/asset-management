import { Logger } from 'winston';
import { Pool } from 'pg';
import { Redis } from 'ioredis';
import { DecisionOutput } from '../types/DecisionOutput';
import { AnalysisType } from '../types/analysis.types';

/**
 * Execução em shadow - testa decisões sem efeitos reais
 */
export interface ShadowModeConfig {
  enabled: boolean;
  percentageOfTraffic: number;     // 0-100% de traffic fazer shadow
  analysisTypes: AnalysisType[];   // Quais tipos fazer shadow
  environments: Array<'dev' | 'staging' | 'production'>;
  maxConcurrentShadows: number;
  shadowTimeout: number;            // ms

  createdAt: Date;
}

/**
 * Execução shadow de uma decisão
 */
export interface ShadowExecution {
  shadowId: string;
  originalDecisionId: string;

  // Decisão
  decision: DecisionOutput;
  analysis_type: AnalysisType;
  environment: 'dev' | 'staging' | 'production';

  // Execução
  startedAt: Date;
  completedAt?: Date;
  duration?: number;                // ms

  // Resultado
  status: 'pending' | 'running' | 'completed' | 'failed' | 'timeout';
  actualOutput?: any;
  actualCost?: number;
  actualLatency?: number;

  // Comparação com original
  matches: boolean;                 // shadow output == actual output?
  differences?: {
    outputDifference: string;
    confidenceDifference: number;   // 0-1
    costDifference: number;         // %
  };

  // Observações
  errors?: string[];
  warnings?: string[];

  createdAt: Date;
}

/**
 * ShadowModeExecutor: Executa decisões em shadow para validação
 *
 * Responsabilidades:
 * 1. Rodar decisões em paralelo (shadow) sem efeitos reais
 * 2. Comparar shadow output com predicted output
 * 3. Detectar se modelo está divergindo
 * 4. Validar que execution engine funciona como esperado
 * 5. Colher métricas de confiança
 * 6. Alertar se shadow fails (pode indicar problema em produção)
 * 7. A/B test de novas estratégias
 *
 * Casos de uso:
 * - Rollout de novo modelo: rodar 10% shadow, validar antes de 100%
 * - Mudança em execution engine: shadow antes de deploy
 * - Mudança em regra de negócio: validar impacto com shadow
 * - Detectar model drift: shadow mostra que predições mudaram
 *
 * Estratégia:
 * - Não modificar dados reais (não executar ações)
 * - Apenas simular / calcular resultado
 * - Coletar métricas que não afetam sistema
 * - Comparar com decisão original
 * - Log detalhado para debugging
 */
export class ShadowModeExecutor {
  private readonly pgPool: Pool;
  private readonly redis: Redis;
  private readonly logger: Logger;
  private activeShadows = new Map<string, ShadowExecution>();

  constructor(pgPool: Pool, redis: Redis, logger: Logger) {
    this.pgPool = pgPool;
    this.redis = redis;
    this.logger = logger;

    this.logger.info('ShadowModeExecutor initialized');
  }

  /**
   * Executar decisão em shadow (sem efeitos reais)
   */
  async executeShadow(
    originalDecisionId: string,
    decision: DecisionOutput,
    analysisType: AnalysisType,
    environment: 'dev' | 'staging' | 'production',
    simulationFn: () => Promise<any>,
  ): Promise<ShadowExecution> {
    const shadowId = `shadow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const shadowExecution: ShadowExecution = {
      shadowId,
      originalDecisionId,
      decision,
      analysis_type: analysisType,
      environment,
      startedAt: new Date(),
      status: 'pending',
      matches: false,
      createdAt: new Date(),
    };

    this.activeShadows.set(shadowId, shadowExecution);

    try {
      this.logger.debug('Shadow execution started', {
        shadowId,
        originalDecisionId,
        analysisType,
      });

      // Executar simulação
      shadowExecution.status = 'running';
      const startTime = Date.now();

      try {
        // Rodar com timeout
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Shadow execution timeout')), 30000),
        );

        shadowExecution.actualOutput = await Promise.race([
          simulationFn(),
          timeoutPromise,
        ]);

        shadowExecution.actualLatency = Date.now() - startTime;
        shadowExecution.status = 'completed';
      } catch (error) {
        if (error instanceof Error && error.message.includes('timeout')) {
          shadowExecution.status = 'timeout';
          shadowExecution.errors = ['Shadow execution exceeded 30s timeout'];
        } else {
          shadowExecution.status = 'failed';
          shadowExecution.errors = [
            error instanceof Error ? error.message : 'Unknown error',
          ];
        }
      }

      shadowExecution.completedAt = new Date();
      shadowExecution.duration = shadowExecution.completedAt.getTime() - shadowExecution.startedAt.getTime();

      // Comparar com original (se possível)
      if (shadowExecution.status === 'completed') {
        const comparison = await this._compareWithOriginal(decision, shadowExecution.actualOutput);
        shadowExecution.matches = comparison.matches;
        shadowExecution.differences = comparison.differences;
        shadowExecution.warnings = comparison.warnings;
      }

      // Registrar resultado
      await this._recordShadowExecution(shadowExecution);

      // Log resultado
      if (shadowExecution.matches) {
        this.logger.debug('Shadow execution matched original', {
          shadowId,
          latency: shadowExecution.actualLatency,
        });
      } else {
        this.logger.warn('Shadow execution diverged from original', {
          shadowId,
          originalDecisionId,
          differences: shadowExecution.differences,
        });
      }

      return shadowExecution;
    } catch (error) {
      this.logger.error('Error during shadow execution', {
        shadowId,
        error: error instanceof Error ? error.message : 'unknown',
      });

      shadowExecution.status = 'failed';
      shadowExecution.errors = [
        error instanceof Error ? error.message : 'Unknown error',
      ];
      shadowExecution.completedAt = new Date();
      shadowExecution.duration = shadowExecution.completedAt.getTime() - shadowExecution.startedAt.getTime();

      await this._recordShadowExecution(shadowExecution);

      return shadowExecution;
    } finally {
      this.activeShadows.delete(shadowId);
    }
  }

  /**
   * Verificar saúde de shadow executions (detectar model drift)
   */
  async validateShadowHealth(
    analysisType: AnalysisType,
    environment: 'dev' | 'staging' | 'production',
    lookbackMinutes: number = 60,
  ): Promise<{
    healthScore: number;           // 0-1, quanto mais alto melhor (menos divergências)
    matchRate: number;             // % de shadows que matcharam
    averageLatency: number;        // ms
    errorCount: number;
    warnings: string[];
    recommendation: 'safe' | 'monitor' | 'investigate' | 'rollback';
  }> {
    try {
      const client = await this.pgPool.connect();

      try {
        // Colher dados dos últimos N minutos
        const result = await client.query(
          `SELECT
            COUNT(*) as total_shadows,
            SUM(CASE WHEN matches = true THEN 1 ELSE 0 END)::float / NULLIF(COUNT(*), 0) as match_rate,
            AVG(duration)::float as avg_latency,
            SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as error_count,
            AVG(
              CASE WHEN differences IS NOT NULL
                THEN (differences->>'costDifference')::float
                ELSE 0
              END
            ) as avg_cost_difference
           FROM shadow_executions
           WHERE analysis_type = $1
             AND environment = $2
             AND created_at > NOW() - INTERVAL '${lookbackMinutes} minutes'`,
          [analysisType, environment],
        );

        const row = result.rows[0];
        const totalShadows = row?.total_shadows || 0;

        if (totalShadows === 0) {
          return {
            healthScore: 1.0,
            matchRate: 1.0,
            averageLatency: 0,
            errorCount: 0,
            warnings: ['No shadow data in last ' + lookbackMinutes + ' minutes'],
            recommendation: 'safe',
          };
        }

        const matchRate = row.match_rate || 0;
        const avgLatency = row.avg_latency || 0;
        const errorCount = row.error_count || 0;
        const avgCostDifference = row.avg_cost_difference || 0;

        // Calcular health score (baseado em divergência)
        let healthScore = matchRate; // Base: match rate

        // Penalizar por erros
        healthScore -= (errorCount / totalShadows) * 0.2;

        // Penalizar por custo alto divergindo
        if (Math.abs(avgCostDifference) > 10) {
          healthScore -= 0.15;
        }

        healthScore = Math.max(0, Math.min(1, healthScore));

        const warnings: string[] = [];
        let recommendation: 'safe' | 'monitor' | 'investigate' | 'rollback' = 'safe';

        if (matchRate < 0.9) {
          warnings.push(`Only ${(matchRate * 100).toFixed(0)}% of shadows matched original`);
          recommendation = 'investigate';
        }

        if (errorCount > totalShadows * 0.1) {
          warnings.push(`${errorCount} shadow executions failed`);
          recommendation = 'investigate';
        }

        if (healthScore < 0.7) {
          warnings.push('Shadow health is degraded - possible model drift');
          recommendation = healthScore < 0.5 ? 'rollback' : 'monitor';
        }

        this.logger.info('Shadow health check completed', {
          analysisType,
          environment,
          healthScore,
          matchRate: (matchRate * 100).toFixed(0) + '%',
          recommendation,
        });

        return {
          healthScore,
          matchRate,
          averageLatency: avgLatency,
          errorCount,
          warnings,
          recommendation,
        };
      } finally {
        client.release();
      }
    } catch (error) {
      this.logger.error('Error validating shadow health', {
        error: error instanceof Error ? error.message : 'unknown',
      });

      return {
        healthScore: 0,
        matchRate: 0,
        averageLatency: 0,
        errorCount: -1,
        warnings: ['Failed to validate shadow health'],
        recommendation: 'investigate',
      };
    }
  }

  /**
   * Obter estatísticas de shadow por tipo de análise
   */
  async getShadowStatistics(
    environment: 'dev' | 'staging' | 'production',
    days: number = 7,
  ): Promise<{
    byAnalysisType: Record<AnalysisType, {
      totalShadows: number;
      matchRate: number;
      errorRate: number;
      avgLatency: number;
      healthScore: number;
    }>;
    overall: {
      totalShadows: number;
      matchRate: number;
      errorRate: number;
      avgLatency: number;
    };
  }> {
    try {
      const client = await this.pgPool.connect();

      try {
        const result = await client.query(
          `SELECT
            analysis_type,
            COUNT(*) as total,
            SUM(CASE WHEN matches = true THEN 1 ELSE 0 END)::float / NULLIF(COUNT(*), 0) as match_rate,
            SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END)::float / NULLIF(COUNT(*), 0) as error_rate,
            AVG(duration)::float as avg_latency
           FROM shadow_executions
           WHERE environment = $1
             AND created_at > NOW() - INTERVAL '${days} days'
           GROUP BY analysis_type`,
          [environment],
        );

        const byAnalysisType: Record<string, any> = {};

        for (const row of result.rows) {
          const matchRate = row.match_rate || 0;
          const healthScore = matchRate - (row.error_rate || 0) * 0.3;

          byAnalysisType[row.analysis_type] = {
            totalShadows: row.total,
            matchRate,
            errorRate: row.error_rate || 0,
            avgLatency: row.avg_latency || 0,
            healthScore: Math.max(0, Math.min(1, healthScore)),
          };
        }

        // Calcular overall stats
        const totalResult = await client.query(
          `SELECT
            COUNT(*) as total,
            SUM(CASE WHEN matches = true THEN 1 ELSE 0 END)::float / NULLIF(COUNT(*), 0) as match_rate,
            SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END)::float / NULLIF(COUNT(*), 0) as error_rate,
            AVG(duration)::float as avg_latency
           FROM shadow_executions
           WHERE environment = $1
             AND created_at > NOW() - INTERVAL '${days} days'`,
          [environment],
        );

        const totalRow = totalResult.rows[0];

        return {
          byAnalysisType,
          overall: {
            totalShadows: totalRow.total || 0,
            matchRate: totalRow.match_rate || 0,
            errorRate: totalRow.error_rate || 0,
            avgLatency: totalRow.avg_latency || 0,
          },
        };
      } finally {
        client.release();
      }
    } catch (error) {
      this.logger.error('Error getting shadow statistics', {
        error: error instanceof Error ? error.message : 'unknown',
      });

      throw error;
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // Private methods
  // ═══════════════════════════════════════════════════════════════════

  private async _compareWithOriginal(
    originalDecision: DecisionOutput,
    shadowOutput: any,
  ): Promise<{
    matches: boolean;
    differences?: {
      outputDifference: string;
      confidenceDifference: number;
      costDifference: number;
    };
    warnings?: string[];
  }> {
    const warnings: string[] = [];

    // Comparar recomendação
    const sameRecommendation = originalDecision.decision.recommendation === shadowOutput?.recommendation;

    // Comparar qualidade (confidence)
    const originalQuality = originalDecision.metrics.quality_score || 0;
    const shadowQuality = shadowOutput?.qualityScore || 0;
    const confidenceDiff = Math.abs(originalQuality - shadowQuality);

    // Comparar custo estimado
    const originalCost = originalDecision.metadata.estimated_cost || 0;
    const shadowCost = shadowOutput?.estimatedCost || 0;
    const costDiffPercent = originalCost > 0
      ? ((shadowCost - originalCost) / originalCost) * 100
      : 0;

    const matches = sameRecommendation && confidenceDiff < 0.1 && Math.abs(costDiffPercent) < 15;

    if (!sameRecommendation) {
      warnings.push(`Recommendation differs: "${originalDecision.decision.recommendation}" vs "${shadowOutput?.recommendation}"`);
    }

    if (confidenceDiff > 0.05) {
      warnings.push(`Quality score differs by ${(confidenceDiff * 100).toFixed(1)}%`);
    }

    if (Math.abs(costDiffPercent) > 10) {
      warnings.push(`Estimated cost differs by ${costDiffPercent.toFixed(1)}%`);
    }

    return {
      matches,
      differences: {
        outputDifference: sameRecommendation ? 'none' : `recommendation: ${originalDecision.decision.recommendation} vs ${shadowOutput?.recommendation}`,
        confidenceDifference: confidenceDiff,
        costDifference: costDiffPercent,
      },
      warnings,
    };
  }

  private async _recordShadowExecution(execution: ShadowExecution): Promise<void> {
    const client = await this.pgPool.connect();

    try {
      await client.query(
        `INSERT INTO shadow_executions
         (shadow_id, original_decision_id, analysis_type, environment, status,
          matches, differences, duration, actual_latency, errors, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          execution.shadowId,
          execution.originalDecisionId,
          execution.analysis_type,
          execution.environment,
          execution.status,
          execution.matches,
          execution.differences ? JSON.stringify(execution.differences) : null,
          execution.duration,
          execution.actualLatency,
          execution.errors ? JSON.stringify(execution.errors) : null,
          execution.createdAt,
        ],
      );
    } catch (error) {
      this.logger.warn('Failed to record shadow execution', {
        error: error instanceof Error ? error.message : 'unknown',
      });
    } finally {
      client.release();
    }
  }
}
