import { chromium } from 'playwright'

(async () => {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext()
  const page = await context.newPage()

  const consoleLogs: string[] = []

  page.on('console', msg => {
    consoleLogs.push(`[${msg.type()}] ${msg.text()}`)
  })

  try {
    console.log('🔄 Acessando http://localhost:5173/login...')
    await page.goto('http://localhost:5173/login', {
      waitUntil: 'domcontentloaded',
      timeout: 15000
    })

    console.log('⏳ Aguardando 4 segundos...')
    await page.waitForTimeout(4000)

    console.log('\n📋 Console logs capturados:')
    if (consoleLogs.length === 0) {
      console.log('  (nenhum)')
    } else {
      consoleLogs.forEach(log => {
        console.log(`  ${log}`)
      })
    }

    console.log('\n🔍 Procurando test IDs:')
    const testIds = await page.locator('[data-testid]').count()
    console.log(`  Total de elementos com data-testid: ${testIds}`)

    if (testIds > 0) {
      const ids = await page.locator('[data-testid]').all()
      for (const el of ids.slice(0, 5)) {
        const testId = await el.getAttribute('data-testid')
        console.log(`    - ${testId}`)
      }
    }

  } catch (error) {
    console.error('❌ Erro:', error instanceof Error ? error.message : String(error))
  } finally {
    await browser.close()
  }
})()
