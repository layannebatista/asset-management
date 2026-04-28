const DEFAULT_AI_SERVICE_KEY = 'local-ai-service-key';

const refreshDashboardBtn = document.getElementById('refreshDashboardBtn');
const loadingIndicator = document.getElementById('loadingIndicator');
const errorAlert = document.getElementById('errorAlert');
const analysisContainer = document.getElementById('analysisContainer');
const alertsCard = document.getElementById('alertsCard');

const statusElements = {
  api: document.getElementById('apiStatus'),
  history: document.getElementById('dbStatus'),
  claude: document.getElementById('claudeStatus'),
  codex: document.getElementById('codexStatus'),
  copilot: document.getElementById('copilotStatus'),
};

function getAiServiceKey() {
  const saved = localStorage.getItem('aiServiceKey');
  return saved && saved.trim().length > 0 ? saved : DEFAULT_AI_SERVICE_KEY;
}

document.addEventListener('DOMContentLoaded', async () => {
  refreshDashboardBtn.addEventListener('click', loadDashboard);
  await loadDashboard();
});

async function loadDashboard() {
  showLoading(true);
  hideError();

  try {
    await checkServiceStatus();

    const days = 30;
    const [
      tokenEconomyRes,
      modelEfficiencyRes,
      analysisRoiRes,
      execSummaryRes,
      recentCommandsRes,
      failuresRes,
      sourceStatusRes,
    ] = await Promise.all([
      safeApiFetch(`/api/v1/insights/token-economy?days=${days}`),
      safeApiFetch(`/api/v1/insights/model-efficiency?days=${days}`),
      safeApiFetch(`/api/v1/insights/analysis-roi?days=${days}`),
      safeApiFetch(`/api/v1/insights/executive-summary?days=${days}`),
      safeApiFetch(`/api/v1/insights/recent-commands?days=${days}&limit=12`),
      safeApiFetch(`/api/v1/insights/failures?days=${days}`),
      safeApiFetch('/api/v1/insights/source-status'),
    ]);

    const data = {
      tokenEconomy: await tokenEconomyRes.json(),
      modelEfficiency: await modelEfficiencyRes.json(),
      analysisRoi: await analysisRoiRes.json(),
      execSummary: await execSummaryRes.json(),
      recentCommands: await recentCommandsRes.json(),
      failures: await failuresRes.json(),
      sourceStatus: await sourceStatusRes.json(),
    };

    renderVisualDashboard(data);
  } catch (error) {
    showError(`Nao foi possivel carregar o painel: ${error instanceof Error ? error.message : 'unknown error'}`);
  } finally {
    showLoading(false);
  }
}

async function checkServiceStatus() {
  try {
    const response = await fetch('/health');
    updateStatusBadge(statusElements.api, response.ok, response.ok ? 'Online' : 'Falha');
  } catch {
    updateStatusBadge(statusElements.api, false, 'Offline');
  }

  try {
    const source = await safeApiFetch('/api/v1/insights/source-status');
    const sourceStatus = await source.json();
    updateStatusBadge(statusElements.history, !!sourceStatus.historyAvailable, sourceStatus.historyAvailable ? 'Disponivel' : 'Ausente');
    updateStatusBadge(statusElements.claude, !!sourceStatus.claudeProjectsAvailable, sourceStatus.claudeProjectsAvailable ? 'Disponivel' : 'Ausente');
    updateStatusBadge(statusElements.codex, !!sourceStatus.codexSessionsAvailable, sourceStatus.codexSessionsAvailable ? 'Disponivel' : 'Ausente');
    updateStatusBadge(statusElements.copilot, !!sourceStatus.copilotAvailable, sourceStatus.copilotAvailable ? 'Disponivel' : 'Ausente');
  } catch {
    updateStatusBadge(statusElements.history, false, 'Erro');
    updateStatusBadge(statusElements.claude, false, 'Erro');
    updateStatusBadge(statusElements.codex, false, 'Erro');
    updateStatusBadge(statusElements.copilot, false, 'Erro');
  }
}

function updateStatusBadge(element, isUp, label) {
  element.className = `status-badge ${isUp ? 'status-up' : 'status-down'}`;
  element.textContent = `${isUp ? 'OK' : 'ERRO'} ${label}`;
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

function checkAlerts(data) {
  const alerts = [];
  const metrics = data.execSummary.summary.metrics || {};
  const failures = data.failures || {};
  const models = data.modelEfficiency.models || [];

  if ((metrics.parseFailures || 0) > 0) {
    alerts.push(`${metrics.parseFailures} falhas de parse foram registradas no periodo.`);
  }

  if ((metrics.savingsPercentage || 0) < 20 && (data.execSummary.summary.totalCommandsTracked || 0) > 0) {
    alerts.push(`Reducao media baixa para os comandos observados: ${formatPct(metrics.savingsPercentage)}.`);
  }

  if ((data.execSummary.summary.totalCommandsTracked || 0) === 0) {
    alerts.push('Nenhum comando do RTK foi encontrado para este projeto nos ultimos 30 dias.');
  }

  if (uniqueAgents(models) < 3) {
    alerts.push('Nem todos os agentes esperados apareceram nas fontes locais do periodo atual.');
  }

  if ((failures.unresolvedFailures || 0) > 0) {
    alerts.push(`${failures.unresolvedFailures} falhas nao foram recuperadas pelo fallback do RTK.`);
  }

  return alerts;
}

function renderAlertsCard(alerts) {
  if (alerts.length === 0) {
    alertsCard.innerHTML = '<p class="no-alerts">Sem alertas no momento.</p>';
    return;
  }

  alertsCard.innerHTML = alerts.map((alert) => `
    <div class="alert-item warning">${alert}</div>
  `).join('');
}

function renderMetricCards(summary, metrics, models) {
  return `
    <section class="section-card">
      <div class="section-heading">
        <div>
          <p class="section-eyebrow">Resumo</p>
          <h2>Panorama do workspace</h2>
        </div>
        <p class="section-note">${summary.recommendation || 'Resumo indisponivel.'}</p>
      </div>

      <div class="metric-grid">
        <article class="metric-card accent-blue">
          <span class="metric-kicker">Comandos</span>
          <strong>${formatNumber(summary.totalCommandsTracked)}</strong>
          <p>execucoes registradas pelo RTK</p>
        </article>
        <article class="metric-card accent-green">
          <span class="metric-kicker">Economia</span>
          <strong>${formatNumber(metrics.tokensSaved)}</strong>
          <p>tokens economizados no periodo</p>
        </article>
        <article class="metric-card accent-amber">
          <span class="metric-kicker">Reducao</span>
          <strong>${formatPct(metrics.savingsPercentage)}</strong>
          <p>media de reducao por comando</p>
        </article>
        <article class="metric-card accent-slate">
          <span class="metric-kicker">Tempo medio</span>
          <strong>${formatMs(metrics.avgExecTimeMs)}</strong>
          <p>latencia media observada</p>
        </article>
        <article class="metric-card accent-pink">
          <span class="metric-kicker">Agentes</span>
          <strong>${formatNumber(uniqueAgents(models))}</strong>
          <p>agentes observados no ambiente</p>
        </article>
      </div>

      <div class="insight-strip">
        ${(summary.keyInsights || []).map((item) => `<span>${item}</span>`).join('')}
      </div>
    </section>
  `;
}

function renderSourceSummary(sourceStatus, models) {
  const sourceItems = [
    { label: 'RTK History DB', ok: sourceStatus.historyAvailable, detail: 'historico de comandos e falhas' },
    { label: 'Claude', ok: sourceStatus.claudeProjectsAvailable, detail: 'sessoes locais da pasta .claude' },
    { label: 'Codex', ok: sourceStatus.codexSessionsAvailable, detail: 'sessoes locais da pasta .codex' },
    { label: 'GitHub Copilot', ok: sourceStatus.copilotAvailable, detail: 'artefatos locais da pasta .copilot' },
  ];

  return `
    <section class="section-card two-column">
      <div>
        <div class="section-heading compact">
          <div>
            <p class="section-eyebrow">Cobertura</p>
            <h2>Fontes conectadas</h2>
          </div>
        </div>
        <div class="source-grid">
          ${sourceItems.map((item) => `
            <article class="source-card ${item.ok ? 'source-up' : 'source-down'}">
              <strong>${item.label}</strong>
              <p>${item.detail}</p>
              <span>${item.ok ? 'Disponivel' : 'Ausente'}</span>
            </article>
          `).join('')}
        </div>
      </div>
      <div>
        <div class="section-heading compact">
          <div>
            <p class="section-eyebrow">Agentes</p>
            <h2>Leitura do painel</h2>
          </div>
        </div>
        <div class="explain-card">
          <p>O bloco de agentes mostra quem apareceu nas fontes locais encontradas para este workspace.</p>
          <p>Claude e Codex sao filtrados pelo caminho do projeto. Copilot usa os artefatos locais associados ao workspace.</p>
          <p>Agentes observados agora: <strong>${formatNumber(uniqueAgents(models))}</strong>.</p>
        </div>
      </div>
    </section>
  `;
}

function renderCommandEfficiency(commandGroups) {
  return `
    <section class="section-card">
      <div class="section-heading compact">
        <div>
          <p class="section-eyebrow">Efetividade</p>
          <h2>Eficiência por comando</h2>
        </div>
      </div>
      ${commandGroups.length > 0 ? `
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Comando</th>
                <th>Execucoes</th>
                <th>Reducao</th>
                <th>Entrada media</th>
                <th>Saida media</th>
                <th>Latencia</th>
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
    <section class="section-card">
      <div class="section-heading compact">
        <div>
          <p class="section-eyebrow">Agentes</p>
          <h2>Agentes e modelos observados</h2>
        </div>
      </div>
      ${models.length > 0 ? `
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Agente</th>
                <th>Modelo</th>
                <th>Provedor</th>
                <th>Mensagens</th>
                <th>Sessoes</th>
                <th>Origem</th>
                <th>Entrypoints</th>
                <th>Ultimo uso</th>
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
      ` : '<p class="empty-state">Nenhum agente foi observado nas fontes locais disponiveis.</p>'}
    </section>
  `;
}

function renderCommands(commands) {
  return `
    <section class="section-card">
      <div class="section-heading compact">
        <div>
          <p class="section-eyebrow">Timeline</p>
          <h2>Comandos recentes</h2>
        </div>
      </div>
      ${commands.length > 0 ? `
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Quando</th>
                <th>Comando</th>
                <th>Tokens entrada</th>
                <th>Tokens saida</th>
                <th>Economizados</th>
                <th>Reducao</th>
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
    <section class="section-card">
      <div class="section-heading compact">
        <div>
          <p class="section-eyebrow">Qualidade</p>
          <h2>Falhas registradas</h2>
        </div>
      </div>
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
                  <td>${failure.fallbackSucceeded ? 'Recuperado' : 'Nao recuperado'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : '<p class="empty-state">Nenhuma falha registrada no periodo.</p>'}
    </section>
  `;
}

function renderVisualDashboard(data) {
  const summary = data.execSummary.summary || {};
  const metrics = summary.metrics || {};
  const commands = data.recentCommands.commands || [];
  const commandGroups = data.analysisRoi.analyses || [];
  const models = data.modelEfficiency.models || [];
  const failures = data.failures.recentFailures || [];
  const alerts = checkAlerts(data);

  renderAlertsCard(alerts);

  analysisContainer.innerHTML = `
    <div class="dashboard-stack">
      ${renderMetricCards(summary, metrics, models)}
      ${renderSourceSummary(data.sourceStatus || {}, models)}
      ${renderCommandEfficiency(commandGroups)}
      ${renderModels(models)}
      ${renderCommands(commands)}
      ${renderFailures(failures)}
    </div>
  `;
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
      throw new Error('Chave de acesso nao informada.');
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
