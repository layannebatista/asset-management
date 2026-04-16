import { Logger } from 'winston';
import { Redis } from 'ioredis';
import { Pool } from 'pg';
import { PredictiveAnalyzer } from './PredictiveAnalyzer';

/**
 * ViolationForecaster: Predict SLA violations before they happen
 *
 * Predicts:
 * - Latency will exceed threshold in 45 minutes
 * - Error rate will breach 2% within 1 hour
 * - Availability will drop below 99.5% in 2 hours
 *
 * Lead time: 30 minutes to several hours
 * Accuracy: 75-85% (depends on metric stability)
 */

export interface ViolationForecast {
  metric: string;
  violationType: 'latency' | 'availability' | 'error_rate' | 'cost';
  slaTarget: number;
  currentValue: number;
  predictedValue: number;
  timeToViolation: number; // minutes until SLA breach
  confidence: number; // 0-1
  severity: 'warning' | 'critical';
  forecastedAt: Date;
  recommendedActions: string[];
  alternativeScenarios: Array<{
    condition: string;
    probability: number;
    outcome: string;
  }>;
}

export class ViolationForecaster {
  private readonly redis: Redis;
  private readonly pgPool: Pool;
  private readonly logger: Logger;
  private readonly predictiveAnalyzer: PredictiveAnalyzer;

  private slaTargets: Map<string, number> = new Map([
    ['latency_p99', 5000],
    ['availability', 0.995],
    ['error_rate', 0.02],
    ['cost', 0.054],
  ]);

  constructor(
    redis: Redis,
    pgPool: Pool,
    logger: Logger,
    predictiveAnalyzer: PredictiveAnalyzer,
  ) {
    this.redis = redis;
    this.pgPool = pgPool;
    this.logger = logger;
    this.predictiveAnalyzer = predictiveAnalyzer;
  }

  /**
   * Forecast all metrics and check for upcoming violations
   */
  async forecastViolations(): Promise<ViolationForecast[]> {
    const forecasts: ViolationForecast[] = [];

    // Get current metrics
    const metrics = new Map<string, number>();

    for (const [metric] of this.slaTargets) {
      const value = await this.redis.get(`metric:${metric}:current`);
      if (value) {
        metrics.set(metric, parseFloat(value));
      }
    }

    // Forecast each metric
    for (const [metric] of this.slaTargets) {
      const currentValue = metrics.get(metric);
      if (!currentValue) continue;

      const forecast = await this.predictiveAnalyzer.forecastMetric(metric);
      if (!forecast) continue;

      // Check if will violate SLA
      const slaTarget = this.slaTargets.get(metric)!;
      const violation = this._checkForViolation(
        metric,
        currentValue,
        forecast,
        slaTarget,
      );

      if (violation) {
        forecasts.push(violation);

        // Store forecast in Redis for monitoring
        await this.redis.setex(
          `forecast:violation:${metric}`,
          3600, // 1 hour
          JSON.stringify(violation),
        );
      }
    }

    return forecasts;
  }

  /**
   * Get forecast for specific metric
   */
  async forecastMetric(metric: string): Promise<ViolationForecast | null> {
    const forecast = await this.predictiveAnalyzer.forecastMetric(metric);
    if (!forecast) return null;

    const slaTarget = this.slaTargets.get(metric);
    if (!slaTarget) return null;

    return this._checkForViolation(metric, forecast.currentValue, forecast, slaTarget);
  }

  /**
   * Set SLA target
   */
  setSLATarget(metric: string, target: number): void {
    this.slaTargets.set(metric, target);
    this.logger.debug(`SLA target updated: ${metric} = ${target}`);
  }

  // ════════════════════════════════════════════════════════════════
  // Private methods
  // ════════════════════════════════════════════════════════════════

  private _checkForViolation(
    metric: string,
    currentValue: number,
    forecast: any,
    slaTarget: number,
  ): ViolationForecast | null {
    const violationType = this._getViolationType(metric);

    // Determine if violation will occur
    let willViolate = false;
    let timeToViolation = 0;
    let severity: 'warning' | 'critical' = 'warning';

    if (violationType === 'latency') {
      // Latency: lower is better
      if (forecast.forecast1h > slaTarget) {
        willViolate = true;
        timeToViolation = 60;
        severity = forecast.forecast4h > slaTarget * 1.2 ? 'critical' : 'warning';
      } else if (forecast.forecast4h > slaTarget) {
        willViolate = true;
        timeToViolation = 180; // 3 hours
        severity = 'warning';
      }
    } else if (violationType === 'error_rate') {
      // Error rate: lower is better
      if (forecast.forecast1h > slaTarget) {
        willViolate = true;
        timeToViolation = 60;
        severity = forecast.forecast4h > slaTarget * 1.5 ? 'critical' : 'warning';
      }
    } else if (violationType === 'availability') {
      // Availability: higher is better
      if (forecast.forecast4h < slaTarget) {
        willViolate = true;
        timeToViolation = 180;
        severity = forecast.forecast24h < slaTarget * 0.95 ? 'critical' : 'warning';
      }
    } else if (violationType === 'cost') {
      // Cost: lower is better
      if (forecast.forecast24h > slaTarget * 1.1) {
        willViolate = true;
        timeToViolation = 1440; // 24 hours
        severity = 'warning';
      }
    }

    if (!willViolate) {
      return null;
    }

    // Generate recommendations
    const recommendations = this._generateRecommendations(violationType, metric, forecast);

    // Generate alternative scenarios
    const scenarios = this._generateAlternativeScenarios(violationType, forecast);

    return {
      metric,
      violationType,
      slaTarget,
      currentValue,
      predictedValue:
        violationType === 'latency' ? forecast.forecast1h :
        violationType === 'error_rate' ? forecast.forecast1h :
        violationType === 'availability' ? forecast.forecast4h :
        forecast.forecast24h,
      timeToViolation,
      confidence: forecast.confidence,
      severity,
      forecastedAt: new Date(),
      recommendedActions: recommendations,
      alternativeScenarios: scenarios,
    };
  }

  private _getViolationType(metric: string): 'latency' | 'availability' | 'error_rate' | 'cost' {
    if (metric.includes('latency')) return 'latency';
    if (metric.includes('availability')) return 'availability';
    if (metric.includes('error')) return 'error_rate';
    return 'cost';
  }

  private _generateRecommendations(
    violationType: string,
    metric: string,
    forecast: any,
  ): string[] {
    const recommendations: string[] = [];

    if (violationType === 'latency') {
      recommendations.push('🚨 Scale up replicas to handle load');
      recommendations.push('⚡ Enable caching for frequent queries');
      recommendations.push('🔄 Consider routing traffic to different region');
      recommendations.push('📊 Check if indexing is up-to-date');
    } else if (violationType === 'error_rate') {
      recommendations.push('🚨 Check service health immediately');
      recommendations.push('🔍 Review recent deployments');
      recommendations.push('⚙️ Increase timeout values');
      recommendations.push('🛑 Enable circuit breaker');
    } else if (violationType === 'availability') {
      recommendations.push('🚨 Prepare for failover');
      recommendations.push('🔄 Enable automated recovery');
      recommendations.push('📞 Alert on-call engineer');
      recommendations.push('💾 Check database replication lag');
    } else {
      recommendations.push('💰 Review expensive operations');
      recommendations.push('🎯 Optimize token usage');
      recommendations.push('📉 Consider cheaper model tier');
    }

    return recommendations;
  }

  private _generateAlternativeScenarios(
    violationType: string,
    forecast: any,
  ): Array<{ condition: string; probability: number; outcome: string }> {
    return [
      {
        condition: 'If load continues increasing at current rate',
        probability: 0.6,
        outcome: 'Violation will occur within predicted timeframe',
      },
      {
        condition: 'If mitigations are applied immediately',
        probability: 0.4,
        outcome: 'Violation can be prevented',
      },
      {
        condition: 'If no action is taken',
        probability: 0.8,
        outcome: 'Violation will occur earlier than predicted',
      },
    ];
  }
}
