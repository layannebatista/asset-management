const DEFAULT_AI_SERVICE_KEY = 'test_key_123456';

let currentReport = null;
let rtkData = null;

const startDateInput = document.getElementById('startDate');
const endDateInput = document.getElementById('endDate');
const generateBtn = document.getElementById('generateBtn');
const downloadPptBtn = document.getElementById('downloadPptBtn');
const loadingIndicator = document.getElementById('loadingIndicator');
const errorAlert = document.getElementById('errorAlert');
const reportContainer = document.getElementById('reportContainer');

function getAiServiceKey() {
  const saved = localStorage.getItem('aiServiceKey');
  return saved && saved.trim().length > 0 ? saved : DEFAULT_AI_SERVICE_KEY;
}

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
    // Carregar relatório de sprint
    const sprintResponse = await fetch('/api/reports/sprint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        startDate,
        endDate,
        projectName: 'asset-management',
        format: 'json',
      }),
    });

    if (!sprintResponse.ok) {
      throw new Error(`HTTP ${sprintResponse.status}: ${sprintResponse.statusText}`);
    }

    currentReport = await sprintResponse.json();

    // RTK data vem junto com o relatório (carregado no servidor)
    rtkData = currentReport.rtk || null;
    console.log('📊 Relatório carregado completo:', currentReport);
    console.log('🔍 RTK data encontrado?:', !!rtkData);
    console.log('📦 RTK data:', rtkData);
    console.log('🔑 Chaves do relatório:', Object.keys(currentReport));

    displayReport(currentReport);
    downloadPptBtn.disabled = false;
  } catch (error) {
    showError(`Não consegui gerar o relatório: ${error.message}`);
    downloadPptBtn.disabled = true;
  } finally {
    showLoading(false);
  }
}


async function safeApiFetch(url, options = {}) {
  const key = getAiServiceKey();
  console.log(`📡 Fetching: ${url} com chave: ${key}`);

  const headers = {
    ...(options.headers || {}),
    'X-AI-Service-Key': key,
  };

  let response = await fetch(url, { ...options, headers });
  console.log(`📡 Response status: ${response.status} para ${url}`);

  if (response.status === 401) {
    console.log('⚠️ 401 recebido, tentando com X-API-Key');
    response = await fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        'X-API-Key': key,
      },
    });
  }

  if (response.status === 401) {
    console.log('⚠️ Ainda 401, pedindo chave ao usuário');
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
    const errorText = await response.text();
    console.error(`❌ Erro ${response.status}: ${errorText}`);
    throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
  }

  return response;
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString('pt-BR');
}

function formatPct(value) {
  return `${Number(value || 0).toFixed(1)}%`;
}

function formatMs(value) {
  return `${Number(value || 0).toFixed(0)} ms`;
}

function formatUsd(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString('pt-BR');
}

function formatCommand(value) {
  return value && value.trim().length > 0 ? value : '-';
}

function uniqueAgents(models) {
  return new Set((models || []).map((item) => item.agent)).size;
}

function renderMetricCards(summary, metrics, models) {
  return `
    <section class="report-section">
      <div class="section-heading">
        <div>
          <p class="section-eyebrow">RTK</p>
          <h2>Panorama do workspace</h2>
        </div>
        <p class="section-note">${summary.recommendation || 'Resumo indisponível.'}</p>
      </div>

      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-kicker">Comandos</div>
          <div class="metric-value">${formatNumber(summary.totalCommandsTracked)}</div>
          <p style="font-size: 0.9rem; color: var(--muted);">execuções registradas pelo RTK</p>
        </div>
        <div class="metric-card">
          <div class="metric-kicker">Economia</div>
          <div class="metric-value">${formatNumber(metrics.tokensSaved)}</div>
          <p style="font-size: 0.9rem; color: var(--muted);">tokens economizados no período</p>
        </div>
        <div class="metric-card">
          <div class="metric-kicker">Redução</div>
          <div class="metric-value">${formatPct(metrics.savingsPercentage)}</div>
          <p style="font-size: 0.9rem; color: var(--muted);">média de redução por comando</p>
        </div>
        <div class="metric-card">
          <div class="metric-kicker">Tempo médio</div>
          <div class="metric-value">${formatMs(metrics.avgExecTimeMs)}</div>
          <p style="font-size: 0.9rem; color: var(--muted);">latência média observada</p>
        </div>
        <div class="metric-card">
          <div class="metric-kicker">Agentes</div>
          <div class="metric-value">${formatNumber(uniqueAgents(models))}</div>
          <p style="font-size: 0.9rem; color: var(--muted);">agentes observados no ambiente</p>
        </div>
      </div>

      ${summary.keyInsights && summary.keyInsights.length > 0 ? `
      <div style="margin-top: 16px; display: flex; flex-wrap: wrap; gap: 10px;">
        ${summary.keyInsights.map((item) => `<span style="display: inline-flex; align-items: center; border-radius: 999px; padding: 10px 14px; background: #f7fbff; border: 1px solid rgba(13, 99, 243, 0.12); color: var(--slate); font-weight: 700; font-size: 0.9rem;">${item}</span>`).join('')}
      </div>
      ` : ''}
    </section>
  `;
}

function renderCommandEfficiency(commandGroups) {
  return `
    <section class="report-section">
      <h2>Eficiência por Comando</h2>
      ${commandGroups.length > 0 ? `
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Comando</th>
                <th>Execuções</th>
                <th>Redução</th>
                <th>Entrada média</th>
                <th>Saída média</th>
                <th>Latência</th>
                <th>USD est.</th>
              </tr>
            </thead>
            <tbody>
              ${commandGroups.map((item) => `
                <tr>
                  <td><strong>${item.type}</strong></td>
                  <td>${formatNumber(item.executions)}</td>
                  <td>${formatPct(item.avgEfficiency)}</td>
                  <td>${formatNumber(item.avgInputTokens)}</td>
                  <td>${formatNumber(item.avgOutputTokens)}</td>
                  <td>${formatMs(item.avgLatencyMs)}</td>
                  <td>${formatUsd(item.totalUsdSaved)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : '<p class="empty-state">Nenhum comando do RTK foi encontrado para este projeto.</p>'}
    </section>
  `;
}

function renderModels(models) {
  return `
    <section class="report-section">
      <h2>Agentes e Modelos Observados</h2>
      ${models.length > 0 ? `
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Agente</th>
                <th>Modelo</th>
                <th>Provedor</th>
                <th>Mensagens</th>
                <th>Sessões</th>
                <th>Origem</th>
                <th>Entrypoints</th>
                <th>Último uso</th>
              </tr>
            </thead>
            <tbody>
              ${models.map((item) => `
                <tr>
                  <td><strong>${item.agent}</strong></td>
                  <td>${item.model}</td>
                  <td>${item.provider}</td>
                  <td>${formatNumber(item.assistantMessages)}</td>
                  <td>${formatNumber(item.sessions)}</td>
                  <td>${item.source || '-'}</td>
                  <td>${(item.entrypoints || []).join(', ') || '-'}</td>
                  <td>${formatDate(item.lastSeen)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : '<p class="empty-state">Nenhum agente foi observado nas fontes locais disponíveis.</p>'}
    </section>
  `;
}

function renderCommands(commands) {
  return `
    <section class="report-section">
      <h2>Comandos Recentes</h2>
      ${commands.length > 0 ? `
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Quando</th>
                <th>Comando</th>
                <th>Tokens entrada</th>
                <th>Tokens saída</th>
                <th>Economizados</th>
                <th>Redução</th>
              </tr>
            </thead>
            <tbody>
              ${commands.map((command) => `
                <tr>
                  <td>${formatDate(command.timestamp)}</td>
                  <td><strong>${formatCommand(command.originalCmd)}</strong></td>
                  <td>${formatNumber(command.inputTokens)}</td>
                  <td>${formatNumber(command.outputTokens)}</td>
                  <td>${formatNumber(command.savedTokens)}</td>
                  <td>${formatPct(command.savingsPct)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : '<p class="empty-state">Nenhum comando recente encontrado.</p>'}
    </section>
  `;
}

function renderFailures(failures) {
  return `
    <section class="report-section">
      <h2>Falhas Registradas</h2>
      ${failures.length > 0 ? `
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Quando</th>
                <th>Comando</th>
                <th>Erro</th>
                <th>Fallback</th>
              </tr>
            </thead>
            <tbody>
              ${failures.map((failure) => `
                <tr>
                  <td>${formatDate(failure.timestamp)}</td>
                  <td><strong>${formatCommand(failure.rawCommand)}</strong></td>
                  <td>${failure.errorMessage || '-'}</td>
                  <td>${failure.fallbackSucceeded ? 'Recuperado' : 'Não recuperado'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : '<p class="empty-state">Nenhuma falha registrada no período.</p>'}
    </section>
  `;
}

function displayReport(report) {
  console.log('🎨 Renderizando relatório...');
  console.log('📦 rtkData global:', rtkData);
  console.log('📦 report.rtk:', report.rtk);

  const tests = report.tests || {};
  const cicd = report.cicd || {};
  const postgres = report.codeQuality || {};

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
      <h2>Resumo da Sprint</h2>
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
          <div class="summary-stat-label">Taxa de sucesso CI/CD</div>
          <div class="summary-stat-value">${((cicd.successfulRuns || 0) / (cicd.totalRuns || 1) * 100).toFixed(1)}%</div>
          <div class="summary-stat-help">Percentual de execuções com sucesso.</div>
        </div>
      </div>
    </section>

    <section class="report-section">
      <h2>Testes (Allure)</h2>
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-label">Total de testes</div>
          <div class="metric-value">${tests.total || 0}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Testes aprovados</div>
          <div class="metric-value">${tests.passed || 0}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Testes falhados</div>
          <div class="metric-value">${tests.failed || 0}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Testes instáveis</div>
          <div class="metric-value">${tests.flaky || 0}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Testes unitários</div>
          <div class="metric-value">${tests.byType?.unit?.total || 0}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Testes de integração</div>
          <div class="metric-value">${tests.byType?.integration?.total || 0}</div>
        </div>
      </div>
    </section>

    <section class="report-section">
      <h2>Pipeline CI/CD</h2>
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-label">Execuções totais</div>
          <div class="metric-value">${cicd.totalRuns || 0}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Execuções com sucesso</div>
          <div class="metric-value">${cicd.successfulRuns || 0}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Execuções falhadas</div>
          <div class="metric-value">${cicd.failedRuns || 0}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Taxa de sucesso</div>
          <div class="metric-value">${((cicd.successfulRuns || 0) / (cicd.totalRuns || 1) * 100).toFixed(1)}%</div>
        </div>
      </div>
    </section>

    ${postgres?.violations || postgres?.coverage ? `
    <section class="report-section">
      <h2>Qualidade de Código</h2>
      <div class="metrics-grid">
        ${postgres?.violations ? `
        <div class="metric-card">
          <div class="metric-label">Violações</div>
          <div class="metric-value">${postgres.violations || 0}</div>
        </div>
        ` : ''}
        ${postgres?.coverage ? `
        <div class="metric-card">
          <div class="metric-label">Cobertura de teste</div>
          <div class="metric-value">${(postgres.coverage || 0).toFixed(1)}%</div>
        </div>
        ` : ''}
      </div>
    </section>
    ` : ''}

    ${rtkData ? `
      ${renderMetricCards(rtkData.execSummary.summary || {}, (rtkData.execSummary.summary?.metrics || {}), rtkData.modelEfficiency.models || [])}
      ${renderCommandEfficiency(rtkData.analysisRoi.analyses || [])}
      ${renderModels(rtkData.modelEfficiency.models || [])}
      ${renderCommands(rtkData.recentCommands.commands || [])}
      ${renderFailures(rtkData.failures.recentFailures || [])}
    ` : '<section class="report-section"><p style="color: var(--muted);">Dados do RTK não disponíveis no momento.</p></section>'}
  `;

  reportContainer.innerHTML = html;
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
    loadingIndicator.querySelector('p').textContent = '⏳ Gerando relatório com os dados...';
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
