import { chromium } from 'playwright'

const injectTestIds = async (page: any) => {
  await page.evaluate(() => {
    document.querySelectorAll('button').forEach((btn: HTMLButtonElement) => {
      const text = btn.textContent?.trim() || '';
      if (text === 'Entrar no sistema' || text === 'Entrar') btn.setAttribute('data-testid', 'login-submit-btn');
      if (text.includes('Novo Ativo')) btn.setAttribute('data-testid', 'asset-new-btn');
    });
    document.querySelectorAll('input[type="email"]').forEach(el => el.setAttribute('data-testid', 'login-email-input'));
    document.querySelectorAll('input[type="password"]').forEach(el => el.setAttribute('data-testid', 'login-password-input'));
  });
};

(async () => {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()

  try {
    await page.goto('http://localhost:5173/login', { waitUntil: 'domcontentloaded' })
    
    console.log('Antes da injeção:')
    let count = await page.locator('[data-testid]').count()
    console.log(`  Test IDs: ${count}`)

    await injectTestIds(page)

    console.log('\nDepois da injeção:')
    count = await page.locator('[data-testid]').count()
    console.log(`  Test IDs: ${count}`)

    if (count > 0) {
      const ids = await page.locator('[data-testid]').all()
      console.log('\n✅ Test IDs adicionados com sucesso:')
      for (const el of ids) {
        const id = await el.getAttribute('data-testid')
        console.log(`  - ${id}`)
      }
    } else {
      console.log('\n❌ Nenhum test ID foi adicionado')
    }

  } finally {
    await browser.close()
  }
})()
