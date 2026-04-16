import { Before, After, BeforeAll, AfterAll, Status, setDefaultTimeout } from '@cucumber/cucumber';
import { chromium } from 'playwright';
import { CustomWorld } from './world';
import fs from 'fs';
import path from 'path';

setDefaultTimeout(30000);

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
});

After(async function (this: CustomWorld, scenario) {
  if (scenario.result?.status === Status.FAILED && this.page) {
    const name = scenario.pickle.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const screenshotPath = path.join(SCREENSHOTS_DIR, `${name}_${Date.now()}.png`);

    const screenshot = await this.page.screenshot({ fullPage: true });
    fs.writeFileSync(screenshotPath, screenshot);

    await this.attach(screenshot, 'image/png');
  }

  await this.context?.close().catch(() => {});
  await this.browser?.close().catch(() => {});
});

AfterAll(async function () {
  await cleanupTestData();
});
