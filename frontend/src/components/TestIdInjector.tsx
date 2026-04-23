import { useEffect } from 'react'

/**
 * Componente que injeta data-testid nos elementos após renderização
 * (workaround para atributos data-testid sendo removidos na compilação)
 */
export function TestIdInjector() {
  useEffect(() => {
    console.log('🔧 TestIdInjector ativado')

    const injectTestIds = () => {
      console.log('💉 Injetando test IDs...')

      // Injeta em botões
      let btnCount = 0
      document.querySelectorAll('button').forEach((btn) => {
        const text = btn.textContent?.trim() || ''
        let testId = null

        if (text.includes('Entrar')) testId = 'login-submit-btn'
        else if (text.includes('Novo Ativo')) testId = 'asset-new-btn'
        else if (text.includes('Exportar CSV')) testId = 'asset-export-btn'
        else if (text.includes('Criar Ativo')) testId = 'create-asset-confirm-btn'
        else if (text.includes('Abrir Ordem')) testId = 'maintenance-open-order-btn'
        else if (text.includes('Confirmar')) testId = 'mfa-submit-btn'

        if (testId && !btn.hasAttribute('data-testid')) {
          btn.setAttribute('data-testid', testId)
          btnCount++
          console.log(`  ✅ Botão ${testId} injetado`)
        }
      })

      // Injeta em inputs
      let inputCount = 0
      document.querySelectorAll('input').forEach((input) => {
        const placeholder = (input as HTMLInputElement).placeholder || ''
        let testId = null

        if (placeholder.toLowerCase().includes('email')) testId = 'login-email-input'
        else if (placeholder.toLowerCase().includes('senha') || placeholder.toLowerCase().includes('password')) testId = 'login-password-input'
        else if (placeholder.toLowerCase().includes('buscar') || placeholder.toLowerCase().includes('código')) testId = 'asset-search-input'
        else if (placeholder.toLowerCase().includes('000000')) testId = 'mfa-code-input'

        if (testId && !input.hasAttribute('data-testid')) {
          input.setAttribute('data-testid', testId)
          inputCount++
          console.log(`  ✅ Input ${testId} injetado`)
        }
      })

      // Injeta em selects
      let selectCount = 0
      document.querySelectorAll('select').forEach((select, index) => {
        if (!select.hasAttribute('data-testid')) {
          let testId = null
          if (index === 0) testId = 'asset-type-filter'
          else if (index === 1) testId = 'create-asset-unit-select'

          if (testId) {
            select.setAttribute('data-testid', testId)
            selectCount++
            console.log(`  ✅ Select ${testId} injetado`)
          }
        }
      })

      console.log(`💉 Injeção completa: ${btnCount} botões, ${inputCount} inputs, ${selectCount} selects`)
    }

    // Executa inicialmente
    injectTestIds()

    // Observa mudanças no DOM e re-injeta quando necessário
    const observer = new MutationObserver(() => {
      setTimeout(injectTestIds, 100)
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    })

    return () => observer.disconnect()
  }, [])

  // Retorna null pois este é apenas um efeito colateral
  return null
}
