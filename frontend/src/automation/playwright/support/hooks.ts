import { Before, After, BeforeAll, AfterAll, Status, setDefaultTimeout } from '@cucumber/cucumber';
import { chromium } from 'playwright';
import { CustomWorld } from './world';
import fs from 'fs';
import path from 'path';

setDefaultTimeout(60000);

const REPORTS_DIR = path.resolve(process.cwd(), 'reports');
const SCREENSHOTS_DIR = path.resolve(REPORTS_DIR, 'screenshots');
// Estado de auth pré-gerado — reutilizado em todos os cenários que usam admin
const AUTH_FILE = path.resolve(REPORTS_DIR, 'auth-state.json');

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';
const API_URL = process.env.API_URL || 'http://localhost:8080';
const TEST_DATA_CLEANUP_KEY = process.env.TEST_DATA_CLEANUP_KEY || '';

async function cleanupTestData(): Promise<void> {
  if (!TEST_DATA_CLEANUP_KEY) return;

  try {
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@empresa.com', password: 'Admin@123' }),
    });

    if (!loginRes.ok) return;

    const loginData = await loginRes.json() as { accessToken?: string };
    if (!loginData.accessToken) return;

    await fetch(`${API_URL}/test-support/cleanup`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${loginData.accessToken}`,
        'X-Test-Cleanup-Key': TEST_DATA_CLEANUP_KEY,
      },
    });
  } catch {
    // O cleanup é best-effort para não mascarar o resultado do teste.
  }
}

BeforeAll({ timeout: 60000 }, async function () {
  if (!fs.existsSync(REPORTS_DIR)) fs.mkdirSync(REPORTS_DIR, { recursive: true });
  if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

  // Garante estado limpo antes de qualquer cenário — independente do que ocorreu na run anterior.
  await cleanupTestData();

  // Pré-autentica como admin UMA VEZ e salva o estado de localStorage.
  // Isso evita fazer login em cada cenário e previne rate limiting (10 req/min).
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    const res = await context.request.post(
      `${BASE_URL}/api/auth/login`,
      {
        data: JSON.stringify({ email: 'admin@empresa.com', password: 'Admin@123' }),
        headers: { 'Content-Type': 'application/json' },
      },
    );

    if (res.ok()) {
      const data = await res.json() as { accessToken?: string; refreshToken?: string };
      if (data.accessToken) {
        // Navega ao frontend para persistir o token no localStorage da origem correta
        await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await page.evaluate(
          ({ access, refresh }: { access: string; refresh: string }) => {
            localStorage.setItem('accessToken', access);
            localStorage.setItem('refreshToken', refresh);
          },
          { access: data.accessToken, refresh: data.refreshToken ?? '' },
        );
        await context.storageState({ path: AUTH_FILE });
      }
    }
  } catch {
    // Se o pre-auth falhar, os cenários farão login individualmente
  } finally {
    await browser.close();
  }
});

Before({ timeout: 30000 }, async function (this: CustomWorld) {
  const headless = this.parameters?.headless !== false;

  this.browser = await chromium.launch({ headless });
  // Carrega o estado de auth pré-gerado (tokens do admin no localStorage).
  // login() em world.ts detecta o token e pula a chamada de API quando o usuário é o mesmo.
  this.context = await this.browser.newContext({
    storageState: fs.existsSync(AUTH_FILE) ? AUTH_FILE : undefined,
  });
  this.page = await this.context.newPage();

  // ✅ Injeta data-testid dinamicamente após cada navegação
  // (workaround para atributos sendo removidos durante compilação Vite)
  this.page.on('load', async () => {
    await this.page.evaluate(() => {
      // Botões
      document.querySelectorAll('button').forEach((btn: HTMLButtonElement) => {
        const text = btn.textContent?.trim() || '';
        if (text === 'Entrar no sistema' || text === 'Entrar') btn.setAttribute('data-testid', 'login-submit-btn');
        if (text.includes('Novo Ativo')) btn.setAttribute('data-testid', 'asset-new-btn');
        if (text.includes('Exportar')) btn.setAttribute('data-testid', 'asset-export-btn');
        if (text === 'Criar Ativo') btn.setAttribute('data-testid', 'create-asset-confirm-btn');
        if (text.includes('Abrir Ordem')) btn.setAttribute('data-testid', 'maintenance-open-order-btn');
        if (text === 'Confirmar') btn.setAttribute('data-testid', 'mfa-submit-btn');
      });

      // Inputs
      document.querySelectorAll('input[type="email"]').forEach(el => el.setAttribute('data-testid', 'login-email-input'));
      document.querySelectorAll('input[type="password"]').forEach(el => el.setAttribute('data-testid', 'login-password-input'));
      document.querySelectorAll('input[placeholder*="Buscar"]').forEach(el => el.setAttribute('data-testid', 'asset-search-input'));
      document.querySelectorAll('input[placeholder*="código"], input[placeholder="000000"]').forEach(el => el.setAttribute('data-testid', 'mfa-code-input'));

      // Selects
      const selects = document.querySelectorAll('select');
      if (selects[0]) selects[0].setAttribute('data-testid', 'asset-type-filter');
      if (selects[1]) selects[1].setAttribute('data-testid', 'create-asset-unit-select');

      // Filtros
      document.querySelectorAll('button[class*="rounded-full"]').forEach((btn: HTMLButtonElement) => {
        const txt = btn.textContent?.trim();
        if (txt === 'Todas') btn.setAttribute('data-testid', 'maintenance-status-filter-all');
        if (txt === 'Solicitado' || txt === 'Solicitada') btn.setAttribute('data-testid', 'maintenance-status-filter-requested');
        if (txt === 'Em Andamento') btn.setAttribute('data-testid', 'maintenance-status-filter-in_progress');
        if (txt === 'Concluído' || txt === 'Concluída') btn.setAttribute('data-testid', 'maintenance-status-filter-completed');
      });
    }).catch(() => {}); // Ignora erros se a página não tiver os elementos
  });
});

After(async function (this: CustomWorld, scenario) {
  if (scenario.result?.status === Status.FAILED && this.page) {
    const name = scenario.pickle.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const screenshotPath = path.join(SCREENSHOTS_DIR, `${name}_${Date.now()}.png`);

    const screenshot = await this.page.screenshot({ fullPage: true });
    fs.writeFileSync(screenshotPath, screenshot);

    await this.attach(screenshot, 'image/png');
  }

  if (this.context) {
    try {
      await this.context.close();
    } catch {
      // Fechamento defensivo do contexto para não mascarar falhas do cenário.
    }
  }

  if (this.browser) {
    try {
      await this.browser.close();
    } catch {
      // Fechamento defensivo do browser para evitar leak entre cenários.
    }
  }
});

AfterAll(async function () {
  await cleanupTestData();
});
