/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      loginAs(role: 'admin' | 'gestor' | 'operador'): Chainable<void>;
      navigateToAssets(): Chainable<void>;
      waitForTableLoad(): Chainable<void>;
      closeModal(): Chainable<void>;
    }
  }
}

/**
 * Realiza login com as credenciais do perfil informado.
 * Credenciais são lidas a partir das variáveis de ambiente do cypress.config.ts.
 */
Cypress.Commands.add('loginAs', (role: 'admin' | 'gestor' | 'operador') => {
  const credentials = {
    admin: {
      email: Cypress.env('ADMIN_EMAIL'),
      password: Cypress.env('ADMIN_PASSWORD'),
    },
    gestor: {
      email: Cypress.env('GESTOR_EMAIL'),
      password: Cypress.env('GESTOR_PASSWORD'),
    },
    operador: {
      email: Cypress.env('OPERADOR_EMAIL'),
      password: Cypress.env('OPERADOR_PASSWORD'),
    },
  };

  const { email, password } = credentials[role];

  cy.session(
    [role, email],
    () => {
      cy.visit('/login');
      cy.get('input[type="email"]').type(email);
      cy.get('input[type="password"]').type(password);
      cy.contains('button', 'Entrar no sistema').click();
      cy.url().should('not.include', '/login');
    },
    {
      cacheAcrossSpecs: true,
    }
  );
});

/**
 * Navega para a página de ativos e aguarda o carregamento da tabela.
 */
Cypress.Commands.add('navigateToAssets', () => {
  cy.visit('/assets');
  cy.waitForTableLoad();
});

/**
 * Aguarda a tabela de ativos terminar de carregar.
 */
Cypress.Commands.add('waitForTableLoad', () => {
  cy.contains('Carregando...').should('not.exist');
  cy.get('table').should('be.visible');
});

/**
 * Fecha o modal atual pressionando Escape ou clicando em Cancelar.
 */
Cypress.Commands.add('closeModal', () => {
  cy.get('body').type('{esc}');
});

export {};
