let currentReport = null;
let charts = [];

const startDateInput = document.getElementById('startDate');
const endDateInput = document.getElementById('endDate');
const generateBtn = document.getElementById('generateBtn');
const downloadPptBtn = document.getElementById('downloadPptBtn');
const loadingIndicator = document.getElementById('loadingIndicator');
const errorAlert = document.getElementById('errorAlert');
const reportContainer = document.getElementById('reportContainer');

function setDefaultDates() {
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - 14 * 24 * 60 * 60 * 1000);
  startDateInput.valueAsDate = startDate;
  endDateInput.valueAsDate = endDate;
}

document.addEventListener('DOMContentLoaded', () => {
  setDefaultDates();
  generateBtn.addEventListener('click', generateReport);
  downloadPptBtn.addEventListener('click', downloadPowerPoint);
});

async function generateReport() {
  const startDate = startDateInput.value;
  const endDate = endDateInput.value;

  if (!startDate || !endDate) {
    showError('Preencha as duas datas para eu montar o relatório.');
    return;
  }

  if (new Date(startDate) >= new Date(endDate)) {
    showError('A data de início precisa ser menor que a data final.');
    return;
  }

  showLoading(true);
  hideError();

  try {
    const response = await fetch('/api/reports/sprint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        startDate,
        endDate,
        projectName: 'asset-management',
        format: 'json',
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    currentReport = await response.json();
    displayReport(currentReport);
    downloadPptBtn.disabled = false;
  } catch (error) {
    showError(`Não consegui gerar o relatório: ${error.message}`);
    downloadPptBtn.disabled = true;
  } finally {
    showLoading(false);
  }
}

function displayReport(report) {
  destroyCharts();

  const tests = report.tests || {};
  const cicd = report.cicd || {};
  const ai = report.ai || {};
  const k6 = report.performance?.k6;

  let html = '';

  if (Array.isArray(report.sourceWarnings) && report.sourceWarnings.length > 0) {
    html += `
      <section class="report-section">
        <div class="alert alert-warning">
          <strong>Algumas fontes estão incompletas:</strong>
          <ul class="warnings-list">
            ${report.sourceWarnings.map((w) => `<li>${w}</li>`).join('')}
          </ul>
        </div>
      </section>
    `;
  }

  html += `
    <section class="report-section">
      <h2>Resumo da Sprint (explicado de forma simples)</h2>
      <div class="summary-stats">
        <div class="summary-stat">
          <div class="summary-stat-label">Situação geral</div>
          <div class="summary-stat-value">
            <span class="health-badge health-${report.health.status}">${getHealthStatusLabel(report.health.status)}</span>
          </div>
          <div class="summary-stat-help">Verde = bom, amarelo = atenção, vermelho = urgente.</div>
        </div>
        <div class="summary-stat">
          <div class="summary-stat-label">Testes que passaram</div>
          <div class="summary-stat-value">${(tests.passRate || 0).toFixed(1)}%</div>
          <div class="summary-stat-help">Quanto maior, melhor.</div>
        </div>
        <div class="summary-stat">
          <div class="summary-stat-label">Execuções de CI/CD</div>
          <div class="summary-stat-value">${cicd.totalRuns || 0}</div>
          <div class="summary-stat-help">Mostra quantas vezes o pipeline rodou.</div>
        </div>
        <div class="summary-stat">
          <div class="summary-stat-label">Análises de IA</div>
          <div class="summary-stat-value">${ai.analysesExecuted || 0}</div>
          <div class="summary-stat-help">Total de análises automáticas feitas no período.</div>
        </div>
      </div>
    </section>

    <section class="report-section">
      <h2>Testes por tipo</h2>
      <div class="charts-grid">
        <div class="chart-card">
          <h3>Distribuição de tipos</h3>
          <canvas id="testsTypeChart"></canvas>
        </div>
        <div class="chart-card">
          <h3>Passou x Falhou x Instável</h3>
          <canvas id="testsStatusChart"></canvas>
        </div>
      </div>
      <div class="metrics-grid">
        <div class="metric-card"><div class="metric-label">Unitários</div><div class="metric-value">${tests.byType?.unit?.total || 0}</div></div>
        <div class="metric-card"><div class="metric-label">Integração</div><div class="metric-value">${tests.byType?.integration?.total || 0}</div></div>
        <div class="metric-card"><div class="metric-label">E2E</div><div class="metric-value">${tests.byType?.e2e?.total || 0}</div></div>
        <div class="metric-card"><div class="metric-label">Performance</div><div class="metric-value">${tests.byType?.performance?.total || 0}</div></div>
      </div>
    </section>

    <section class="report-section">
      <h2>Pipeline CI/CD</h2>
      <div class="charts-grid">
        <div class="chart-card">
          <h3>Resultado das execuções</h3>
          <canvas id="cicdRunsChart"></canvas>
        </div>
        <div class="chart-card">
          <h3>Saúde dos jobs</h3>
          <canvas id="cicdJobsChart"></canvas>
        </div>
      </div>
    </section>

    <section class="report-section">
      <h2>Inteligência Artificial + RTK</h2>
      <div class="metrics-grid">
        <div class="metric-card"><div class="metric-label">Qualidade média da IA</div><div class="metric-value">${(ai.avgQuality || 0).toFixed(1)}%</div></div>
        <div class="metric-card"><div class="metric-label">Confiança média</div><div class="metric-value">${(ai.avgConfidence || 0).toFixed(1)}%</div></div>
        <div class="metric-card"><div class="metric-label">Tokens economizados</div><div class="metric-value">${(ai.tokensEconomized || 0).toLocaleString('pt-BR')}</div></div>
        <div class="metric-card"><div class="metric-label">Economia estimada</div><div class="metric-value">US$ ${(ai.costSaved || 0).toFixed(2)}</div></div>
      </div>
      <div class="charts-grid">
        <div class="chart-card">
          <h3>Modelos usados</h3>
          <canvas id="aiModelChart"></canvas>
        </div>
        <div class="chart-card">
          <h3>Decisões autônomas</h3>
          <canvas id="aiDecisionChart"></canvas>
        </div>
      </div>
      <p class="child-note">Explicando simples: RTK ajuda a gastar menos tokens. Isso reduz custo e deixa a IA mais eficiente.</p>
    </section>

    <section class="report-section">
      <h2>Performance do sistema</h2>
      ${k6 ? `
      <div class="charts-grid">
        <div class="chart-card">
          <h3>Latência (ms)</h3>
          <canvas id="latencyChart"></canvas>
        </div>
        <div class="chart-card">
          <h3>Requests com erro</h3>
          <canvas id="errorChart"></canvas>
        </div>
      </div>
      <div class="metrics-grid">
        <div class="metric-card"><div class="metric-label">RPS</div><div class="metric-value">${(k6.rps || 0).toFixed(1)}</div></div>
        <div class="metric-card"><div class="metric-label">Erro</div><div class="metric-value">${((k6.errorRate || 0) * 100).toFixed(2)}%</div></div>
        <div class="metric-card"><div class="metric-label">P95</div><div class="metric-value">${(k6.latency?.p95 || 0).toFixed(0)} ms</div></div>
        <div class="metric-card"><div class="metric-label">P99</div><div class="metric-value">${(k6.latency?.p99 || 0).toFixed(0)} ms</div></div>
      </div>
      ` : `
      <div class="alert alert-warning">Sem dados de K6 ainda. Execute um teste de carga para preencher este bloco.</div>
      `}
    </section>

    <section class="report-section">
      <h2>Problemas e recomendações</h2>
      <div class="dual-list">
        <div>
          <h3>Problemas encontrados</h3>
          <ul class="issues-list">
            ${(report.issues || []).map((issue) => `
              <li class="issue-item ${issue.severity}">
                <div class="issue-title">${issue.title}</div>
                <div class="issue-description">${issue.description}</div>
                <div class="issue-recommendation"><strong>O que fazer:</strong> ${issue.recommendation}</div>
              </li>
            `).join('') || '<li class="issue-item info">Nenhum problema relevante encontrado.</li>'}
          </ul>
        </div>
        <div>
          <h3>Plano de ação</h3>
          <ul class="recommendations-list">
            ${(report.recommendations || []).map((rec) => `
              <li class="recommendation-item ${rec.priority}">
                <div class="recommendation-title">${rec.action}</div>
                <div class="recommendation-description">${rec.rationale}</div>
                <div class="recommendation-effort">Esforço: ${getEffortLabel(rec.effort)}</div>
              </li>
            `).join('') || '<li class="recommendation-item low">Sem recomendações no momento.</li>'}
          </ul>
        </div>
      </div>
    </section>
  `;

  reportContainer.innerHTML = html;
  renderCharts(report);
}

function renderCharts(report) {
  if (!window.Chart) {
    return;
  }

  const tests = report.tests || {};
  const cicd = report.cicd || {};
  const ai = report.ai || {};
  const k6 = report.performance?.k6;

  charts.push(new Chart(document.getElementById('testsTypeChart'), {
    type: 'doughnut',
    data: {
      labels: ['Unitários', 'Integração', 'E2E', 'Performance'],
      datasets: [{
        data: [
          tests.byType?.unit?.total || 0,
          tests.byType?.integration?.total || 0,
          tests.byType?.e2e?.total || 0,
          tests.byType?.performance?.total || 0,
        ],
        backgroundColor: ['#355C7D', '#4ECDC4', '#F8B400', '#EF476F'],
      }],
    },
  }));

  charts.push(new Chart(document.getElementById('testsStatusChart'), {
    type: 'bar',
    data: {
      labels: ['Passou', 'Falhou', 'Instável'],
      datasets: [{
        label: 'Quantidade',
        data: [tests.passed || 0, tests.failed || 0, tests.flaky || 0],
        backgroundColor: ['#3BA55D', '#D90429', '#F77F00'],
      }],
    },
    options: { scales: { y: { beginAtZero: true } } },
  }));

  charts.push(new Chart(document.getElementById('cicdRunsChart'), {
    type: 'bar',
    data: {
      labels: ['Sucesso', 'Falha'],
      datasets: [{
        label: 'Execuções',
        data: [cicd.successfulRuns || 0, cicd.failedRuns || 0],
        backgroundColor: ['#2A9D8F', '#E63946'],
      }],
    },
    options: { scales: { y: { beginAtZero: true } } },
  }));

  const jobs = Object.entries(cicd.byJob || {});
  charts.push(new Chart(document.getElementById('cicdJobsChart'), {
    type: 'line',
    data: {
      labels: jobs.map(([name]) => name),
      datasets: [{
        label: 'Duração média (s)',
        data: jobs.map(([, row]) => Number((row.avgDuration || 0) / 1000)),
        borderColor: '#3A86FF',
        backgroundColor: 'rgba(58,134,255,0.2)',
        tension: 0.25,
      }],
    },
  }));

  const models = Object.keys(ai.modelDistribution || {});
  charts.push(new Chart(document.getElementById('aiModelChart'), {
    type: 'pie',
    data: {
      labels: models.length > 0 ? models : ['Sem dados'],
      datasets: [{
        data: models.length > 0 ? models.map((m) => ai.modelDistribution[m]) : [100],
        backgroundColor: ['#0F4C5C', '#2EC4B6', '#F4D35E', '#EE964B', '#F95738'],
      }],
    },
  }));

  charts.push(new Chart(document.getElementById('aiDecisionChart'), {
    type: 'bar',
    data: {
      labels: ['Total', 'Sucesso %', 'Risco médio'],
      datasets: [{
        label: 'Decisões IA',
        data: [
          ai.autonomousDecisions?.total || 0,
          ai.autonomousDecisions?.successRate || 0,
          (ai.autonomousDecisions?.avgRisk || 0) * 100,
        ],
        backgroundColor: ['#4361EE', '#06D6A0', '#F94144'],
      }],
    },
    options: { scales: { y: { beginAtZero: true } } },
  }));

  if (k6) {
    charts.push(new Chart(document.getElementById('latencyChart'), {
      type: 'line',
      data: {
        labels: ['Min', 'Média', 'P95', 'P99', 'Máx'],
        datasets: [{
          label: 'ms',
          data: [k6.latency?.min || 0, k6.latency?.avg || 0, k6.latency?.p95 || 0, k6.latency?.p99 || 0, k6.latency?.max || 0],
          borderColor: '#8338EC',
          backgroundColor: 'rgba(131,56,236,0.15)',
        }],
      },
    }));

    charts.push(new Chart(document.getElementById('errorChart'), {
      type: 'bar',
      data: {
        labels: ['Sucesso', 'Erro'],
        datasets: [{
          data: [k6.successfulRequests || 0, k6.failedRequests || 0],
          backgroundColor: ['#2A9D8F', '#D62828'],
        }],
      },
      options: { scales: { y: { beginAtZero: true } } },
    }));
  }
}

function destroyCharts() {
  for (const chart of charts) {
    chart.destroy();
  }
  charts = [];
}

async function downloadPowerPoint() {
  if (!currentReport) {
    showError('Gere o relatório antes de baixar o PowerPoint.');
    return;
  }

  showLoading(true);
  hideError();

  try {
    const response = await fetch('/api/reports/export/powerpoint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(currentReport),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const startDate = new Date(currentReport.period.startDate).toLocaleDateString('pt-BR');
    const endDate = new Date(currentReport.period.endDate).toLocaleDateString('pt-BR');
    a.download = `relatorio-sprint-${startDate}-ate-${endDate}.pptx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    showError(`Não consegui baixar o PowerPoint: ${error.message}`);
  } finally {
    showLoading(false);
  }
}

function showLoading(show) {
  if (show) {
    loadingIndicator.classList.remove('loading-hidden');
    loadingIndicator.querySelector('p').textContent = '⏳ Estou montando os gráficos e os números...';
    generateBtn.disabled = true;
  } else {
    loadingIndicator.classList.add('loading-hidden');
    generateBtn.disabled = false;
  }
}

function showError(message) {
  errorAlert.textContent = message;
  errorAlert.classList.remove('alert-hidden');
}

function hideError() {
  errorAlert.classList.add('alert-hidden');
}

function getHealthStatusLabel(status) {
  const labels = {
    excellent: 'EXCELENTE',
    good: 'BOM',
    attention: 'ATENÇÃO',
    critical: 'CRÍTICO',
  };
  return labels[status] || String(status || '').toUpperCase();
}

function getEffortLabel(effort) {
  const labels = {
    low: 'Baixo',
    medium: 'Médio',
    high: 'Alto',
  };
  return labels[effort] || effort;
}
