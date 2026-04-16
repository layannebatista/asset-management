import { Logger } from 'winston';
import { Redis } from 'ioredis';
import { ViolationForecast, ViolationForecaster } from './ViolationForecaster';

/**
 * ProactiveAlerts: Send alerts before violations occur
 *
 * Sends notifications:
 * - 60 minutes before latency violation
 * - 30 minutes before error rate spike
 * - 2-4 hours before availability drop
 *
 * Alert channels:
 * - Email to on-call
 * - Slack to #incidents
 * - PagerDuty escalation (if critical)
 * - Dashboard update
 */

export interface Alert {
  id: string;
  type: 'preventive' | 'reactive';
  severity: 'warning' | 'critical';
  title: string;
  message: string;
  metric: string;
  forecast: ViolationForecast;
  channels: AlertChannel[];
  createdAt: Date;
  sentAt?: Date;
  acknowledged: boolean;
  acknowledgingUser?: string;
}

export type AlertChannel = 'email' | 'slack' | 'pagerduty' | 'dashboard' | 'sms';

export class ProactiveAlerts {
  private readonly redis: Redis;
  private readonly logger: Logger;
  private readonly violationForecaster: ViolationForecaster;

  private alertHistory: Map<string, Alert> = new Map();
  private sentAlerts: Set<string> = new Set();

  constructor(redis: Redis, logger: Logger, violationForecaster: ViolationForecaster) {
    this.redis = redis;
    this.logger = logger;
    this.violationForecaster = violationForecaster;
  }

  /**
   * Check for upcoming violations and send alerts
   */
  async checkAndAlert(): Promise<Alert[]> {
    this.logger.info('🔔 Checking for upcoming SLA violations...');

    const forecasts = await this.violationForecaster.forecastViolations();
    const alerts: Alert[] = [];

    for (const forecast of forecasts) {
      // Check if we already sent alert for this
      const alertKey = `${forecast.metric}:${forecast.timeToViolation}`;

      if (this.sentAlerts.has(alertKey)) {
        this.logger.debug(`Alert already sent: ${alertKey}`);
        continue;
      }

      // Create alert
      const alert = this._createAlert(forecast);

      // Send to configured channels
      await this._sendAlert(alert);

      alerts.push(alert);
      this.sentAlerts.add(alertKey);

      // Store in Redis
      await this.redis.setex(
        `alert:${alert.id}`,
        86400, // 24 hours
        JSON.stringify(alert),
      );
    }

    this.logger.info(`✅ Alert check complete`, {
      alertsSent: alerts.length,
      potentialViolations: forecasts.length,
    });

    return alerts;
  }

  /**
   * Get alert by ID
   */
  async getAlert(alertId: string): Promise<Alert | null> {
    const cached = await this.redis.get(`alert:${alertId}`);
    if (cached) {
      return JSON.parse(cached);
    }
    return this.alertHistory.get(alertId) || null;
  }

  /**
   * Acknowledge alert
   */
  async acknowledgeAlert(alertId: string, userId: string): Promise<void> {
    const alert = await this.getAlert(alertId);

    if (alert) {
      alert.acknowledged = true;
      alert.acknowledgingUser = userId;

      // Update Redis
      await this.redis.setex(`alert:${alertId}`, 86400, JSON.stringify(alert));

      this.logger.info('✅ Alert acknowledged', {
        alertId,
        userId,
        metric: alert.metric,
      });
    }
  }

  /**
   * Get active (unacknowledged) alerts
   */
  async getActiveAlerts(): Promise<Alert[]> {
    const alerts: Alert[] = [];

    // Scan Redis for alert keys
    let cursor = '0';
    const scanResult = await this.redis.scan(cursor, 'MATCH', 'alert:*', 'COUNT', 100);

    for (const key of scanResult[1]) {
      const alertJson = await this.redis.get(key);
      if (alertJson) {
        const alert = JSON.parse(alertJson);
        if (!alert.acknowledged) {
          alerts.push(alert);
        }
      }
    }

    return alerts;
  }

  /**
   * Get alert statistics
   */
  async getAlertStats(): Promise<{
    totalAlerts: number;
    activeAlerts: number;
    acknowledgedAlerts: number;
    alertsBySeverity: Map<string, number>;
    alertsByMetric: Map<string, number>;
  }> {
    const activeAlerts = await this.getActiveAlerts();

    const stats = {
      totalAlerts: this.alertHistory.size,
      activeAlerts: activeAlerts.length,
      acknowledgedAlerts: this.alertHistory.size - activeAlerts.length,
      alertsBySeverity: new Map<string, number>(),
      alertsByMetric: new Map<string, number>(),
    };

    for (const [, alert] of this.alertHistory) {
      stats.alertsBySeverity.set(
        alert.severity,
        (stats.alertsBySeverity.get(alert.severity) || 0) + 1,
      );
      stats.alertsByMetric.set(
        alert.metric,
        (stats.alertsByMetric.get(alert.metric) || 0) + 1,
      );
    }

    return stats;
  }

  // ════════════════════════════════════════════════════════════════
  // Private methods
  // ════════════════════════════════════════════════════════════════

  private _createAlert(forecast: ViolationForecast): Alert {
    const alertId = `alert:${forecast.metric}:${Date.now()}`;

    const title = this._generateTitle(forecast);
    const message = this._generateMessage(forecast);
    const channels = this._determineChannels(forecast);

    const alert: Alert = {
      id: alertId,
      type: 'preventive',
      severity: forecast.severity,
      title,
      message,
      metric: forecast.metric,
      forecast,
      channels,
      createdAt: new Date(),
      acknowledged: false,
    };

    this.alertHistory.set(alertId, alert);

    return alert;
  }

  private async _sendAlert(alert: Alert): Promise<void> {
    this.logger.warn(`📢 Sending alert: ${alert.title}`, {
      severity: alert.severity,
      metric: alert.metric,
      channels: alert.channels,
    });

    for (const channel of alert.channels) {
      try {
        await this._sendToChannel(alert, channel);
      } catch (error) {
        this.logger.error(`Failed to send alert to ${channel}`, {
          error: (error as Error).message,
          alertId: alert.id,
        });
      }
    }

    alert.sentAt = new Date();
  }

  private async _sendToChannel(alert: Alert, channel: AlertChannel): Promise<void> {
    const { title, message, forecast } = alert;

    switch (channel) {
      case 'slack':
        // In production, post to Slack webhook
        this.logger.info(`📱 Slack notification: ${title}`);
        // await slackClient.postMessage(...);
        break;

      case 'email':
        // In production, send email
        this.logger.info(`📧 Email notification: ${title}`);
        // await emailService.send(...);
        break;

      case 'pagerduty':
        // In production, trigger PagerDuty incident
        if (alert.severity === 'critical') {
          this.logger.info(`🚨 PagerDuty incident: ${title}`);
          // await pagerdutyClient.triggerIncident(...);
        }
        break;

      case 'dashboard':
        // Store in Redis for dashboard consumption
        await this.redis.lpush('alerts:dashboard', JSON.stringify({
          ...alert,
          timeToViolation: forecast.timeToViolation,
        }));
        break;

      case 'sms':
        // In production, send SMS for critical alerts
        if (alert.severity === 'critical') {
          this.logger.info(`📲 SMS notification: ${title}`);
          // await smsService.send(...);
        }
        break;
    }
  }

  private _generateTitle(forecast: ViolationForecast): string {
    const timeStr = forecast.timeToViolation < 60
      ? `${forecast.timeToViolation}m`
      : `${Math.floor(forecast.timeToViolation / 60)}h`;

    return `⚠️ [${forecast.severity.toUpperCase()}] ${forecast.metric} SLA violation predicted in ${timeStr}`;
  }

  private _generateMessage(forecast: ViolationForecast): string {
    const violationType = forecast.violationType.replace('_', ' ');
    const targetStr = forecast.slaTarget < 1
      ? `${(forecast.slaTarget * 100).toFixed(1)}%`
      : forecast.slaTarget.toFixed(0);

    return (
      `Current ${violationType}: ${forecast.currentValue.toFixed(2)}\n` +
      `Predicted: ${forecast.predictedValue.toFixed(2)}\n` +
      `SLA Target: ${targetStr}\n` +
      `Time to violation: ${forecast.timeToViolation} minutes\n` +
      `Confidence: ${(forecast.confidence * 100).toFixed(0)}%\n\n` +
      `Recommended actions:\n` +
      forecast.recommendedActions.map((a, i) => `${i + 1}. ${a}`).join('\n')
    );
  }

  private _determineChannels(forecast: ViolationForecast): AlertChannel[] {
    const channels: AlertChannel[] = ['dashboard'];

    // Always send to dashboard
    if (forecast.timeToViolation < 60) {
      // Less than 1 hour: escalate
      channels.push('slack', 'email');
      if (forecast.severity === 'critical') {
        channels.push('pagerduty', 'sms');
      }
    } else if (forecast.timeToViolation < 180) {
      // 1-3 hours: notify team
      channels.push('slack', 'email');
    } else {
      // More than 3 hours: just email
      channels.push('email');
    }

    return channels;
  }
}
