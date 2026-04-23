const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('Acessando http://localhost:5173/login');
    await page.goto('http://localhost:5173/login', { waitUntil: 'domcontentloaded', timeout: 15000 });

    console.log('Aguardando 2 segundos...');
    await page.waitForTimeout(2000);

    console.log('\n=== Procurando elementos ===\n');

    const testIds = [
      'login-submit-btn',
      'login-email-input',
      'login-password-input',
      'demo-profile-admin',
    ];

    for (const testId of testIds) {
      const el = page.getByTestId(testId);
      const visible = await el.isVisible().catch(() => false);
      const count = await el.count();
      console.log(`${testId}: ${count} elemento(s), visível: ${visible}`);
    }

    // Screenshot
    const screenshot = await page.screenshot({ path: '/tmp/login-page.png' });
    console.log('\nScreenshot salvo em /tmp/login-page.png');

    // HTML da página
    const html = await page.content();
    console.log('\nProcurando por "login-submit-btn" no HTML:');
    const found = html.includes('login-submit-btn');
    console.log(`Encontrado: ${found}`);

    if (found) {
      const match = html.match(/data-testid="login-submit-btn"[^>]*>/);
      console.log(`Elemento: ${match ? match[0] : 'não encontrado'}`);
    }

  } catch (error) {
    console.error('Erro:', error.message);
  } finally {
    await browser.close();
  }
})();
