import { Logger } from 'winston';
import { Redis } from 'ioredis';
import { Pool } from 'pg';

/**
 * PredictiveAnalyzer: Learn patterns from historical data
 *
 * Tracks:
 * - Common incident patterns and their precursors
 * - Performance degradation trends
 * - Anomaly seasonality (e.g., Friday deployments cause 3x more incidents)
 * - Recovery patterns
 *
 * Uses:
 * - Time-series forecasting (ARIMA-like patterns)
 * - Pattern matching from history
 * - Correlation analysis
 */

export interface PatternSignature {
  id: string;
  pattern: string;
  precursors: Array<{
    metric: string;
    threshold: number;
    leadTimeMinutes: number;
  }>;
  historicalFrequency: number; // times this pattern occurred
  affectedMetrics: string[];
  typicalDuration: number; // ms
  recoveryTime: number; // ms
  lastOccurrence: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface AnomalyPattern {
  timestamp: Date;
  metric: string;
  value: number;
  baseline: number;
  deviation: number; // std deviations from baseline
  severity: 'warning' | 'critical';
  possiblePatterns: Array<{
    pattern: PatternSignature;
    confidence: number; // 0-1
  }>;
}

export interface ForecastResult {
  metric: string;
  currentValue: number;
  forecast1h: number;
  forecast4h: number;
  forecast24h: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  confidence: number; // 0-1
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export class PredictiveAnalyzer {
  private readonly redis: Redis;
  private readonly pgPool: Pool;
  private readonly logger: Logger;

  private patterns: Map<string, PatternSignature> = new Map();
  private baselines: Map<string, { mean: number; stdDev: number }> = new Map();
  private learningWindow = 30; // days of historical data to analyze

  constructor(redis: Redis, pgPool: Pool, logger: Logger) {
    this.redis = redis;
    this.pgPool = pgPool;
    this.logger = logger;
  }

  /**
   * Learn patterns from historical data
   */
  async learnPatterns(): Promise<void> {
    this.logger.info('🧠 Learning patterns from historical data...');

    const client = await this.pgPool.connect();

    try {
      // Query last 30 days of SLA metrics
      const metricsResult = await client.query(
        `SELECT metric, value, timestamp
         FROM sla_metrics
         WHERE timestamp > NOW() - INTERVAL '${this.learningWindow} days'
         ORDER BY metric, timestamp`,
      );

      const violationsResult = await client.query(
        `SELECT metric, timestamp, severity, duration
         FROM sla_violations
         WHERE timestamp > NOW() - INTERVAL '${this.learningWindow} days'
         ORDER BY timestamp DESC`,
      );

      // Calculate baselines per metric
      this._calculateBaselines(metricsResult.rows);

      // Learn patterns from violations
      this._learnViolationPatterns(violationsResult.rows);

      // Detect seasonal patterns
      await this._detectSeasonalPatterns();

      this.logger.info('✅ Pattern learning complete', {
        patternsFound: this.patterns.size,
        metricsTracked: this.baselines.size,
      });
    } finally {
      client.release();
    }
  }

  /**
   * Detect anomalies and match against learned patterns
   */
  async detectAnomalies(metrics: Map<string, number>): Promise<AnomalyPattern[]> {
    const anomalies: AnomalyPattern[] = [];

    for (const [metric, value] of metrics) {
      const baseline = this.baselines.get(metric);

      if (!baseline) {
        continue; // Not enough historical data
      }

      // Calculate z-score (standard deviations from mean)
      const zScore = (value - baseline.mean) / Math.max(baseline.stdDev, 0.001);

      if (Math.abs(zScore) > 2) {
        // > 2 std dev = anomaly
        const possiblePatterns = this._matchPatterns(metric, value, zScore);

        anomalies.push({
          timestamp: new Date(),
          metric,
          value,
          baseline: baseline.mean,
          deviation: zScore,
          severity: Math.abs(zScore) > 3 ? 'critical' : 'warning',
          possiblePatterns,
        });

        // Log anomaly
        await this.redis.lpush(`anomalies:${metric}`, JSON.stringify({
          value,
          zScore,
          timestamp: new Date().toISOString(),
        }));
      }
    }

    return anomalies;
  }

  /**
   * Forecast metric values 1h, 4h, 24h ahead
   */
  async forecastMetric(metric: string): Promise<ForecastResult | null> {
    const client = await this.pgPool.connect();

    try {
      // Get last 48 hours of data
      const result = await client.query(
        `SELECT value, timestamp
         FROM sla_metrics
         WHERE metric = $1
         AND timestamp > NOW() - INTERVAL '48 hours'
         ORDER BY timestamp DESC
         LIMIT 288`,
        [metric],
      );

      if (result.rows.length < 50) {
        return null; // Not enough data
      }

      const values = result.rows.reverse().map(r => r.value);

      // Simple trend analysis + seasonal adjustment
      const trend = this._calculateTrend(values);
      const forecast = this._forecastARIMA(values, trend);

      const baseline = this.baselines.get(metric);
      if (!baseline) return null;

      const currentValue = values[values.length - 1];
      const forecast1h = forecast.next;
      const forecast4h = forecast.next + (forecast.trend * 3);
      const forecast24h = forecast.next + (forecast.trend * 23);

      // Assess risk
      let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';

      if (forecast4h > baseline.mean + baseline.stdDev * 3) {
        riskLevel = 'critical';
      } else if (forecast4h > baseline.mean + baseline.stdDev * 2) {
        riskLevel = 'high';
      } else if (forecast4h > baseline.mean + baseline.stdDev) {
        riskLevel = 'medium';
      }

      return {
        metric,
        currentValue,
        forecast1h,
        forecast4h,
        forecast24h,
        trend: trend > 0 ? 'increasing' : trend < 0 ? 'decreasing' : 'stable',
        confidence: 0.75 + Math.min(values.length / 1000, 0.2),
        riskLevel,
      };
    } finally {
      client.release();
    }
  }

  /**
   * Get pattern by ID
   */
  getPattern(patternId: string): PatternSignature | undefined {
    return this.patterns.get(patternId);
  }

  /**
   * Get all learned patterns
   */
  getAllPatterns(): PatternSignature[] {
    return Array.from(this.patterns.values());
  }

  /**
   * Get metrics baselines
   */
  getBaselines(): Map<string, { mean: number; stdDev: number }> {
    return this.baselines;
  }

  // ════════════════════════════════════════════════════════════════
  // Private methods
  // ════════════════════════════════════════════════════════════════

  private _calculateBaselines(
    metrics: Array<{ metric: string; value: number; timestamp: Date }>,
  ): void {
    const byMetric = new Map<string, number[]>();

    for (const row of metrics) {
      if (!byMetric.has(row.metric)) {
        byMetric.set(row.metric, []);
      }
      byMetric.get(row.metric)!.push(row.value);
    }

    for (const [metric, values] of byMetric) {
      const mean = values.reduce((a, b) => a + b) / values.length;
      const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance);

      this.baselines.set(metric, { mean, stdDev });
    }
  }

  private _learnViolationPatterns(
    violations: Array<{ metric: string; timestamp: Date; severity: string; duration: number }>,
  ): void {
    const patternMap = new Map<string, number>();

    // Group violations by metric
    for (const violation of violations) {
      const key = `${violation.metric}_${violation.severity}`;
      patternMap.set(key, (patternMap.get(key) || 0) + 1);
    }

    // Create pattern signatures
    for (const [key, frequency] of patternMap) {
      const [metric, severity] = key.split('_');

      this.patterns.set(key, {
        id: key,
        pattern: `${metric}_violation`,
        precursors: [
          {
            metric,
            threshold: this.baselines.get(metric)?.mean || 0 * 1.5,
            leadTimeMinutes: 5,
          },
        ],
        historicalFrequency: frequency,
        affectedMetrics: [metric],
        typicalDuration: 10 * 60 * 1000, // 10 minutes
        recoveryTime: 5 * 60 * 1000, // 5 minutes
        lastOccurrence: new Date(),
        severity: severity as 'low' | 'medium' | 'high' | 'critical',
      });
    }
  }

  private async _detectSeasonalPatterns(): Promise<void> {
    // Check for patterns by day of week, hour of day, etc.
    const client = await this.pgPool.connect();

    try {
      const result = await client.query(
        `SELECT
          EXTRACT(DOW FROM timestamp) as day_of_week,
          EXTRACT(HOUR FROM timestamp) as hour_of_day,
          COUNT(*) as incident_count
         FROM sla_violations
         WHERE timestamp > NOW() - INTERVAL '90 days'
         GROUP BY day_of_week, hour_of_day
         ORDER BY incident_count DESC
         LIMIT 10`,
      );

      // Friday (5) at certain hours might have more incidents
      for (const row of result.rows) {
        if (row.incident_count > 3) {
          this.patterns.set(`seasonal_${row.day_of_week}_${row.hour_of_day}`, {
            id: `seasonal_${row.day_of_week}_${row.hour_of_day}`,
            pattern: `seasonal_risk_${row.day_of_week}_${row.hour_of_day}`,
            precursors: [],
            historicalFrequency: row.incident_count,
            affectedMetrics: ['all'],
            typicalDuration: 15 * 60 * 1000,
            recoveryTime: 10 * 60 * 1000,
            lastOccurrence: new Date(),
            severity: row.incident_count > 5 ? 'high' : 'medium',
          });
        }
      }
    } finally {
      client.release();
    }
  }

  private _matchPatterns(metric: string, value: number, zScore: number): Array<{
    pattern: PatternSignature;
    confidence: number;
  }> {
    const matches: Array<{ pattern: PatternSignature; confidence: number }> = [];

    for (const [, pattern] of this.patterns) {
      // Check if metric matches
      if (!pattern.affectedMetrics.includes(metric) && !pattern.affectedMetrics.includes('all')) {
        continue;
      }

      // Confidence based on z-score and historical frequency
      const zScoreConfidence = Math.min(Math.abs(zScore) / 5, 1);
      const frequencyConfidence = Math.min(pattern.historicalFrequency / 20, 1);
      const confidence = (zScoreConfidence * 0.7 + frequencyConfidence * 0.3);

      if (confidence > 0.3) {
        matches.push({ pattern, confidence });
      }
    }

    return matches.sort((a, b) => b.confidence - a.confidence);
  }

  private _calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;

    // Simple linear regression
    const n = Math.min(values.length, 24); // Last 24 hours
    const recent = values.slice(-n);

    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumX2 = 0;

    for (let i = 0; i < recent.length; i++) {
      sumX += i;
      sumY += recent[i];
      sumXY += i * recent[i];
      sumX2 += i * i;
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return slope;
  }

  private _forecastARIMA(
    values: number[],
    trend: number,
  ): { next: number; trend: number } {
    // Simplified ARIMA: use last value + trend
    const lastValue = values[values.length - 1];
    const nextValue = lastValue + trend;

    return {
      next: Math.max(0, nextValue),
      trend,
    };
  }
}
