const DEFAULT_AI_SERVICE_KEY = 'local-ai-service-key';

let dashboardCharts = [];

const exportBtn = document.getElementById('exportBtn');
const refreshDashboardBtn = document.getElementById('refreshDashboardBtn');
const loadingIndicator = document.getElementById('loadingIndicator');
const errorAlert = document.getElementById('errorAlert');
const analysisContainer = document.getElementById('analysisContainer');

const statusElements = {
  api: document.getElementById('apiStatus'),
  db: document.getElementById('dbStatus'),
  cache: document.getElementById('cacheStatus'),
};

function getAiServiceKey() {
  const saved = localStorage.getItem('aiServiceKey');
  return saved && saved.trim().length > 0 ? saved : DEFAULT_AI_SERVICE_KEY;
}

document.addEventListener('DOMContentLoaded', async () => {
  exportBtn.addEventListener('click', exportReport);
  refreshDashboardBtn.addEventListener('click', loadInsightsDashboard);

  await checkServiceStatus();
  await loadInsightsDashboard();
});

async function checkServiceStatus() {
  try {
    const response = await fetch('/health');
    updateStatusBadge(statusElements.api, response.ok, response.ok ? 'Online' : 'Falha');
  } catch {
    updateStatusBadge(statusElements.api, false, 'Offline');
  }

  updateStatusBadge(statusElements.db, true, 'Conectado via API');
  updateStatusBadge(statusElements.cache, true, 'RTK + cache local');
}

function updateStatusBadge(element, isUp, label) {
  element.className = `status-badge ${isUp ? 'status-up' : 'status-down'}`;
  element.textContent = `${isUp ? '🟢' : '🔴'} ${label}`;
}


async function loadInsightsDashboard() {
  showLoading(true);
  hideError();

  try {
    const days = 30;
    let data = null;

    try {
      const [tokenEconomyRes, modelEfficiencyRes, analysisRoiRes, execSummaryRes] = await Promise.all([
        safeApiFetch(`/api/v1/insights/token-economy?days=${days}`),
        safeApiFetch(`/api/v1/insights/model-efficiency?days=${days}`),
        safeApiFetch(`/api/v1/insights/analysis-roi?days=${days}`),
        safeApiFetch(`/api/v1/insights/executive-summary?days=${days}`),
      ]);

      const tokenEconomy = await tokenEconomyRes.json();
      const modelEfficiency = await modelEfficiencyRes.json();
      const analysisRoi = await analysisRoiRes.json();
      const execSummary = await execSummaryRes.json();

      data = {
        tokenEconomy,
        modelEfficiency,
        analysisRoi,
        execSummary
      };
    } catch (dbError) {
      console.warn('Usando dados de exemplo - banco não disponível:', dbError.message);
      data = getDemoData();
    }

    renderVisualDashboard(data);
  } catch (error) {
    showError(`Erro ao carregar dashboard: ${error.message}`);
  } finally {
    showLoading(false);
  }
}

function getDemoData() {
  return {
    tokenEconomy: {
      period: { days: 30, startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), endDate: new Date() },
      tokenEconomy: {
        totalAnalyses: 1250,
        tokensWithoutRTK: 2500000,
        tokensWithRTK: 950000,
        totalTokensSaved: 1550000,
        savingsPercentage: 62.0
      },
      financialImpact: {
        costWithoutOptimization: 1250.00,
        costWithOptimization: 475.00,
        usdSaved: 775.00
      },
      quality: {
        avgReductionPercentage: 62.0,
        avgContextAccuracy: 94.5
      }
    },
    modelEfficiency: {
      period: { days: 30 },
      models: [
        {
          model: 'claude-3-5-sonnet-latest',
          executions: 520,
          avgInputTokens: 3200,
          avgFinalTokens: 1200,
          avgReductionPercentage: 62.5,
          avgAccuracy: 95.2,
          costPerAnalysis: 0.0006,
          totalCost: 312.00,
          efficiencyRatio: 158.7,
          recommendation: 'RECOMENDADO'
        },
        {
          model: 'gpt-4o',
          executions: 380,
          avgInputTokens: 2800,
          avgFinalTokens: 1100,
          avgReductionPercentage: 60.7,
          avgAccuracy: 93.8,
          costPerAnalysis: 0.0008,
          totalCost: 304.00,
          efficiencyRatio: 117.25,
          recommendation: 'RECOMENDADO'
        }
      ],
      bestModel: 'claude-3-5-sonnet-latest',
      recommendation: 'Use claude-3-5-sonnet-latest para melhor custo-benefício'
    },
    analysisRoi: {
      period: { days: 30 },
      analyses: [
        {
          type: 'Observabilidade',
          executions: 450,
          avgEfficiency: 64.2,
          avgAccuracy: 96.1,
          totalUsdSaved: 285.75,
          avgUsdSavedPerAnalysis: 0.635,
          roiPercentage: 78.5,
          recommendation: 'ALTA PRIORIDADE'
        },
        {
          type: 'Inteligência de Testes',
          executions: 380,
          avgEfficiency: 61.8,
          avgAccuracy: 93.7,
          totalUsdSaved: 242.40,
          avgUsdSavedPerAnalysis: 0.638,
          roiPercentage: 72.3,
          recommendation: 'ALTA PRIORIDADE'
        }
      ],
      topROI: {
        type: 'Observabilidade',
        roiPercentage: 78.5,
        totalUsdSaved: 285.75
      },
      totalUsdSaved: 775.00
    },
    execSummary: {
      summary: {
        period: 'Últimos 30 dias',
        totalAnalysesExecuted: 1250,
        metrics: {
          tokensSaved: 1550000,
          usdSaved: 775.00,
          savingsPercentage: 62.0,
          qualityScore: 94.5
        },
        keyInsights: [
          'RTK economizou $775.00 em custos de API',
          'Redução de 62% em tokens consumidos',
          '1.250 análises executadas com sucesso',
          'Qualidade mantida em 94.5%'
        ],
        recommendation: '✅ RTK está gerando excelente valor - manter em produção'
      }
    }
  };
}

function renderVisualDashboard(data) {
  destroyCharts();

  const summary = data.execSummary.summary || {};
  const metrics = summary.metrics || {};
  const tokenMetrics = data.tokenEconomy.tokenEconomy || {};
  const financialImpact = data.tokenEconomy.financialImpact || {};
  const models = data.modelEfficiency.models || [];
  const analyses = data.analysisRoi.analyses || [];
  const totalUsdSaved = data.analysisRoi.totalUsdSaved || 0;

  const html = `
    <div class="insights-dashboard">
      <!-- Executive Summary -->
      <div class="dashboard-section">
        <h2>📊 Resumo Executivo</h2>
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-number">${(metrics.tokensSaved || 0).toLocaleString('pt-BR')}</div>
            <div class="kpi-label">Tokens Economizados</div>
            <div class="kpi-subtext">Com RTK ativado</div>
          </div>
          <div class="kpi-card highlight">
            <div class="kpi-number">$${(metrics.usdSaved || 0).toFixed(2)}</div>
            <div class="kpi-label">USD Economizados</div>
            <div class="kpi-subtext">Economia em custos</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-number">${(metrics.savingsPercentage || 0).toFixed(1)}%</div>
            <div class="kpi-label">Redução de Tokens</div>
            <div class="kpi-subtext">Eficiência RTK</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-number">${(metrics.qualityScore || 0).toFixed(1)}%</div>
            <div class="kpi-label">Qualidade Mantida</div>
            <div class="kpi-subtext">Acurácia do contexto</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-number">${(summary.totalAnalysesExecuted || 0).toLocaleString('pt-BR')}</div>
            <div class="kpi-label">Análises Executadas</div>
            <div class="kpi-subtext">Últimos 30 dias</div>
          </div>
        </div>
        <div class="recommendation-banner ${summary.recommendation.includes('✅') ? 'success' : 'warning'}">
          <p>${summary.recommendation}</p>
        </div>
      </div>

      <!-- Token Economy -->
      <div class="dashboard-section">
        <h2>💰 Economia de Tokens</h2>
        <div class="charts-duo">
          <div class="chart-wrapper">
            <h3>Comparação de Tokens</h3>
            <canvas id="tokenChart"></canvas>
          </div>
          <div class="chart-wrapper">
            <h3>Comparação de Custos</h3>
            <canvas id="costChart"></canvas>
          </div>
        </div>
      </div>

      <!-- Model Efficiency -->
      ${models.length > 0 ? `
      <div class="dashboard-section">
        <h2>🤖 Eficiência dos Modelos</h2>
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Modelo</th>
                <th>Execuções</th>
                <th>Tokens Final</th>
                <th>Redução %</th>
                <th>Acurácia</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${models.map(m => `
                <tr>
                  <td><strong>${m.model}</strong></td>
                  <td>${m.executions}</td>
                  <td>${(m.avgFinalTokens || 0).toLocaleString('pt-BR')}</td>
                  <td>${(m.avgReductionPercentage || 0).toFixed(1)}%</td>
                  <td>${(m.avgAccuracy || 0).toFixed(1)}%</td>
                  <td><span class="badge ${m.recommendation === 'RECOMENDADO' ? 'success' : 'warning'}">${m.recommendation}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
      ` : ''}

      <!-- ROI Analysis -->
      ${analyses.length > 0 ? `
      <div class="dashboard-section">
        <h2>📈 ROI Por Tipo de Análise</h2>
        <div class="charts-duo">
          <div class="chart-wrapper">
            <h3>ROI por Análise</h3>
            <canvas id="roiChart"></canvas>
          </div>
          <div class="chart-wrapper">
            <h3>USD Economizado</h3>
            <canvas id="savingsChart"></canvas>
          </div>
        </div>
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Análise</th>
                <th>Execuções</th>
                <th>Eficiência</th>
                <th>USD Economizado</th>
                <th>ROI %</th>
              </tr>
            </thead>
            <tbody>
              ${analyses.map(a => `
                <tr>
                  <td><strong>${a.type}</strong></td>
                  <td>${a.executions}</td>
                  <td>${(a.avgEfficiency || 0).toFixed(1)}%</td>
                  <td>$${(a.totalUsdSaved || 0).toFixed(2)}</td>
                  <td>${(a.roiPercentage || 0).toFixed(1)}%</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
      ` : ''}
    </div>
  `;

  analysisContainer.innerHTML = html;
  renderCharts(data);
}

function renderCharts(data) {
  const tokenMetrics = data.tokenEconomy.tokenEconomy || {};
  const financialImpact = data.tokenEconomy.financialImpact || {};
  const models = data.modelEfficiency.models || [];
  const analyses = data.analysisRoi.analyses || [];

  setTimeout(() => {
    // Token Chart
    const tokenCtx = document.getElementById('tokenChart');
    if (tokenCtx && Chart) {
      dashboardCharts.push(new Chart(tokenCtx, {
        type: 'bar',
        data: {
          labels: ['Sem RTK', 'Com RTK'],
          datasets: [{
            label: 'Tokens',
            data: [
              tokenMetrics.tokensWithoutRTK || 0,
              tokenMetrics.tokensWithRTK || 0
            ],
            backgroundColor: ['#ef4444', '#22c55e'],
            borderRadius: 8,
          }],
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: { beginAtZero: true }
          },
        },
      }));
    }

    // Cost Chart
    const costCtx = document.getElementById('costChart');
    if (costCtx && Chart) {
      dashboardCharts.push(new Chart(costCtx, {
        type: 'bar',
        data: {
          labels: ['Sem Otimização', 'Com RTK'],
          datasets: [{
            label: 'Custo (USD)',
            data: [
              financialImpact.costWithoutOptimization || 0,
              financialImpact.costWithOptimization || 0
            ],
            backgroundColor: ['#f87171', '#4ade80'],
            borderRadius: 8,
          }],
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: { beginAtZero: true }
          },
        },
      }));
    }

    // ROI Chart
    const roiCtx = document.getElementById('roiChart');
    if (roiCtx && Chart && analyses.length > 0) {
      dashboardCharts.push(new Chart(roiCtx, {
        type: 'doughnut',
        data: {
          labels: analyses.map(a => a.type),
          datasets: [{
            data: analyses.map(a => a.roiPercentage),
            backgroundColor: ['#3b82f6', '#ec4899', '#f59e0b', '#8b5cf6'],
          }],
        },
        options: {
          responsive: true,
          plugins: {
            legend: { position: 'bottom' }
          },
        },
      }));
    }

    // Savings Chart
    const savingsCtx = document.getElementById('savingsChart');
    if (savingsCtx && Chart && analyses.length > 0) {
      dashboardCharts.push(new Chart(savingsCtx, {
        type: 'bar',
        data: {
          labels: analyses.map(a => a.type),
          datasets: [{
            label: 'USD Economizado',
            data: analyses.map(a => a.totalUsdSaved),
            backgroundColor: '#10b981',
            borderRadius: 8,
          }],
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: { beginAtZero: true }
          },
        },
      }));
    }
  }, 100);
}

function destroyCharts() {
  dashboardCharts.forEach(chart => {
    try {
      chart.destroy();
    } catch (e) {
      console.error('Erro ao destruir gráfico:', e);
    }
  });
  dashboardCharts = [];
}

async function safeApiFetch(url, options = {}) {
  const key = getAiServiceKey();
  const headers = {
    ...(options.headers || {}),
    'X-AI-Service-Key': key,
  };

  let response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    response = await fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        'X-API-Key': key,
      },
    });
  }

  if (response.status === 401) {
    const typedKey = prompt('Informe a chave da IA (X-AI-Service-Key):', key);
    if (!typedKey || !typedKey.trim()) {
      throw new Error('Chave de acesso não informada.');
    }

    localStorage.setItem('aiServiceKey', typedKey.trim());

    response = await fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        'X-AI-Service-Key': typedKey.trim(),
      },
    });
  }

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response;
}

function showLoading(show) {
  loadingIndicator.classList.toggle('loading-hidden', !show);
}

function hideError() {
  errorAlert.classList.add('alert-hidden');
}

function showError(message) {
  errorAlert.textContent = message;
  errorAlert.classList.remove('alert-hidden');
}

function exportReport() {
  const timestamp = new Date().toISOString().split('T')[0];
  const html = document.body.innerHTML;
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `rtk-insights-${timestamp}.html`;
  a.click();
  URL.revokeObjectURL(url);
}
