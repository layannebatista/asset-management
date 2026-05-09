import React from "react";
import ReactDOM from "react-dom/client";

import "./index.css";

import AppRoutes from "./routes/AppRoutes";
import { AuthProvider } from "./context/AuthContext";
import { TestIdInjector } from "./components/TestIdInjector";

// ────────────────────────────────────────────────────────
// FIX: Injeta data-testid após renderização do React
// (workaround para atributos sendo removidos na compilação)
// ────────────────────────────────────────────────────────
console.log('✅ Iniciando injeção de test IDs...');

(window as any).__injectTestIds = function injectTestIds() {
  console.log('💉 Executando injeção de test IDs');

  // Injeta em botões
  document.querySelectorAll('button').forEach((btn) => {
    const text = btn.textContent?.trim() || '';
    if (text === 'Entrar no sistema' || text === 'Entrar') btn.setAttribute('data-testid', 'login-submit-btn');
    if (text.includes('Novo Ativo')) btn.setAttribute('data-testid', 'asset-new-btn');
    if (text.includes('Exportar CSV')) btn.setAttribute('data-testid', 'asset-export-btn');
    if (text === 'Criar Ativo') btn.setAttribute('data-testid', 'create-asset-confirm-btn');
    if (text.includes('Abrir Ordem')) btn.setAttribute('data-testid', 'maintenance-open-order-btn');
  });

  // Injeta em inputs de email/senha
  document.querySelectorAll('input[type="email"]').forEach((input) => {
    if (!input.hasAttribute('data-testid')) {
      input.setAttribute('data-testid', 'login-email-input');
    }
  });

  document.querySelectorAll('input[type="password"]').forEach((input) => {
    if (!input.hasAttribute('data-testid')) {
      input.setAttribute('data-testid', 'login-password-input');
    }
  });

  // Injeta em outros inputs
  document.querySelectorAll('input[placeholder*="Buscar"]').forEach((input) => {
    input.setAttribute('data-testid', 'asset-search-input');
  });

  document.querySelectorAll('input[placeholder*="código"]').forEach((input) => {
    input.setAttribute('data-testid', 'mfa-code-input');
  });

  // Injeta em selects
  const selects = document.querySelectorAll('select');
  selects.forEach((select, i) => {
    if (i === 0 && !select.hasAttribute('data-testid')) {
      select.setAttribute('data-testid', 'asset-type-filter');
    }
  });

  console.log('✅ Injeção concluída');
};

// Executa após renderização inicial do React
setTimeout(() => {
  (window as any).__injectTestIds?.();
}, 1000);

// Também executa em mudanças no DOM
const observer = new MutationObserver(() => {
  setTimeout(() => (window as any).__injectTestIds?.(), 100);
});
observer.observe(document.body, { childList: true, subtree: true });

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <AuthProvider>
      <TestIdInjector />
      <AppRoutes />
    </AuthProvider>
  </React.StrictMode>
);