import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🔄 Acessando http://localhost:5173/test...');
    const response = await page.goto('http://localhost:5173/test', {
      waitUntil: 'domcontentloaded',
      timeout: 15000
    });

    console.log(`📡 Status: ${response?.status()}`);
    console.log(`🔗 URL: ${page.url()}`);

    console.log('⏳ Aguardando 2 segundos...');
    await page.waitForTimeout(2000);

    const bodyContent = await page.locator('body').innerHTML();
    console.log(`\n📝 Body content length: ${bodyContent.length}`);
    console.log(`📝 Primeiros 500 caracteres:\n${bodyContent.substring(0, 500)}`);

  } catch (error) {
    console.error('❌ Erro:', error instanceof Error ? error.message : String(error));
  } finally {
    await browser.close();
  }
})();
