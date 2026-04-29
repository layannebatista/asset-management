import { Router, Request, Response } from 'express';
import { TokenSavingsAnalyzer } from '../../observability/TokenSavingsAnalyzer';
import { DashboardAggregator } from '../../observability/DashboardAggregator';

export function createMetricsRouter(
  analyzer: TokenSavingsAnalyzer,
  dashboardAggregator?: DashboardAggregator,
): Router {
  const router = Router();

  /**
   * GET /api/v1/metrics/dashboard
   * Get comprehensive super dashboard with all metrics
   */
  router.get('/dashboard', async (req: Request, res: Response) => {
    try {
      if (!dashboardAggregator) {
        return res.status(503).json({
          success: false,
          error: 'Dashboard aggregator not available',
        });
      }

      const daysBack = parseInt(req.query.days as string) || 7;
      const dashboard = await dashboardAggregator.generateDashboard(daysBack);

      res.json({
        success: true,
        data: dashboard,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * GET /api/v1/metrics/dashboard/html
   * Get dashboard as HTML page
   */
  router.get('/dashboard/html', async (req: Request, res: Response) => {
    try {
      if (!dashboardAggregator) {
        return res.status(503).send('Dashboard aggregator not available');
      }

      const daysBack = parseInt(req.query.days as string) || 7;
      const dashboard = await dashboardAggregator.generateDashboard(daysBack);

      const html = generateDashboardHTML(dashboard);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(html);
    } catch (error) {
      res.status(500).send(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  /**
   * GET /api/v1/metrics/token-savings
   * Get token savings summary for the last 7 days (or specified period)
   */
  router.get('/token-savings', async (req: Request, res: Response) => {
    try {
      const daysBack = parseInt(req.query.days as string) || 7;
      const summary = await analyzer.getSummary(daysBack);

      res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * GET /api/v1/metrics/token-savings/recent
   * Get recent token savings records
   */
  router.get('/token-savings/recent', async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const records = await analyzer.getRecentAnalyses(limit);

      res.json({
        success: true,
        count: records.length,
        data: records,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * GET /api/v1/metrics/token-savings/by-type/:analysisType
   * Get token savings breakdown for a specific analysis type
   */
  router.get('/token-savings/by-type/:analysisType', async (req: Request, res: Response) => {
    try {
      const analysisType = Array.isArray(req.params.analysisType)
        ? req.params.analysisType[0]
        : req.params.analysisType;
      const daysBack = parseInt(req.query.days as string) || 7;
      const breakdown = await analyzer.getAnalysisByType(analysisType, daysBack);

      res.json({
        success: true,
        data: breakdown,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  return router;
}

function generateDashboardHTML(dashboard: any): string {
  const statusColor = dashboard.health.status === 'healthy' ? '#10b981' :
                     dashboard.health.status === 'degraded' ? '#f59e0b' : '#ef4444';

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI Intelligence - Super Dashboard</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: #e2e8f0;
      padding: 20px;
      min-height: 100vh;
    }
    .container { max-width: 1600px; margin: 0 auto; }
    .header {
      margin-bottom: 30px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .header h1 { font-size: 2.5em; font-weight: 700; }
    .timestamp { color: #94a3b8; font-size: 0.9em; }
    .status-badge {
      display: inline-block;
      padding: 8px 16px;
      background: ${statusColor};
      color: white;
      border-radius: 8px;
      font-weight: 600;
      text-transform: uppercase;
      font-size: 0.85em;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    .card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 20px;
      backdrop-filter: blur(10px);
      transition: all 0.3s ease;
    }
    .card:hover {
      border-color: #64748b;
      background: #273549;
    }
    .card h2 {
      font-size: 0.95em;
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
    .metric.warning { color: #fbbf24; }
    .metric.critical { color: #f87171; }
    .metric.success { color: #34d399; }
    .subtext { color: #94a3b8; font-size: 0.85em; margin-top: 8px; }
    .model-list {
      list-style: none;
      margin-top: 12px;
    }
    .model-item {
      padding: 8px;
      background: rgba(148, 163, 184, 0.1);
      border-radius: 6px;
      margin-bottom: 6px;
      font-size: 0.85em;
      display: flex;
      justify-content: space-between;
    }
    .model-name { font-weight: 600; }
    .model-score { color: #34d399; }
    .issues {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    .issue-card {
      padding: 16px;
      border-radius: 8px;
      border-left: 4px solid;
    }
    .issue-card.critical {
      background: rgba(248, 113, 113, 0.1);
      border-left-color: #f87171;
    }
    .issue-card.warning {
      background: rgba(251, 191, 36, 0.1);
      border-left-color: #fbbf24;
    }
    .issue-title {
      font-weight: 600;
      margin-bottom: 4px;
    }
    .issue-desc { font-size: 0.85em; color: #cbd5e1; margin-bottom: 8px; }
    .issue-rec { font-size: 0.8em; color: #94a3b8; font-style: italic; }
    .section-title {
      font-size: 1.3em;
      font-weight: 700;
      margin: 30px 0 20px 0;
      color: #f1f5f9;
      border-bottom: 2px solid #334155;
      padding-bottom: 10px;
    }
    .chart-container {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 20px;
    }
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
        <h1>🤖 AI Intelligence Dashboard</h1>
        <p class="timestamp">Atualizado em ${new Date(dashboard.timestamp).toLocaleString('pt-BR')}</p>
      </div>
      <div class="status-badge">${dashboard.health.status.toUpperCase()}</div>
    </div>

    <h2 class="section-title">📊 Status Geral</h2>
    <div class="grid">
      <div class="card">
        <h2>Saúde do Sistema</h2>
        <div class="metric ${dashboard.health.status === 'healthy' ? 'success' : dashboard.health.status === 'degraded' ? 'warning' : 'critical'}">
          ${(dashboard.health.slaComplianceRate * 100).toFixed(1)}%
        </div>
        <div class="subtext">Conformidade SLA</div>
        <div class="subtext">Alertas ativos: ${dashboard.health.activeAlerts}</div>
      </div>

      <div class="card">
        <h2>Qualidade Média</h2>
        <div class="metric ${dashboard.quality.avgQualityScore > 0.85 ? 'success' : dashboard.quality.avgQualityScore > 0.75 ? 'warning' : 'critical'}">
          ${(dashboard.quality.avgQualityScore * 100).toFixed(1)}%
        </div>
        <div class="subtext">Últimos ${dashboard.period.days} dias</div>
      </div>

      <div class="card">
        <h2>Economia de Tokens</h2>
        <div class="metric success">${(dashboard.costs.tokenSavingsUsd).toFixed(2)}</div>
        <div class="subtext">USD economizados</div>
      </div>

      <div class="card">
        <h2>Custo Total</h2>
        <div class="metric">\$${(dashboard.costs.totalCostUsd).toFixed(2)}</div>
        <div class="subtext">Estimativa mensal: \$${(dashboard.costs.estimatedMonthlyCost).toFixed(0)}</div>
      </div>

      <div class="card">
        <h2>Decisões Autônomas</h2>
        <div class="metric">${dashboard.autonomousDecisions.totalDecisions}</div>
        <div class="subtext">Taxa de sucesso: ${(dashboard.autonomousDecisions.successRate).toFixed(1)}%</div>
      </div>

      <div class="card">
        <h2>Confiança Média</h2>
        <div class="metric ${dashboard.explainability.avgConfidenceScore > 0.8 ? 'success' : 'warning'}">
          ${(dashboard.explainability.avgConfidenceScore * 100).toFixed(1)}%
        </div>
        <div class="subtext">Em decisões</div>
      </div>
    </div>

    ${dashboard.topIssues.length > 0 ? `
    <h2 class="section-title">⚠️ Problemas Detectados</h2>
    <div class="issues">
      ${dashboard.topIssues.map(issue => `
        <div class="issue-card ${issue.severity}">
          <div class="issue-title">${issue.title}</div>
          <div class="issue-desc">${issue.description}</div>
          <div class="issue-rec">💡 ${issue.recommendation}</div>
        </div>
      `).join('')}
    </div>
    ` : ''}

    <h2 class="section-title">🏆 Modelos Top</h2>
    <div class="grid">
      ${dashboard.models.topPerformers.map((model, idx) => `
        <div class="card">
          <h2>#${idx + 1} - ${model.model}</h2>
          <div class="metric success">${(model.costEfficiency).toFixed(2)}</div>
          <div class="subtext">Eficiência de custo (qualidade/custo)</div>
          <div style="margin-top: 16px; font-size: 0.9em;">
            <p>📊 Qualidade: ${(model.avgQuality * 100).toFixed(1)}%</p>
            <p>⚡ Latência: ${model.avgLatency.toFixed(0)}ms</p>
            <p>💰 Custo: \$${model.avgCost.toFixed(4)}</p>
            <p>🔄 Execuções: ${model.totalExecutions}</p>
          </div>
        </div>
      `).join('')}
    </div>

    <h2 class="section-title">📈 SLA Status</h2>
    <div class="grid">
      ${dashboard.sla.byMetric.map(metric => `
        <div class="card">
          <h2>${metric.metric}</h2>
          <div class="metric ${metric.status === 'ok' ? 'success' : metric.status === 'warning' ? 'warning' : 'critical'}">
            ${(metric.compliance).toFixed(1)}%
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${Math.min(100, metric.compliance)}%"></div>
          </div>
          <div class="subtext">Violações: ${metric.violations}</div>
        </div>
      `).join('')}
    </div>

    <h2 class="section-title">🎯 Feedback dos Usuários</h2>
    <div class="card">
      <h2>Distribuição de Feedback</h2>
      <div style="margin-top: 16px;">
        <p style="margin-bottom: 8px;">
          👍 Útil: <strong>${dashboard.quality.userFeedback.helpful}</strong>
        </p>
        <p style="margin-bottom: 8px;">
          😐 Neutro: <strong>${dashboard.quality.userFeedback.neutral}</strong>
        </p>
        <p style="margin-bottom: 8px;">
          👎 Não útil: <strong>${dashboard.quality.userFeedback.unhelpful}</strong>
        </p>
      </div>
    </div>

    <div class="footer">
      <p>AI Intelligence Super Dashboard | Período: ${new Date(dashboard.period.from).toLocaleDateString('pt-BR')} a ${new Date(dashboard.period.to).toLocaleDateString('pt-BR')}</p>
    </div>
  </div>
</body>
</html>
  `;
}
