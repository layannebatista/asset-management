import './commands';
import 'allure-cypress';

// Suprimir erros de ResizeObserver que podem aparecer em alguns browsers
Cypress.on('uncaught:exception', (err) => {
  if (err.message.includes('ResizeObserver loop')) {
    return false;
  }
  return true;
});

// Log de cada teste iniciado
beforeEach(() => {
  cy.log(`Iniciando: ${Cypress.currentTest.title}`);
});
