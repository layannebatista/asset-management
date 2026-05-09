import { SprintReport } from '../types/report.types';

/**
 * HTMLFormatter: Gera relatório em HTML visual
 */
export class HTMLFormatter {
  static format(report: SprintReport): string {
    const statusColor = {
      excellent: '#10b981',
      good: '#3b82f6',
      attention: '#f59e0b',
      critical: '#ef4444',
    };

    const color = statusColor[report.health.status];

    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sprint Report - ${report.period.projectName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: #e2e8f0;
      padding: 20px;
      min-height: 100vh;
    }
    .container { max-width: 1400px; margin: 0 auto; }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
    }
    .header h1 { font-size: 2.5em; font-weight: 700; }
    .status-badge {
      display: inline-block;
      padding: 10px 20px;
      background: ${color};
      color: white;
      border-radius: 8px;
      font-weight: 600;
      text-transform: uppercase;
      font-size: 0.9em;
    }
    .period-info { color: #94a3b8; font-size: 0.95em; margin-top: 8px; }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    .card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 20px;
      backdrop-filter: blur(10px);
    }
    .card h3 {
      font-size: 0.85em;
      color: #cbd5e1;
      margin-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .metric {
      font-size: 2.5em;
      font-weight: 700;
      color: #f1f5f9;
      margin: 8px 0;
    }
    .metric.success { color: #34d399; }
    .metric.warning { color: #fbbf24; }
    .metric.critical { color: #f87171; }
    .subtext { color: #94a3b8; font-size: 0.85em; margin-top: 8px; }
    .section-title {
      font-size: 1.3em;
      font-weight: 700;
      margin: 30px 0 20px 0;
      color: #f1f5f9;
      border-bottom: 2px solid #334155;
      padding-bottom: 10px;
    }
    .issue-card {
      padding: 16px;
      border-radius: 8px;
      border-left: 4px solid;
      margin-bottom: 12px;
    }
    .issue-card.critical {
      background: rgba(248, 113, 113, 0.1);
      border-left-color: #f87171;
    }
    .issue-card.warning {
      background: rgba(251, 191, 36, 0.1);
      border-left-color: #fbbf24;
    }
    .issue-title { font-weight: 600; margin-bottom: 4px; }
    .issue-desc { font-size: 0.85em; color: #cbd5e1; margin-bottom: 8px; }
    .issue-rec { font-size: 0.8em; color: #94a3b8; font-style: italic; }
    .recommendation-card {
      padding: 16px;
      background: rgba(52, 211, 153, 0.1);
      border-left: 4px solid #34d399;
      border-radius: 8px;
      margin-bottom: 12px;
    }
    .rec-title { font-weight: 600; margin-bottom: 4px; }
    .rec-action { color: #34d399; margin: 8px 0; }
    .progress-bar {
      width: 100%;
      height: 8px;
      background: #334155;
      border-radius: 4px;
      overflow: hidden;
      margin-top: 8px;
    }
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #34d399, #06b6d4);
      transition: width 0.3s ease;
    }
    .footer {
      text-align: center;
      color: #64748b;
      font-size: 0.85em;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #334155;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <h1>📊 Sprint Report</h1>
        <p class="period-info">${report.period.projectName} • ${this.formatDate(report.period.startDate)} to ${this.formatDate(report.period.endDate)}</p>
      </div>
      <div class="status-badge">${report.health.status.toUpperCase()}</div>
    </div>

    <h2 class="section-title">🎯 Overview</h2>
    <div class="grid">
      <div class="card">
        <h3>Overall Status</h3>
        <div class="metric ${report.health.status === 'excellent' || report.health.status === 'good' ? 'success' : 'critical'}">
          ${report.summary.totalTests}
        </div>
        <div class="subtext">Total Tests Executed</div>
      </div>

      <div class="card">
        <h3>Test Pass Rate</h3>
        <div class="metric ${report.summary.testPassRate > 95 ? 'success' : report.summary.testPassRate > 80 ? 'warning' : 'critical'}">
          ${report.summary.testPassRate.toFixed(1)}%
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${report.summary.testPassRate}%"></div>
        </div>
      </div>

      <div class="card">
        <h3>CI/CD Pipelines</h3>
        <div class="metric">${report.summary.deploymentCount}</div>
        <div class="subtext">Successful Deployments</div>
      </div>

      <div class="card">
        <h3>Performance</h3>
        <div class="metric ${report.summary.performanceStatus === 'healthy' ? 'success' : 'warning'}">
          ${report.summary.performanceStatus.toUpperCase()}
        </div>
        <div class="subtext">System Performance</div>
      </div>
    </div>

    ${
      report.issues.length > 0
        ? `
    <h2 class="section-title">⚠️ Issues Detected</h2>
    <div>
      ${report.issues
        .map(
          (issue) => `
      <div class="issue-card ${issue.severity}">
        <div class="issue-title">${issue.title}</div>
        <div class="issue-desc">${issue.description}</div>
        <div class="issue-rec">💡 ${issue.recommendation}</div>
      </div>
      `,
        )
        .join('')}
    </div>
    `
        : ''
    }

    ${
      report.tests
        ? `
    <h2 class="section-title">🧪 Testing Metrics</h2>
    <div class="grid">
      <div class="card">
        <h3>Total Tests</h3>
        <div class="metric">${report.tests.total}</div>
      </div>
      <div class="card">
        <h3>Passed</h3>
        <div class="metric success">${report.tests.passed}</div>
      </div>
      <div class="card">
        <h3>Failed</h3>
        <div class="metric ${report.tests.failed > 0 ? 'critical' : 'success'}">${report.tests.failed}</div>
      </div>
      <div class="card">
        <h3>Flaky Tests</h3>
        <div class="metric ${report.tests.flaky > 0 ? 'warning' : 'success'}">${report.tests.flaky}</div>
      </div>
    </div>
    `
        : ''
    }

    ${
      report.recommendations.length > 0
        ? `
    <h2 class="section-title">🎯 Recommendations</h2>
    <div>
      ${report.recommendations
        .map(
          (rec) => `
      <div class="recommendation-card">
        <div class="rec-title">[${rec.priority.toUpperCase()}] ${rec.action}</div>
        <div class="rec-action">Rationale: ${rec.rationale}</div>
        <div class="subtext">Expected Impact: ${rec.expectedImpact} | Effort: ${rec.effort}</div>
      </div>
      `,
        )
        .join('')}
    </div>
    `
        : ''
    }

    <div class="footer">
      <p>Sprint Report Generated on ${new Date().toLocaleString()}</p>
      <p>Period: ${report.period.daysCount} days</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  private static formatDate(date: Date): string {
    return date.toLocaleDateString('pt-BR');
  }
}
