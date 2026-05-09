import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  const consoleMessages: Array<{ type: string; msg: string }> = [];

  page.on('console', msg => {
    consoleMessages.push({ type: msg.type(), msg: msg.text() });
  });

  page.on('pageerror', error => {
    console.error('❌ Erro na página:', error);
  });

  try {
    console.log('🔄 Acessando http://localhost:5173/login...');
    await page.goto('http://localhost:5173/login', {
      waitUntil: 'domcontentloaded',
      timeout: 15000
    });

    console.log('⏳ Aguardando 3 segundos para React renderizar...');
    await page.waitForTimeout(3000);

    console.log('\n📋 Mensagens do console:');
    if (consoleMessages.length === 0) {
      console.log('  (nenhuma)');
    } else {
      consoleMessages.forEach(({ type, msg }) => {
        console.log(`  [${type}] ${msg}`);
      });
    }

    console.log('\n🔍 Procurando elementos:');
    const testIds = [
      'login-submit-btn',
      'login-email-input',
      'login-password-input',
    ];

    for (const testId of testIds) {
      const count = await page.locator(`[data-testid="${testId}"]`).count();
      const visible = await page.locator(`[data-testid="${testId}"]`).isVisible().catch(() => false);
      console.log(`  ${testId}: ${count} elemento(s), visível: ${visible}`);
    }

    console.log('\n📄 Procurando no HTML por "login-submit-btn":');
    const html = await page.content();
    const found = html.includes('login-submit-btn');
    console.log(`  Encontrado no HTML: ${found}`);

    if (found) {
      const idx = html.indexOf('login-submit-btn');
      console.log(`  Contexto: ...${html.substring(Math.max(0, idx - 50), idx + 100)}...`);
    }

    console.log('\n✅ Aguardando 30 segundos para você inspecionar...');
    await page.waitForTimeout(30000);

  } catch (error) {
    console.error('❌ Erro:', error instanceof Error ? error.message : String(error));
  } finally {
    await browser.close();
  }
})();
