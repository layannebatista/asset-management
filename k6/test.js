import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';

// ── Métricas customizadas ──────────────────────────────────────────────────────
const loginDuration     = new Trend('login_duration',     true);
const assetsDuration    = new Trend('assets_duration',    true);
const maintenanceDuration = new Trend('maintenance_duration', true);
const errorRate         = new Rate('error_rate');
const requestsTotal     = new Counter('requests_total');

// ── Configuração dos cenários ──────────────────────────────────────────────────
export const options = {
  scenarios: {
    smoke: {
      executor: 'constant-vus',
      vus: 1,
      duration: '30s',
      tags: { scenario: 'smoke' },
    },
    load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 20 },
        { duration: '1m',  target: 20 },
        { duration: '20s', target: 0  },
      ],
      tags: { scenario: 'load' },
    },
    spike: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 50 },
        { duration: '20s', target: 50 },
        { duration: '10s', target: 0  },
      ],
      tags: { scenario: 'spike' },
    },
  },

  thresholds: {
    http_req_duration:    ['p(95)<1000', 'p(99)<2000'],
    http_req_failed:      ['rate<0.05'],
    error_rate:           ['rate<0.05'],
    login_duration:       ['p(95)<500'],
    assets_duration:      ['p(95)<800'],
    maintenance_duration: ['p(95)<800'],
  },
};

// ── Helpers ────────────────────────────────────────────────────────────────────
const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

const JSON_HEADERS = { 'Content-Type': 'application/json' };

function authHeaders(token) {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

function post(path, body, headers = JSON_HEADERS) {
  requestsTotal.add(1);
  return http.post(`${BASE_URL}${path}`, JSON.stringify(body), { headers });
}

function get(path, headers, params = {}) {
  requestsTotal.add(1);
  return http.get(`${BASE_URL}${path}`, { headers, params });
}

function patch(path, body, headers) {
  requestsTotal.add(1);
  return http.patch(`${BASE_URL}${path}`, JSON.stringify(body), { headers });
}

// ── Login ──────────────────────────────────────────────────────────────────────
function login(email, password) {
  const res = post('/auth/login', { email, password });
  loginDuration.add(res.timings.duration);

  const ok = check(res, {
    'login: status 200': (r) => r.status === 200,
    'login: tem accessToken': (r) => {
      try { return !!JSON.parse(r.body).accessToken; } catch { return false; }
    },
  });
  errorRate.add(!ok);

  if (!ok) return null;
  return JSON.parse(res.body).accessToken;
}

// ── Grupos de teste ────────────────────────────────────────────────────────────

function testHealth() {
  group('Health', () => {
    const res = get('/actuator/health');
    check(res, { 'health: status 200': (r) => r.status === 200 });
    errorRate.add(res.status !== 200);
  });
}

function testAuth() {
  group('Autenticação', () => {
    group('login com credenciais válidas', () => {
      const token = login('admin@acme.com', 'Senha@123');
      check({ token }, { 'auth: token obtido': (t) => t.token !== null });
    });

    group('login com credenciais inválidas', () => {
      const res = post('/auth/login', { email: 'invalido@acme.com', password: 'errada' });
      check(res, { 'auth: rejeita credenciais inválidas': (r) => r.status === 401 || r.status === 403 });
    });

    group('refresh token', () => {
      const loginRes = post('/auth/login', { email: 'admin@acme.com', password: 'Senha@123' });
      if (loginRes.status !== 200) return;
      const { refreshToken } = JSON.parse(loginRes.body);
      const res = post('/auth/refresh', { refreshToken });
      check(res, {
        'auth: refresh retorna 200': (r) => r.status === 200,
        'auth: novo accessToken presente': (r) => {
          try { return !!JSON.parse(r.body).accessToken; } catch { return false; }
        },
      });
      errorRate.add(res.status !== 200);
    });
  });
}

function testOrganizations(token) {
  group('Organizações', () => {
    const headers = authHeaders(token);

    group('listar organizações', () => {
      const res = get('/organizations', headers);
      check(res, {
        'org: status 200': (r) => r.status === 200,
        'org: body é array ou page': (r) => {
          try { const b = JSON.parse(r.body); return Array.isArray(b) || Array.isArray(b.content); }
          catch { return false; }
        },
      });
      errorRate.add(res.status !== 200);
    });

    group('criar e buscar organização', () => {
      const createRes = post(
        '/organizations',
        { name: `Org K6 ${Date.now()}` },
        headers,
      );
      check(createRes, { 'org: criação retorna 201': (r) => r.status === 201 });
      errorRate.add(createRes.status !== 201);

      if (createRes.status === 201) {
        const { id } = JSON.parse(createRes.body);
        const getRes = get(`/organizations/${id}`, headers);
        check(getRes, { 'org: busca por ID retorna 200': (r) => r.status === 200 });
        errorRate.add(getRes.status !== 200);
      }
    });
  });
}

function testAssets(token) {
  group('Ativos', () => {
    const headers = authHeaders(token);

    group('listar ativos', () => {
      const res = get('/assets', headers, { page: 0, size: 20 });
      assetsDuration.add(res.timings.duration);
      check(res, {
        'asset: status 200': (r) => r.status === 200,
        'asset: content presente': (r) => {
          try { return Array.isArray(JSON.parse(r.body).content); } catch { return false; }
        },
      });
      errorRate.add(res.status !== 200);
    });

    group('criar ativo (auto tag)', () => {
      // necessita de organizationId válido — usa o primeiro disponível
      const orgRes = get('/organizations', headers);
      if (orgRes.status !== 200) return;
      const orgs = JSON.parse(orgRes.body);
      const orgList = Array.isArray(orgs) ? orgs : orgs.content;
      if (!orgList || orgList.length === 0) return;

      const orgId = orgList[0].id;
      const createRes = post(
        `/assets/${orgId}/auto`,
        { type: 'NOTEBOOK', model: `Dell K6 ${Date.now()}`, unitId: null },
        headers,
      );
      check(createRes, { 'asset: criação auto retorna 201': (r) => r.status === 201 });
      errorRate.add(createRes.status !== 201);

      if (createRes.status === 201) {
        const { id } = JSON.parse(createRes.body);

        group('buscar ativo por ID', () => {
          const getRes = get(`/assets/${id}`, headers);
          check(getRes, { 'asset: busca por ID retorna 200': (r) => r.status === 200 });
          errorRate.add(getRes.status !== 200);
        });

        group('calcular depreciação', () => {
          const depRes = get(`/assets/${id}/depreciation`, headers);
          check(depRes, { 'asset: depreciação retorna 200 ou 404': (r) => [200, 404].includes(r.status) });
        });
      }
    });
  });
}

function testMaintenance(token) {
  group('Manutenção', () => {
    const headers = authHeaders(token);

    group('listar manutenções', () => {
      const res = get('/maintenance', headers, { page: 0, size: 20 });
      maintenanceDuration.add(res.timings.duration);
      check(res, {
        'maint: status 200': (r) => r.status === 200,
      });
      errorRate.add(res.status !== 200);
    });

    group('fluxo completo de manutenção', () => {
      // busca um ativo disponível para associar
      const assetsRes = get('/assets', headers, { page: 0, size: 1 });
      if (assetsRes.status !== 200) return;
      const assets = JSON.parse(assetsRes.body).content;
      if (!assets || assets.length === 0) return;
      const assetId = assets[0].id;

      const createRes = post(
        '/maintenance',
        { assetId, description: `Teste K6 ${Date.now()}`, estimatedCost: 200.0 },
        headers,
      );
      check(createRes, { 'maint: criação retorna 201': (r) => r.status === 201 });
      errorRate.add(createRes.status !== 201);

      if (createRes.status !== 201) return;
      const { id } = JSON.parse(createRes.body);

      const startRes = post(`/maintenance/${id}/start`, {}, headers);
      check(startRes, { 'maint: start retorna 200': (r) => r.status === 200 });

      const completeRes = post(
        `/maintenance/${id}/complete`,
        { resolution: 'Resolvido via teste de carga K6' },
        headers,
      );
      check(completeRes, { 'maint: complete retorna 200': (r) => r.status === 200 });
    });

    group('relatório de orçamento', () => {
      const res = get('/maintenance/budget', headers);
      check(res, { 'maint: budget retorna 200': (r) => r.status === 200 });
      errorRate.add(res.status !== 200);
    });
  });
}

function testTransfers(token) {
  group('Transferências', () => {
    const headers = authHeaders(token);

    group('listar transferências', () => {
      const res = get('/transfers', headers, { page: 0, size: 20 });
      check(res, { 'transfer: status 200': (r) => r.status === 200 });
      errorRate.add(res.status !== 200);
    });
  });
}

function testUsers(token) {
  group('Usuários', () => {
    const headers = authHeaders(token);

    group('listar usuários', () => {
      const res = get('/users', headers, { page: 0, size: 20 });
      check(res, {
        'user: status 200': (r) => r.status === 200,
      });
      errorRate.add(res.status !== 200);
    });
  });
}

function testDashboards(token) {
  group('Dashboards', () => {
    const headers = authHeaders(token);
    const paths = [
      '/dashboard/executive',
      '/dashboard/personal',
      '/dashboard/unit',
    ];
    for (const path of paths) {
      const res = get(path, headers);
      check(res, { [`dashboard ${path}: 200 ou 403`]: (r) => [200, 403, 404].includes(r.status) });
    }
  });
}

function testAudit(token) {
  group('Auditoria', () => {
    const headers = authHeaders(token);

    group('listar eventos de auditoria', () => {
      const res = get('/audit', headers, { page: 0, size: 20 });
      check(res, { 'audit: status 200': (r) => r.status === 200 });
      errorRate.add(res.status !== 200);
    });

    group('eventos por período', () => {
      const now   = new Date().toISOString();
      const start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const res   = get('/audit/period', headers, { startDate: start, endDate: now });
      check(res, { 'audit: período retorna 200': (r) => r.status === 200 });
    });
  });
}

// ── Entrypoint principal ───────────────────────────────────────────────────────
export default function () {
  testHealth();

  testAuth();
  sleep(0.5);

  const token = login('admin@acme.com', 'Senha@123');
  if (!token) {
    errorRate.add(1);
    sleep(1);
    return;
  }

  testOrganizations(token);
  sleep(0.3);

  testAssets(token);
  sleep(0.3);

  testMaintenance(token);
  sleep(0.3);

  testTransfers(token);
  sleep(0.3);

  testUsers(token);
  sleep(0.3);

  testDashboards(token);
  sleep(0.3);

  testAudit(token);

  sleep(1);
}
