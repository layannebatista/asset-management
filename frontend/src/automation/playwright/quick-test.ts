import { chromium } from 'playwright'

(async () => {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()

  try {
    await page.goto('http://localhost:5173/login', { waitUntil: 'domcontentloaded' })
    
    for (let i = 0; i < 5; i++) {
      await page.waitForTimeout(1000)
      const count = await page.locator('[data-testid]').count()
      const injectionReady = await page.evaluate(() => (window as any).__testIdInjectionReady)
      console.log(`Tempo: ${(i+1)*1000}ms - Test IDs: ${count}, Ready: ${injectionReady}`)
      if (count > 0) break
    }

  } finally {
    await browser.close()
  }
})()
