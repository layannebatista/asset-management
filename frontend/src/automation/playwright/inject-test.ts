import { chromium } from 'playwright'

(async () => {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext()
  const page = await context.newPage()

  try {
    await page.goto('http://localhost:5173/login', { waitUntil: 'domcontentloaded', timeout: 15000 })
    await page.waitForTimeout(2000)

    // Executa injeção via Playwright
    await page.evaluate(() => {
      const btns = document.querySelectorAll('button') as NodeListOf<HTMLButtonElement>
      btns.forEach(btn => {
        if (btn.textContent?.includes('Entrar')) {
          btn.setAttribute('data-testid', 'login-submit-btn')
        }
      })

      const inputs = document.querySelectorAll('input[type="email"]')
      inputs.forEach(el => el.setAttribute('data-testid', 'login-email-input'))

      const pws = document.querySelectorAll('input[type="password"]')
      pws.forEach(el => el.setAttribute('data-testid', 'login-password-input'))
    })

    // Verifica se funcionou
    const count = await page.locator('[data-testid]').count()
    console.log(`✅ Test IDs adicionados: ${count}`)

    const ids = await page.locator('[data-testid]').all()
    for (const el of ids) {
      const id = await el.getAttribute('data-testid')
      console.log(`  - ${id}`)
    }

  } catch (error) {
    console.error('❌', error instanceof Error ? error.message : String(error))
  } finally {
    await browser.close()
  }
})()
