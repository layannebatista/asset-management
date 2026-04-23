import { Logger } from 'winston';
import { Pool } from 'pg';

/**
 * SLO = Service Level Objective
 * Promessa: X% de tempo, Y latência, Z qualidade
 */
export interface SLOTarget {
  name: string;
  description: string;

  // Objetivos
  targetErrorRate: number;           // % (e.g., 0.02 = 2%)
  targetLatencyP99: number;           // ms
  targetAvailability: number;         // % (e.g., 0.995 = 99.5%)
  targetQualityScore: number;         // 0-1
  targetAutoExecutionRate: number;    // % (e.g., 0.75 = 75%)

  // Window
  evaluationWindowDays: number;       // Quantos dias para calcular SLO
  errorBudget: number;                // % de errors permitidos antes violar SLO

  createdAt: Date;
}

export interface SLOStatus {
  sloName: string;

  // Métricas atuais
  currentErrorRate: number;
  currentLatencyP99: number;
  currentAvailability: number;
  currentQualityScore: number;
  currentAutoExecutionRate: number;

  // Conformidade (verdadeiro/falso para cada métrica)
  meetsErrorRate: boolean;
  meetsLatency: boolean;
  meetsAvailability: boolean;
  meetsQuality: boolean;
  meetsAutoExecution: boolean;

  // Geral
  overallCompliance: boolean;         // true = todas as métricas OK
  compliancePercentage: number;       // 0-100%

  // Erro budget
  errorBudgetRemaining: number;       // % do erro permitido que ainda há
  errorBudgetStatus: 'healthy' | 'warning' | 'critical';

  // Previsão
  onTrackToMeetSLO: boolean;
  daysUntilBreach?: number;           // Se não está on track

  timestamp: Date;
}

/**
 * SLOMonitor: Monitora se sistema mantém SLOs
 *
 * Responsabilidades:
 * 1. Definir SLOs (objetivos de qualidade/performance)
 * 2. Monitorar métricas em tempo real
 * 3. Alertar se SLO será violado
 * 4. Rastrear erro budget (quanto "erro" posso ter)
 * 5. Prever se atingirá SLO até fim do período
 * 6. Gerar relatórios de conformidade
 *
 * SLOs de exemplo (produção):
 * - Error rate < 2%
 * - Latency p99 < 5s
 * - Availability > 99.5%
 * - Quality score >= 0.8
 * - Auto-execution rate >= 75%
 *
 * Erro Budget:
 * - Se 99.5% availability = 0.5% de tempo down permitido
 * - = ~21 min/mês
 * - Monitor alerta se vai exceder
 *
 * Estratégia:
 * - Calcular métricas rolling (últimas N horas/dias)
 * - Alertar 24h antes de violar SLO
 * - Forçar manual mode se SLO quebrado
 * - Relatórios diários/semanais/mensais
 */
export class SLOMonitor {
  private readonly pgPool: Pool;
  private readonly logger: Logger;

  // SLOs padrão
  private readonly defaultSLOs: Record<string, SLOTarget> = {
    production: {
      name: 'Production SLO',
      description: 'Enterprise-grade SLO for production autonomous engine',
      targetErrorRate: 0.02,           // 2%
      targetLatencyP99: 5000,          // 5 segundos
      targetAvailability: 0.995,       // 99.5%
      targetQualityScore: 0.8,         // 0.8 (80%)
      targetAutoExecutionRate: 0.75,   // 75%
      evaluationWindowDays: 30,
      errorBudget: 0.02,
      createdAt: new Date(),
    },
    staging: {
      name: 'Staging SLO',
      description: 'Relaxed SLO for staging environment',
      targetErrorRate: 0.05,           // 5%
      targetLatencyP99: 10000,         // 10 segundos
      targetAvailability: 0.99,        // 99%
      targetQualityScore: 0.75,        // 0.75 (75%)
      targetAutoExecutionRate: 0.65,   // 65%
      evaluationWindowDays: 7,
      errorBudget: 0.05,
      createdAt: new Date(),
    },
  };

  constructor(pgPool: Pool, logger: Logger) {
    this.pgPool = pgPool;
    this.logger = logger;

    this.logger.info('SLOMonitor initialized');
  }

  /**
   * Verificar status atual do SLO
   */
  async checkSLOStatus(environment: 'production' | 'staging'): Promise<SLOStatus> {
    try {
      const slo = this.defaultSLOs[environment];
      if (!slo) {
        throw new Error(`Unknown environment: ${environment}`);
      }

      // Obter métricas
      const metrics = await this._calculateMetrics(slo.evaluationWindowDays);

      // Verificar conformidade
      const meetsErrorRate = metrics.errorRate <= slo.targetErrorRate;
      const meetsLatency = metrics.latencyP99 <= slo.targetLatencyP99;
      const meetsAvailability = metrics.availability >= slo.targetAvailability;
      const meetsQuality = metrics.qualityScore >= slo.targetQualityScore;
      const meetsAutoExecution = metrics.autoExecutionRate >= slo.targetAutoExecutionRate;

      const overallCompliance = meetsErrorRate && meetsLatency && meetsAvailability && meetsQuality && meetsAutoExecution;

      // Calcular compliance percentage
      let complianceCount = 0;
      const totalMetrics = 5;
      if (meetsErrorRate) complianceCount++;
      if (meetsLatency) complianceCount++;
      if (meetsAvailability) complianceCount++;
      if (meetsQuality) complianceCount++;
      if (meetsAutoExecution) complianceCount++;

      const compliancePercentage = (complianceCount / totalMetrics) * 100;

      // Calcular erro budget
      const errorBudgetRemaining = Math.max(0, slo.errorBudget - metrics.errorRate);
      const errorBudgetStatus =
        errorBudgetRemaining <= 0 ? 'critical' :
        errorBudgetRemaining < slo.errorBudget * 0.2 ? 'warning' :
        'healthy';

      // Previsão
      const { onTrack, daysUntilBreach } = await this._forecastCompliance(
        metrics,
        slo,
        environment
      );

      const status: SLOStatus = {
        sloName: slo.name,
        currentErrorRate: metrics.errorRate,
        currentLatencyP99: metrics.latencyP99,
        currentAvailability: metrics.availability,
        currentQualityScore: metrics.qualityScore,
        currentAutoExecutionRate: metrics.autoExecutionRate,
        meetsErrorRate,
        meetsLatency,
        meetsAvailability,
        meetsQuality,
        meetsAutoExecution,
        overallCompliance,
        compliancePercentage,
        errorBudgetRemaining,
        errorBudgetStatus,
        onTrackToMeetSLO: onTrack,
        daysUntilBreach,
        timestamp: new Date(),
      };

      // Alertar se SLO violated
      if (!overallCompliance || errorBudgetStatus === 'critical') {
        await this._alertSLOViolation(status, slo);
      }

      // Registrar status
      await this._recordStatus(status, slo);

      this.logger.info('SLO status checked', {
        environment,
        overallCompliance,
        compliancePercentage: status.compliancePercentage,
        errorBudgetStatus,
      });

      return status;
    } catch (error) {
      this.logger.error('Error checking SLO status', {
        error: error instanceof Error ? error.message : 'unknown',
      });
      throw error;
    }
  }

  /**
   * Gerar relatório de SLO
   */
  async generateSLOReport(
    environment: 'production' | 'staging',
    days: number = 30,
  ): Promise<{
    period: { start: Date; end: Date };
    sloTarget: SLOTarget;
    monthlyStatus: SLOStatus[];
    trends: Record<string, number[]>;
    summary: string;
  }> {
    try {
      const slo = this.defaultSLOs[environment];

      // Obter histórico
      const statuses = await this._getStatusHistory(environment, days);

      // Calcular trends
      const trends = {
        errorRate: statuses.map((s) => s.currentErrorRate),
        latency: statuses.map((s) => s.currentLatencyP99),
        availability: statuses.map((s) => s.currentAvailability),
        quality: statuses.map((s) => s.currentQualityScore),
        autoExecution: statuses.map((s) => s.currentAutoExecutionRate),
      };

      // Gerar resumo
      const complianceCount = statuses.filter((s) => s.overallCompliance).length;
      const complianceRate = (complianceCount / statuses.length) * 100;

      const summary = `${environment.toUpperCase()} SLO Report: ${complianceRate.toFixed(0)}% compliance over ${days} days`;

      return {
        period: {
          start: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
          end: new Date(),
        },
        sloTarget: slo,
        monthlyStatus: statuses,
        trends,
        summary,
      };
    } catch (error) {
      this.logger.error('Error generating SLO report', {
        error: error instanceof Error ? error.message : 'unknown',
      });
      throw error;
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // Private methods
  // ═══════════════════════════════════════════════════════════════════

  private async _calculateMetrics(windowDays: number): Promise<{
    errorRate: number;
    latencyP99: number;
    availability: number;
    qualityScore: number;
    autoExecutionRate: number;
  }> {
    const client = await this.pgPool.connect();

    try {
      const result = await client.query(
        `SELECT
          SUM(CASE WHEN executed = false THEN 1 ELSE 0 END)::float / NULLIF(COUNT(*), 0) as error_rate,
          PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY execution_time_ms) as latency_p99,
          COUNT(CASE WHEN executed = true THEN 1 END)::float / NULLIF(COUNT(*), 0) as availability,
          AVG(quality_score)::float as quality_score,
          COUNT(CASE WHEN auto_executed = true THEN 1 END)::float / NULLIF(COUNT(*), 0) as auto_execution
        FROM autonomous_decision_log
        WHERE timestamp > NOW() - INTERVAL '${windowDays} days'`,
      );

      const row = result.rows[0] || {};

      return {
        errorRate: row.error_rate || 0,
        latencyP99: row.latency_p99 || 0,
        availability: row.availability || 0.99,
        qualityScore: row.quality_score || 0.7,
        autoExecutionRate: row.auto_execution || 0.7,
      };
    } finally {
      client.release();
    }
  }

  private async _forecastCompliance(
    metrics: any,
    slo: SLOTarget,
    environment: string,
  ): Promise<{ onTrack: boolean; daysUntilBreach?: number }> {
    // Prever se atingirá SLO com trend atual
    const errorTrend = await this._getMetricTrend('error_rate', environment);

    // Se erro está aumentando, e vai exceder limite
    if (errorTrend.slope > 0 && metrics.errorRate + errorTrend.slope > slo.targetErrorRate) {
      const daysUntilBreach = Math.ceil(
        (slo.targetErrorRate - metrics.errorRate) / (errorTrend.slope || 0.001),
      );

      return {
        onTrack: daysUntilBreach > 7, // Safe se > 7 dias
        daysUntilBreach: Math.max(0, daysUntilBreach),
      };
    }

    return { onTrack: true };
  }

  private async _getMetricTrend(metric: string, environment: string): Promise<{ slope: number }> {
    // Calcular trend dos últimos 7 dias
    // Retornar slope (aumento/dia)

    return { slope: 0 }; // TODO: implementar
  }

  private async _getStatusHistory(environment: string, days: number): Promise<SLOStatus[]> {
    const client = await this.pgPool.connect();

    try {
      const result = await client.query(
        `SELECT * FROM slo_status_history
         WHERE environment = $1 AND timestamp > NOW() - INTERVAL '${days} days'
         ORDER BY timestamp DESC`,
        [environment],
      );

      return result.rows.map((row) => ({
        sloName: row.slo_name,
        currentErrorRate: row.current_error_rate,
        currentLatencyP99: row.current_latency_p99,
        currentAvailability: row.current_availability,
        currentQualityScore: row.current_quality_score,
        currentAutoExecutionRate: row.current_auto_execution_rate,
        meetsErrorRate: row.meets_error_rate,
        meetsLatency: row.meets_latency,
        meetsAvailability: row.meets_availability,
        meetsQuality: row.meets_quality,
        meetsAutoExecution: row.meets_auto_execution,
        overallCompliance: row.overall_compliance,
        compliancePercentage: row.compliance_percentage,
        errorBudgetRemaining: row.error_budget_remaining,
        errorBudgetStatus: row.error_budget_status,
        onTrackToMeetSLO: row.on_track_to_meet_slo,
        daysUntilBreach: row.days_until_breach,
        timestamp: new Date(row.timestamp),
      }));
    } finally {
      client.release();
    }
  }

  private async _recordStatus(status: SLOStatus, slo: SLOTarget): Promise<void> {
    const client = await this.pgPool.connect();

    try {
      await client.query(
        `INSERT INTO slo_status_history
         (slo_name, current_error_rate, current_latency_p99, current_availability,
          current_quality_score, current_auto_execution_rate, overall_compliance,
          compliance_percentage, error_budget_remaining, error_budget_status,
          on_track_to_meet_slo, days_until_breach)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          status.sloName,
          status.currentErrorRate,
          status.currentLatencyP99,
          status.currentAvailability,
          status.currentQualityScore,
          status.currentAutoExecutionRate,
          status.overallCompliance,
          status.compliancePercentage,
          status.errorBudgetRemaining,
          status.errorBudgetStatus,
          status.onTrackToMeetSLO,
          status.daysUntilBreach,
        ],
      );
    } finally {
      client.release();
    }
  }

  private async _alertSLOViolation(status: SLOStatus, slo: SLOTarget): Promise<void> {
    this.logger.error('SLO VIOLATION DETECTED', {
      slo: status.sloName,
      compliance: status.overallCompliance,
      compliancePercentage: status.compliancePercentage,
      errorBudgetStatus: status.errorBudgetStatus,
      metrics: {
        errorRate: `${(status.currentErrorRate * 100).toFixed(2)}% (target: ${(slo.targetErrorRate * 100).toFixed(2)}%)`,
        latency: `${status.currentLatencyP99}ms (target: ${slo.targetLatencyP99}ms)`,
        availability: `${(status.currentAvailability * 100).toFixed(2)}% (target: ${(slo.targetAvailability * 100).toFixed(2)}%)`,
        quality: `${(status.currentQualityScore * 100).toFixed(0)}% (target: ${(slo.targetQualityScore * 100).toFixed(0)}%)`,
        autoExecution: `${(status.currentAutoExecutionRate * 100).toFixed(0)}% (target: ${(slo.targetAutoExecutionRate * 100).toFixed(0)}%)`,
      },
    });

    // TODO: Disparar alerta para on-call team
  }
}
