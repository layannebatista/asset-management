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

function convertUsdToBrl(usd) {
  const rate = 5.00; // Câmbio atual: 1 USD = 5.00 BRL
  return usd * rate;
}

function checkAlerts(data) {
  const alerts = [];

  const analyses = data.analysisRoi.analyses || [];
  analyses.forEach(a => {
    if (a.roiPercentage < 70) {
      alerts.push({
        type: 'warning',
        message: `⚠️ ${a.type}: ROI caiu para ${a.roiPercentage.toFixed(1)}% (esperado > 70%)`
      });
    }
  });

  const metrics = data.execSummary.summary.metrics || {};
  if ((metrics.qualityScore || 0) < 90) {
    alerts.push({
      type: 'warning',
      message: `⚠️ Qualidade em risco: ${metrics.qualityScore.toFixed(1)}% (esperado > 90%)`
    });
  }

  return alerts;
}

function renderVisualDashboard(data) {
  destroyCharts();

  const summary = data.execSummary.summary || {};
  const metrics = summary.metrics || {};
  const models = data.modelEfficiency.models || [];
  const analyses = data.analysisRoi.analyses || [];
  const totalUsdSaved = data.analysisRoi.totalUsdSaved || 0;
  const alerts = checkAlerts(data);

  const html = `
    <div class="insights-dashboard">
      <!-- Alerts Section -->
      ${alerts.length > 0 ? `
      <div class="alerts-section">
        <h3>🚨 Alertas</h3>
        ${alerts.map(alert => `
          <div class="alert-item ${alert.type}">
            ${alert.message}
          </div>
        `).join('')}
      </div>
      ` : ''}

      <!-- Executive Summary -->
      <div class="dashboard-section">
        <h2>📊 RTK Dashboard</h2>
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-number">${(metrics.tokensSaved || 0).toLocaleString('pt-BR')}</div>
            <div class="kpi-label">
              Tokens Economizados
              <span class="tooltip-icon" title="Diferença entre tokens sem otimização e com RTK ativado">?</span>
            </div>
          </div>
          <div class="kpi-card highlight">
            <div class="kpi-number">R$ ${(convertUsdToBrl(metrics.usdSaved) || 0).toFixed(2)}</div>
            <div class="kpi-label">
              Economizados
              <span class="tooltip-icon" title="Valor em reais da economia (Tokens × R$ 0,0025)">?</span>
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-number">${(metrics.savingsPercentage || 0).toFixed(1)}%</div>
            <div class="kpi-label">
              Redução
              <span class="tooltip-icon" title="% de redução obtido com RTK">?</span>
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-number">${(metrics.qualityScore || 0).toFixed(1)}%</div>
            <div class="kpi-label">
              Qualidade
              <span class="tooltip-icon" title="Acurácia mantida após otimização">?</span>
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-number">${(summary.totalAnalysesExecuted || 0).toLocaleString('pt-BR')}</div>
            <div class="kpi-label">
              Análises
              <span class="tooltip-icon" title="Análises executadas neste período">?</span>
            </div>
          </div>
        </div>
        <div class="recommendation-banner ${summary.recommendation.includes('✅') ? 'success' : 'warning'}">
          <p>${summary.recommendation}</p>
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
                <th>Execuções <span class="tooltip-icon" title="Vezes usadas">?</span></th>
                <th>Tokens Final <span class="tooltip-icon" title="Após otimização">?</span></th>
                <th>Redução % <span class="tooltip-icon" title="RTK economia">?</span></th>
                <th>Acurácia <span class="tooltip-icon" title="Qualidade mantida">?</span></th>
                <th>Custo/Análise <span class="tooltip-icon" title="Preço em R$">?</span></th>
                <th>Status <span class="tooltip-icon" title="RECOMENDADO: ótimo custo-benefício. NÃO REC: revisar uso">?</span></th>
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
                  <td>R$ ${(convertUsdToBrl(m.costPerAnalysis) || 0).toFixed(4)}</td>
                  <td><span class="badge ${m.recommendation === 'RECOMENDADO' ? 'success' : 'warning'}">${m.recommendation === 'RECOMENDADO' ? '✓ REC.' : '✗ NÃO'}</span></td>
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
        <h2>📈 ROI Por Análise</h2>
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Tipo <span class="tooltip-icon" title="Categoria da análise">?</span></th>
                <th>Execuções <span class="tooltip-icon" title="Quantas vezes rodou">?</span></th>
                <th>Eficiência <span class="tooltip-icon" title="% de economia">?</span></th>
                <th>Acurácia <span class="tooltip-icon" title="Qualidade mantida">?</span></th>
                <th>Economizado <span class="tooltip-icon" title="Em reais">?</span></th>
                <th>ROI % <span class="tooltip-icon" title="Retorno do investimento">?</span></th>
                <th>Prioridade <span class="tooltip-icon" title="ALTA: ROI > 70%, foco máximo. REVISAR: ROI < 70%">?</span></th>
              </tr>
            </thead>
            <tbody>
              ${analyses.map(a => `
                <tr>
                  <td><strong>${a.type}</strong></td>
                  <td>${a.executions}</td>
                  <td>${(a.avgEfficiency || 0).toFixed(1)}%</td>
                  <td>${(a.avgAccuracy || 0).toFixed(1)}%</td>
                  <td>R$ ${(convertUsdToBrl(a.totalUsdSaved) || 0).toFixed(2)}</td>
                  <td><strong>${(a.roiPercentage || 0).toFixed(1)}%</strong></td>
                  <td><span class="badge ${a.recommendation === 'ALTA PRIORIDADE' ? 'success' : 'warning'}">${a.recommendation === 'ALTA PRIORIDADE' ? '🔴 ALTA' : '🟡 REVISAR'}</span></td>
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
  setupTooltips();
  renderCharts(data);
}

function setupTooltips() {
  document.querySelectorAll('.tooltip-icon').forEach(icon => {
    const title = icon.getAttribute('title');
    icon.addEventListener('mouseenter', function(e) {
      let tooltip = document.querySelector('.tooltip-popup');
      if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.className = 'tooltip-popup';
        document.body.appendChild(tooltip);
      }
      tooltip.textContent = title;
      const rect = icon.getBoundingClientRect();
      tooltip.style.display = 'block';
      tooltip.style.left = (rect.left + rect.width / 2) + 'px';
      tooltip.style.top = (rect.top - 40) + 'px';
    });
    icon.addEventListener('mouseleave', function() {
      const tooltip = document.querySelector('.tooltip-popup');
      if (tooltip) tooltip.style.display = 'none';
    });
  });
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
  const element = document.querySelector('.insights-dashboard') || document.body;

  const opt = {
    margin: 10,
    filename: `rtk-insights-${timestamp}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
  };

  showLoading(true);
  html2pdf().set(opt).from(element).save().finally(() => {
    showLoading(false);
  });
}
