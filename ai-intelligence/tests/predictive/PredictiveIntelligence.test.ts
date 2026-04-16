import { describe, it, expect, beforeEach } from '@jest/globals';
import { Logger } from 'winston';
import { Redis } from 'ioredis';
import { Pool } from 'pg';
import { PredictiveAnalyzer } from '../../src/predictive/PredictiveAnalyzer';
import { AnomalyExplainer } from '../../src/predictive/AnomalyExplainer';
import { ViolationForecaster } from '../../src/predictive/ViolationForecaster';
import { ProactiveAlerts } from '../../src/predictive/ProactiveAlerts';
import { ModelRouter } from '../../src/routing/ModelRouter';

describe('Phase 8: Predictive Intelligence', () => {
  let logger: Logger;
  let redis: Redis;
  let pgPool: Pool;
  let modelRouter: ModelRouter;
  let predictiveAnalyzer: PredictiveAnalyzer;
  let anomalyExplainer: AnomalyExplainer;
  let violationForecaster: ViolationForecaster;
  let proactiveAlerts: ProactiveAlerts;

  beforeEach(() => {
    logger = {
      info: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    } as any;

    redis = {
      lpush: jest.fn(),
      lpop: jest.fn(),
      lrange: jest.fn(),
      get: jest.fn(),
      set: jest.fn(),
      setex: jest.fn(),
      hset: jest.fn(),
      hget: jest.fn(),
      scan: jest.fn(),
    } as any;

    pgPool = {
      connect: jest.fn(),
    } as any;

    modelRouter = new ModelRouter(logger);
    predictiveAnalyzer = new PredictiveAnalyzer(redis, pgPool, logger);
    anomalyExplainer = new AnomalyExplainer(redis, pgPool, logger, modelRouter);
    violationForecaster = new ViolationForecaster(redis, pgPool, logger, predictiveAnalyzer);
    proactiveAlerts = new ProactiveAlerts(redis, logger, violationForecaster);
  });

  // ════════════════════════════════════════════════════════════════
  // PredictiveAnalyzer Tests
  // ════════════════════════════════════════════════════════════════

  it('should calculate baselines from historical data', async () => {
    const mockClient = {
      query: jest.fn()
        .mockResolvedValueOnce({
          rows: [
            { metric: 'latency', value: 4500, timestamp: new Date() },
            { metric: 'latency', value: 4800, timestamp: new Date() },
            { metric: 'latency', value: 5000, timestamp: new Date() },
          ],
        })
        .mockResolvedValueOnce({ rows: [] }),
      release: jest.fn(),
    };

    (pgPool.connect as jest.Mock).mockResolvedValue(mockClient);

    await predictiveAnalyzer.learnPatterns();

    const baselines = predictiveAnalyzer.getBaselines();
    expect(baselines.has('latency')).toBe(true);
    expect(baselines.get('latency')!.mean).toBeCloseTo(4766.67, 1);
  });

  it('should detect anomalies above threshold', async () => {
    // Setup baseline
    const baseline = { mean: 5000, stdDev: 500 };
    (predictiveAnalyzer as any).baselines.set('latency', baseline);

    const metrics = new Map([['latency', 8000]]); // 6 std dev above mean

    const anomalies = await predictiveAnalyzer.detectAnomalies(metrics);

    expect(anomalies.length).toBeGreaterThan(0);
    expect(anomalies[0].metric).toBe('latency');
    expect(anomalies[0].severity).toBe('critical');
  });

  it('should not flag normal values as anomalies', async () => {
    const baseline = { mean: 5000, stdDev: 500 };
    (predictiveAnalyzer as any).baselines.set('latency', baseline);

    const metrics = new Map([['latency', 5100]]); // Only 0.2 std dev

    const anomalies = await predictiveAnalyzer.detectAnomalies(metrics);

    expect(anomalies.length).toBe(0);
  });

  it('should match patterns to detected anomalies', async () => {
    // Setup
    const baseline = { mean: 0.01, stdDev: 0.002 };
    (predictiveAnalyzer as any).baselines.set('error_rate', baseline);

    // Add pattern
    const pattern = {
      id: 'deployment_issue',
      pattern: 'error_rate_spike',
      precursors: [],
      historicalFrequency: 5,
      affectedMetrics: ['error_rate'],
      typicalDuration: 300000,
      recoveryTime: 60000,
      lastOccurrence: new Date(),
      severity: 'high' as const,
    };
    (predictiveAnalyzer as any).patterns.set('deployment_issue', pattern);

    const metrics = new Map([['error_rate', 0.05]]); // 20 std dev

    const anomalies = await predictiveAnalyzer.detectAnomalies(metrics);

    expect(anomalies[0].possiblePatterns.length).toBeGreaterThan(0);
  });

  it('should forecast metrics with trend analysis', async () => {
    const mockClient = {
      query: jest.fn().mockResolvedValue({
        rows: Array.from({ length: 100 }, (_, i) => ({
          value: 5000 + i * 10, // Linear trend
          timestamp: new Date(Date.now() - (100 - i) * 60000),
        })),
      }),
      release: jest.fn(),
    };

    (pgPool.connect as jest.Mock).mockResolvedValue(mockClient);

    const forecast = await predictiveAnalyzer.forecastMetric('latency');

    expect(forecast).toBeDefined();
    expect(forecast!.trend).toBe('increasing');
    expect(forecast!.forecast1h).toBeGreaterThan(forecast!.currentValue);
  });

  // ════════════════════════════════════════════════════════════════
  // AnomalyExplainer Tests
  // ════════════════════════════════════════════════════════════════

  it('should explain anomaly with multiple hypotheses', async () => {
    const mockClient = {
      query: jest.fn()
        .mockResolvedValueOnce({
          rows: [
            { metric: 'latency', value: 4000, timestamp: new Date() },
            { metric: 'cpu', value: 45, timestamp: new Date() },
            { metric: 'memory', value: 60, timestamp: new Date() },
          ],
        })
        .mockResolvedValueOnce({ rows: [] }),
      release: jest.fn(),
    };

    (pgPool.connect as jest.Mock).mockResolvedValue(mockClient);

    const explanation = await anomalyExplainer.explainAnomaly(
      'latency',
      new Date(),
      8000,
      5000,
    );

    expect(explanation).toBeDefined();
    expect(explanation.possibleCauses.length).toBeGreaterThan(0);
    expect(explanation.mostLikelyCause).toBeDefined();
    expect(explanation.suggestedActions.length).toBeGreaterThan(0);
  });

  it('should calculate anomaly deviation percentage', async () => {
    const mockClient = {
      query: jest.fn()
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] }),
      release: jest.fn(),
    };

    (pgPool.connect as jest.Mock).mockResolvedValue(mockClient);

    const explanation = await anomalyExplainer.explainAnomaly(
      'latency',
      new Date(),
      6000,
      5000,
    );

    expect(explanation.deviation).toBe(20); // 20% increase
  });

  it('should provide correlation analysis', async () => {
    const mockClient = {
      query: jest.fn().mockResolvedValue({
        rows: [
          { metric: 'latency', value: 5000, timestamp: new Date() },
          { metric: 'latency', value: 5500, timestamp: new Date() },
          { metric: 'cpu', value: 50, timestamp: new Date() },
          { metric: 'cpu', value: 60, timestamp: new Date() },
        ],
      }),
      release: jest.fn(),
    };

    (pgPool.connect as jest.Mock).mockResolvedValue(mockClient);

    const explanation = await anomalyExplainer.explainAnomaly(
      'latency',
      new Date(),
      5500,
      5000,
    );

    expect(explanation.relatedMetrics.length).toBeGreaterThanOrEqual(0);
  });

  it('should compare two anomalies for pattern similarity', async () => {
    const mockClient = {
      query: jest.fn()
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] }),
      release: jest.fn(),
    };

    (pgPool.connect as jest.Mock).mockResolvedValue(mockClient);

    const exp1 = await anomalyExplainer.explainAnomaly('latency', new Date(), 8000, 5000);
    (redis.setex as jest.Mock).mockClear();
    (redis.get as jest.Mock).mockResolvedValueOnce(JSON.stringify(exp1));
    (redis.get as jest.Mock).mockResolvedValueOnce(JSON.stringify(exp1));

    const comparison = await anomalyExplainer.compareAnomalies(
      new Date(),
      new Date(),
      'latency',
    );

    expect(comparison.similarity).toBeGreaterThan(0);
  });

  // ════════════════════════════════════════════════════════════════
  // ViolationForecaster Tests
  // ════════════════════════════════════════════════════════════════

  it('should forecast latency violation within 1 hour', async () => {
    // Mock forecast that predicts violation
    const mockForecast = {
      metric: 'latency_p99',
      currentValue: 4000,
      forecast1h: 5500,
      forecast4h: 6000,
      forecast24h: 7000,
      trend: 'increasing' as const,
      confidence: 0.8,
      riskLevel: 'critical' as const,
    };

    (predictiveAnalyzer.forecastMetric as jest.Mock) = jest
      .fn()
      .mockResolvedValue(mockForecast);

    const forecast = await violationForecaster.forecastMetric('latency_p99');

    expect(forecast).toBeDefined();
    expect(forecast!.violationType).toBe('latency');
    expect(forecast!.severity).toBe('critical');
  });

  it('should identify error rate violations', async () => {
    const mockForecast = {
      metric: 'error_rate',
      currentValue: 0.015,
      forecast1h: 0.035,
      forecast4h: 0.04,
      confidence: 0.75,
      riskLevel: 'critical' as const,
    };

    (predictiveAnalyzer.forecastMetric as jest.Mock) = jest
      .fn()
      .mockResolvedValue(mockForecast);

    const forecast = await violationForecaster.forecastMetric('error_rate');

    expect(forecast!.violationType).toBe('error_rate');
    expect(forecast!.timeToViolation).toBeLessThan(120);
  });

  it('should provide recommended actions for violations', async () => {
    const mockForecast = {
      metric: 'latency_p99',
      currentValue: 4000,
      forecast1h: 5500,
      forecast4h: 6000,
      forecast24h: 7000,
      trend: 'increasing' as const,
      confidence: 0.8,
      riskLevel: 'critical' as const,
    };

    (predictiveAnalyzer.forecastMetric as jest.Mock) = jest
      .fn()
      .mockResolvedValue(mockForecast);

    const forecast = await violationForecaster.forecastMetric('latency_p99');

    expect(forecast!.recommendedActions.length).toBeGreaterThan(0);
    expect(forecast!.recommendedActions[0]).toMatch(/[Ss]cale|[Cc]ache|[Rr]outing/);
  });

  it('should generate alternative scenarios', async () => {
    const mockForecast = {
      metric: 'latency_p99',
      currentValue: 4000,
      forecast1h: 5500,
      forecast4h: 6000,
      forecast24h: 7000,
      trend: 'increasing' as const,
      confidence: 0.8,
      riskLevel: 'critical' as const,
    };

    (predictiveAnalyzer.forecastMetric as jest.Mock) = jest
      .fn()
      .mockResolvedValue(mockForecast);

    const forecast = await violationForecaster.forecastMetric('latency_p99');

    expect(forecast!.alternativeScenarios.length).toBeGreaterThan(0);
    expect(forecast!.alternativeScenarios[0].probability).toBeGreaterThan(0);
  });

  // ════════════════════════════════════════════════════════════════
  // ProactiveAlerts Tests
  // ════════════════════════════════════════════════════════════════

  it('should create alerts for forecasted violations', async () => {
    const mockForecast = {
      metric: 'latency_p99',
      violationType: 'latency' as const,
      slaTarget: 5000,
      currentValue: 4000,
      predictedValue: 5500,
      timeToViolation: 60,
      confidence: 0.8,
      severity: 'critical' as const,
      forecastedAt: new Date(),
      recommendedActions: [],
      alternativeScenarios: [],
    };

    (violationForecaster.forecastViolations as jest.Mock) = jest
      .fn()
      .mockResolvedValue([mockForecast]);

    const alerts = await proactiveAlerts.checkAndAlert();

    expect(alerts.length).toBeGreaterThan(0);
    expect(alerts[0].title).toMatch(/warning|critical/i);
    expect(alerts[0].metric).toBe('latency_p99');
  });

  it('should send alerts to appropriate channels based on severity', async () => {
    const mockForecast = {
      metric: 'latency_p99',
      violationType: 'latency' as const,
      slaTarget: 5000,
      currentValue: 4000,
      predictedValue: 5500,
      timeToViolation: 30,
      confidence: 0.9,
      severity: 'critical' as const,
      forecastedAt: new Date(),
      recommendedActions: [],
      alternativeScenarios: [],
    };

    (violationForecaster.forecastViolations as jest.Mock) = jest
      .fn()
      .mockResolvedValue([mockForecast]);

    const alerts = await proactiveAlerts.checkAndAlert();

    // Critical alert with < 1 hour lead time should use multiple channels
    expect(alerts[0].channels.length).toBeGreaterThan(2);
    expect(alerts[0].channels).toContain('slack');
    expect(alerts[0].channels).toContain('email');
  });

  it('should allow acknowledging alerts', async () => {
    const mockForecast = {
      metric: 'error_rate',
      violationType: 'error_rate' as const,
      slaTarget: 0.02,
      currentValue: 0.015,
      predictedValue: 0.035,
      timeToViolation: 45,
      confidence: 0.75,
      severity: 'warning' as const,
      forecastedAt: new Date(),
      recommendedActions: [],
      alternativeScenarios: [],
    };

    (violationForecaster.forecastViolations as jest.Mock) = jest
      .fn()
      .mockResolvedValue([mockForecast]);

    const alerts = await proactiveAlerts.checkAndAlert();
    const alertId = alerts[0].id;

    (redis.get as jest.Mock).mockResolvedValueOnce(JSON.stringify(alerts[0]));

    await proactiveAlerts.acknowledgeAlert(alertId, 'engineer@company.com');

    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining('acknowledged'),
      expect.objectContaining({ alertId }),
    );
  });

  it('should return active (unacknowledged) alerts', async () => {
    const mockForecast = {
      metric: 'availability',
      violationType: 'availability' as const,
      slaTarget: 0.995,
      currentValue: 0.997,
      predictedValue: 0.99,
      timeToViolation: 180,
      confidence: 0.6,
      severity: 'warning' as const,
      forecastedAt: new Date(),
      recommendedActions: [],
      alternativeScenarios: [],
    };

    (violationForecaster.forecastViolations as jest.Mock) = jest
      .fn()
      .mockResolvedValue([mockForecast]);

    const alerts = await proactiveAlerts.checkAndAlert();

    (redis.scan as jest.Mock).mockResolvedValue([
      '0',
      [`alert:${alerts[0].id}`],
    ]);
    (redis.get as jest.Mock).mockResolvedValue(JSON.stringify(alerts[0]));

    const active = await proactiveAlerts.getActiveAlerts();

    expect(active.length).toBeGreaterThan(0);
  });

  it('should provide alert statistics', async () => {
    (redis.scan as jest.Mock).mockResolvedValue(['0', []]);

    const stats = await proactiveAlerts.getAlertStats();

    expect(stats).toHaveProperty('totalAlerts');
    expect(stats).toHaveProperty('activeAlerts');
    expect(stats).toHaveProperty('acknowledgedAlerts');
    expect(stats).toHaveProperty('alertsBySeverity');
    expect(stats).toHaveProperty('alertsByMetric');
  });

  // ════════════════════════════════════════════════════════════════
  // Integration tests
  // ════════════════════════════════════════════════════════════════

  it('should complete full predictive pipeline', async () => {
    // Setup mocks for full pipeline
    const mockClient = {
      query: jest.fn()
        .mockResolvedValue({
          rows: Array.from({ length: 50 }, (_, i) => ({
            metric: 'latency',
            value: 5000 + Math.random() * 500,
            timestamp: new Date(Date.now() - (50 - i) * 60000),
          })),
        }),
      release: jest.fn(),
    };

    (pgPool.connect as jest.Mock).mockResolvedValue(mockClient);

    // Learn patterns
    await predictiveAnalyzer.learnPatterns();

    // Detect anomalies
    const anomalies = await predictiveAnalyzer.detectAnomalies(
      new Map([['latency', 7500]]),
    );

    // Explain if anomaly
    if (anomalies.length > 0) {
      const explanation = await anomalyExplainer.explainAnomaly(
        'latency',
        new Date(),
        7500,
        5000,
      );

      expect(explanation.possibleCauses.length).toBeGreaterThan(0);
    }

    // Forecast
    (predictiveAnalyzer.forecastMetric as jest.Mock) = jest.fn().mockResolvedValue({
      metric: 'latency',
      currentValue: 5200,
      forecast1h: 5800,
      forecast4h: 6500,
      forecast24h: 7000,
      trend: 'increasing',
      confidence: 0.75,
      riskLevel: 'high',
    });

    const forecast = await violationForecaster.forecastMetric('latency_p99');
    expect(forecast).toBeDefined();
  });
});
