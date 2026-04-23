const DEFAULT_AI_SERVICE_KEY = 'local-ai-service-key';

let currentAnalysis = null;
let dashboardCharts = [];

const analysisTypeSelect = document.getElementById('analysisType');
const dataWindowInput = document.getElementById('dataWindow');
const analyzeBtn = document.getElementById('analyzeBtn');
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
  analyzeBtn.addEventListener('click', executeAnalysis);
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

async function executeAnalysis() {
  const analysisType = analysisTypeSelect.value;
  const dataWindow = parseInt(dataWindowInput.value, 10);

  if (!analysisType || !dataWindow) {
    showError('Escolha o tipo e o período para eu rodar a análise.');
    return;
  }

  showLoading(true);
  hideError();

  try {
    const endpoint = getAnalysisEndpoint(analysisType);
    const payload = getAnalysisPayload(analysisType, dataWindow);
    const response = await safeApiFetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    currentAnalysis = await response.json();
    renderAnalysis(currentAnalysis);
    exportBtn.disabled = false;

    await loadInsightsDashboard();
  } catch (error) {
    showError(`Não consegui executar a análise: ${error.message}`);
    exportBtn.disabled = true;
  } finally {
    showLoading(false);
  }
}

async function loadInsightsDashboard() {
  showLoading(true);
  hideError();

  try {
    const days = 30;

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

    renderInsightsDashboard(tokenEconomy, modelEfficiency, analysisRoi, execSummary);
  } catch (error) {
    showError(`Não consegui carregar os dados de insights: ${error.message}`);
  } finally {
    showLoading(false);
  }
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

function renderInsightsDashboard(tokenEconomy, modelEfficiency, analysisRoi, execSummary) {
  destroyCharts();

  const summary = execSummary.summary || {};
  const metrics = summary.metrics || {};
  const insights = summary.keyInsights || [];
  const recommendation = summary.recommendation || '';

  const models = modelEfficiency.models || [];
  const analyses = analysisRoi.analyses || [];
  const topROI = analysisRoi.topROI || {};
  const totalUsdSaved = analysisRoi.totalUsdSaved || 0;

  const tokenMetrics = tokenEconomy.tokenEconomy || {};
  const financialImpact = tokenEconomy.financialImpact || {};
  const quality = tokenEconomy.quality || {};

  const html = `
    <div class="analysis-result">
      <h3>💡 Inteligência de Negócio - RTK & IA Intelligence</h3>
      <p class="child-note">Análise completa de economia de tokens, eficiência de modelos e ROI das análises.</p>

      <!-- Executive Summary Card -->
      <div class="summary-card">
        <h4>📊 Resumo Executivo (Últimos ${summary.period || '30 dias'})</h4>
        <div class="metrics-grid executive-metrics">
          <div class="metric-card highlight">
            <div class="metric-label">Total de Análises</div>
            <div class="metric-value">${(metrics.totalAnalysesExecuted || 0).toLocaleString('pt-BR')}</div>
          </div>
          <div class="metric-card highlight">
            <div class="metric-label">Tokens Economizados</div>
            <div class="metric-value">${(metrics.tokensSaved || 0).toLocaleString('pt-BR')}</div>
            <div class="metric-help">Com RTK ativado</div>
          </div>
          <div class="metric-card highlight">
            <div class="metric-label">USD Economizados</div>
            <div class="metric-value">$${(metrics.usdSaved || 0).toFixed(2)}</div>
            <div class="metric-help">Economia em custos de API</div>
          </div>
          <div class="metric-card highlight">
            <div class="metric-label">Redução de Tokens</div>
            <div class="metric-value">${(metrics.savingsPercentage || 0).toFixed(1)}%</div>
            <div class="metric-help">Eficiência do RTK</div>
          </div>
          <div class="metric-card highlight">
            <div class="metric-label">Qualidade Mantida</div>
            <div class="metric-value">${(metrics.qualityScore || 0).toFixed(1)}%</div>
            <div class="metric-help">Acurácia do contexto</div>
          </div>
        </div>
        <div class="recommendation-box ${recommendation.includes('✅') ? 'success' : 'warning'}">
          <p>${recommendation}</p>
        </div>
        ${insights.length > 0 ? `
          <div class="insights-list">
            <h5>🎯 Insights Principais:</h5>
            <ul>
              ${insights.map(insight => `<li>${insight}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
      </div>

      <!-- Token Economy Details -->
      <div class="section-card">
        <h4>💰 Economia de Tokens Detalhada</h4>
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-label">Tokens Sem RTK</div>
            <div class="metric-value">${(tokenMetrics.tokensWithoutRTK || 0).toLocaleString('pt-BR')}</div>
            <div class="metric-help">Consumo total de tokens</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Tokens Com RTK</div>
            <div class="metric-value">${(tokenMetrics.tokensWithRTK || 0).toLocaleString('pt-BR')}</div>
            <div class="metric-help">Tokens após otimização</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Tokens Economizados</div>
            <div class="metric-value">${(tokenMetrics.totalTokensSaved || 0).toLocaleString('pt-BR')}</div>
            <div class="metric-help">Diferença: sem RTK - com RTK</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Custo Sem Otimização</div>
            <div class="metric-value">$${(financialImpact.costWithoutOptimization || 0).toFixed(2)}</div>
            <div class="metric-help">Se não usasse RTK</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Custo Com Otimização</div>
            <div class="metric-value">$${(financialImpact.costWithOptimization || 0).toFixed(2)}</div>
            <div class="metric-help">Custo real com RTK</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Economia em USD</div>
            <div class="metric-value">$${(financialImpact.usdSaved || 0).toFixed(2)}</div>
            <div class="metric-help">ROI direto do RTK</div>
          </div>
        </div>
        <div class="charts-grid">
          <div class="chart-card">
            <h5>Comparação: Tokens Com vs Sem RTK</h5>
            <canvas id="tokenComparisonChart"></canvas>
          </div>
          <div class="chart-card">
            <h5>Comparação: Custos Com vs Sem RTK</h5>
            <canvas id="costComparisonChart"></canvas>
          </div>
        </div>
      </div>

      <!-- Model Efficiency -->
      <div class="section-card">
        <h4>🤖 Eficiência dos Modelos</h4>
        <div class="model-efficiency-table">
          <table>
            <thead>
              <tr>
                <th>Modelo</th>
                <th>Execuções</th>
                <th>Tokens Médio</th>
                <th>Redução %</th>
                <th>Acurácia</th>
                <th>Custo/Análise</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${models.length === 0 ? '<tr><td colspan="7" class="no-data">Sem dados de eficiência de modelos</td></tr>' : models.map(model => `
                <tr>
                  <td><strong>${model.model}</strong></td>
                  <td>${model.executions}</td>
                  <td>${model.avgFinalTokens.toLocaleString('pt-BR')}</td>
                  <td>${model.avgReductionPercentage.toFixed(1)}%</td>
                  <td>${model.avgAccuracy.toFixed(1)}%</td>
                  <td>$${model.costPerAnalysis.toFixed(4)}</td>
                  <td><span class="badge ${model.recommendation === 'RECOMENDADO' ? 'badge-success' : 'badge-warning'}">${model.recommendation}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        <div class="charts-grid">
          <div class="chart-card">
            <h5>Eficiência de Modelos (Score)</h5>
            <canvas id="modelEfficiencyChart"></canvas>
          </div>
          <div class="chart-card">
            <h5>Custo Por Análise Por Modelo</h5>
            <canvas id="modelCostChart"></canvas>
          </div>
        </div>
      </div>

      <!-- Analysis ROI -->
      <div class="section-card">
        <h4>📈 ROI Por Tipo de Análise</h4>
        <div class="roi-summary">
          <div class="roi-card">
            <h5>Análise com Maior ROI</h5>
            <p class="roi-type">${topROI.type || 'N/A'}</p>
            <p class="roi-value">${(topROI.roiPercentage || 0).toFixed(1)}% ROI</p>
            <p class="roi-detail">Economizados: $${(topROI.totalUsdSaved || 0).toFixed(2)}</p>
          </div>
          <div class="roi-card">
            <h5>Total Economizado (Todas Análises)</h5>
            <p class="total-saved">$${totalUsdSaved.toFixed(2)}</p>
            <p class="roi-detail">${analyses.length} tipos de análise monitorados</p>
          </div>
        </div>
        <div class="analysis-roi-table">
          <table>
            <thead>
              <tr>
                <th>Tipo de Análise</th>
                <th>Execuções</th>
                <th>Eficiência</th>
                <th>Acurácia</th>
                <th>USD Economizado</th>
                <th>ROI %</th>
                <th>Prioridade</th>
              </tr>
            </thead>
            <tbody>
              ${analyses.length === 0 ? '<tr><td colspan="7" class="no-data">Sem dados de ROI por análise</td></tr>' : analyses.map(analysis => `
                <tr>
                  <td><strong>${analysis.type}</strong></td>
                  <td>${analysis.executions}</td>
                  <td>${analysis.avgEfficiency.toFixed(1)}%</td>
                  <td>${analysis.avgAccuracy.toFixed(1)}%</td>
                  <td>$${analysis.totalUsdSaved.toFixed(2)}</td>
                  <td>${analysis.roiPercentage.toFixed(1)}%</td>
                  <td><span class="badge ${analysis.recommendation === 'ALTA PRIORIDADE' ? 'badge-success' : 'badge-warning'}">${analysis.recommendation}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        <div class="charts-grid">
          <div class="chart-card">
            <h5>ROI Por Tipo de Análise</h5>
            <canvas id="roiChart"></canvas>
          </div>
          <div class="chart-card">
            <h5>USD Economizado Por Análise</h5>
            <canvas id="savingsChart"></canvas>
          </div>
        </div>
      </div>
    </div>
  `;

  analysisContainer.innerHTML = html;
  renderCharts(tokenEconomy, modelEfficiency, analysisRoi);
}

function renderCharts(tokenEconomy, modelEfficiency, analysisRoi) {
  const tokenMetrics = tokenEconomy.tokenEconomy || {};
  const financialImpact = tokenEconomy.financialImpact || {};
  const models = modelEfficiency.models || [];
  const analyses = analysisRoi.analyses || [];

  // Token Comparison Chart
  const tokenCtx = document.getElementById('tokenComparisonChart');
  if (tokenCtx) {
    dashboardCharts.push(new Chart(tokenCtx, {
      type: 'bar',
      data: {
        labels: ['Tokens Sem RTK', 'Tokens Com RTK'],
        datasets: [{
          label: 'Quantidade de Tokens',
          data: [
            tokenMetrics.tokensWithoutRTK || 0,
            tokenMetrics.tokensWithRTK || 0
          ],
          backgroundColor: ['#ef4444', '#22c55e'],
          borderColor: ['#dc2626', '#16a34a'],
          borderWidth: 1,
        }],
      },
      options: {
        responsive: true,
        scales: {
          y: { beginAtZero: true }
        },
      },
    }));
  }

  // Cost Comparison Chart
  const costCtx = document.getElementById('costComparisonChart');
  if (costCtx) {
    dashboardCharts.push(new Chart(costCtx, {
      type: 'bar',
      data: {
        labels: ['Sem Otimização', 'Com RTK'],
        datasets: [{
          label: 'Custo em USD',
          data: [
            financialImpact.costWithoutOptimization || 0,
            financialImpact.costWithOptimization || 0
          ],
          backgroundColor: ['#f87171', '#4ade80'],
          borderColor: ['#dc2626', '#22c55e'],
          borderWidth: 1,
        }],
      },
      options: {
        responsive: true,
        scales: {
          y: { beginAtZero: true }
        },
      },
    }));
  }

  // Model Efficiency Chart
  if (models.length > 0) {
    const modelCtx = document.getElementById('modelEfficiencyChart');
    if (modelCtx) {
      dashboardCharts.push(new Chart(modelCtx, {
        type: 'radar',
        data: {
          labels: models.map(m => m.model),
          datasets: [{
            label: 'Efficiency Score',
            data: models.map(m => m.efficiencyRatio || 0),
            backgroundColor: 'rgba(34, 197, 94, 0.2)',
            borderColor: '#22c55e',
            borderWidth: 2,
            pointBackgroundColor: '#22c55e',
          }],
        },
        options: {
          responsive: true,
          scales: {
            r: {
              beginAtZero: true,
              max: 100,
            }
          },
        },
      }));
    }

    const modelCostCtx = document.getElementById('modelCostChart');
    if (modelCostCtx) {
      dashboardCharts.push(new Chart(modelCostCtx, {
        type: 'bar',
        data: {
          labels: models.map(m => m.model),
          datasets: [{
            label: 'Custo por Análise (USD)',
            data: models.map(m => m.costPerAnalysis),
            backgroundColor: '#3b82f6',
            borderColor: '#1d4ed8',
            borderWidth: 1,
          }],
        },
        options: {
          responsive: true,
          scales: {
            y: { beginAtZero: true }
          },
        },
      }));
    }
  }

  // ROI Chart
  if (analyses.length > 0) {
    const roiCtx = document.getElementById('roiChart');
    if (roiCtx) {
      dashboardCharts.push(new Chart(roiCtx, {
        type: 'doughnut',
        data: {
          labels: analyses.map(a => a.type),
          datasets: [{
            label: 'ROI %',
            data: analyses.map(a => a.roiPercentage),
            backgroundColor: [
              '#ec4899', '#f59e0b', '#8b5cf6', '#06b6d4', '#10b981', '#ef4444'
            ],
          }],
        },
        options: {
          responsive: true,
        },
      }));
    }

    const savingsCtx = document.getElementById('savingsChart');
    if (savingsCtx) {
      dashboardCharts.push(new Chart(savingsCtx, {
        type: 'bar',
        data: {
          labels: analyses.map(a => a.type),
          datasets: [{
            label: 'USD Economizado',
            data: analyses.map(a => a.totalUsdSaved),
            backgroundColor: '#10b981',
            borderColor: '#059669',
            borderWidth: 1,
          }],
        },
        options: {
          responsive: true,
          scales: {
            y: { beginAtZero: true }
          },
        },
      }));
    }
  }
}

function renderAnalysis(analysis) {
  // Placeholder for analysis rendering
  const html = `
    <div class="analysis-result">
      <h3>📊 Resultado da Análise</h3>
      <pre>${JSON.stringify(analysis, null, 2)}</pre>
    </div>
  `;
  analysisContainer.innerHTML = html;
}

function destroyCharts() {
  dashboardCharts.forEach(chart => chart.destroy());
  dashboardCharts = [];
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
  if (!currentAnalysis) {
    showError('Nenhuma análise para exportar');
    return;
  }

  const json = JSON.stringify(currentAnalysis, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `analise-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// Placeholder functions for analysis endpoints
function getAnalysisEndpoint(type) {
  const endpoints = {
    'observability': '/api/v1/analysis/observability',
    'test-intelligence': '/api/v1/analysis/test-intelligence',
    'cicd': '/api/v1/analysis/cicd',
    'incident': '/api/v1/analysis/incident',
    'risk': '/api/v1/analysis/risk',
  };
  return endpoints[type] || '/api/v1/analysis/observability';
}

function getAnalysisPayload(type, window) {
  return {
    analysisType: type,
    dataWindow: window,
    timestamp: new Date().toISOString(),
  };
}
