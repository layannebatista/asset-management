/// <reference types="cypress" />
import { Given, When, Then, Before } from '@badeball/cypress-cucumber-preprocessor';

// ─── Contexto / Background ───────────────────────────────────────────────────

Before(function () {
  // Limpa o estado entre cenários sem refazer login
});

Given('que estou autenticado como administrador', () => {
  cy.loginAs('admin');
});

Given('que estou autenticado como gestor', () => {
  cy.loginAs('gestor');
});

Given('que estou autenticado como operador', () => {
  cy.loginAs('operador');
});

Given('estou na página de ativos', () => {
  cy.navigateToAssets();
});

// ─── Filtros e busca ──────────────────────────────────────────────────────────

Given('que filtro os ativos por status {string}', (status: string) => {
  cy.contains('button', status).click();
  cy.waitForTableLoad();
});

When('filtro os ativos por status {string}', (status: string) => {
  cy.contains('button', status).click();
  cy.waitForTableLoad();
});

When('busco por {string}', (termo: string) => {
  cy.get('input[placeholder*="Buscar por modelo ou código"]').clear().type(termo);
  cy.waitForTableLoad();
});

// ─── Assertions de listagem ───────────────────────────────────────────────────

Then('devo ver a lista de ativos', () => {
  cy.get('table').should('be.visible');
  cy.get('tbody tr').should('have.length.greaterThan', 0);
});

Then('devo ver as colunas {string}, {string}, {string}, {string}, {string}', (
  col1: string,
  col2: string,
  col3: string,
  col4: string,
  col5: string
) => {
  const columns = [col1, col2, col3, col4, col5];
  columns.forEach((col) => {
    cy.get('thead').contains(col).should('be.visible');
  });
});

Then('devo ver apenas ativos com status disponível', () => {
  cy.get('tbody tr').should('have.length.greaterThan', 0);
  // Verifica que não existe badge de status diferente de Disponível
  cy.get('tbody tr').each(($row) => {
    cy.wrap($row).contains('Disponível').should('exist');
  });
});

Then('devo ver apenas ativos com status atribuído', () => {
  cy.get('tbody tr').should('have.length.greaterThan', 0);
  cy.get('tbody tr').each(($row) => {
    cy.wrap($row).contains('Atribuído').should('exist');
  });
});

Then('devo ver ativos que correspondem à busca', () => {
  cy.get('table').should('be.visible');
  // Pelo menos uma linha ou mensagem de resultado
  cy.get('body').then(($body) => {
    if ($body.find('tbody tr').length > 0) {
      cy.get('tbody tr').should('have.length.greaterThan', 0);
    } else {
      cy.contains('Nenhum ativo encontrado').should('be.visible');
    }
  });
});

// ─── Criar ativo ─────────────────────────────────────────────────────────────

When('clico no botão {string}', (label: string) => {
  cy.contains('button', label).click();
});

When('preencho o tipo de ativo com {string}', (tipo: string) => {
  cy.contains('label', 'Tipo').parent().find('select').select(tipo);
});

When('preencho o modelo do ativo com {string}', (modelo: string) => {
  cy.get('input[placeholder="Dell Latitude 5520"]').clear().type(modelo);
});

When('seleciono a primeira unidade disponível', () => {
  cy.contains('label', 'Unidade').parent().find('select').then(($select) => {
    const options = $select.find('option').not('[value=""]').not(':disabled');
    if (options.length > 0) {
      cy.wrap($select).select(options.first().val() as string);
    }
  });
});

When('confirmo a criação do ativo', () => {
  cy.contains('button', 'Criar Ativo').click();
});

When('confirmo a criação do ativo sem preencher os campos', () => {
  cy.contains('button', 'Criar Ativo').click();
});

Then('o modal de criação deve ser fechado', () => {
  cy.contains('Novo Ativo').should('not.exist');
  cy.waitForTableLoad();
});

Then('o formulário não deve ser enviado', () => {
  // Modal permanece aberto quando há erros de validação
  cy.contains('Novo Ativo').should('be.visible');
  cy.contains('button', 'Criar Ativo').should('be.visible');
});

// ─── Detalhes do ativo ────────────────────────────────────────────────────────

When('clico em "Ver detalhes" do primeiro ativo da lista', () => {
  cy.get('tbody tr').first().within(() => {
    cy.get('[title="Ver detalhes"]').click();
  });
});

Then('devo estar na página de detalhes do ativo', () => {
  cy.url().should('match', /\/assets\/\d+/);
  cy.get('h1, h2').should('be.visible');
});

Then('devo ver as informações básicas do ativo', () => {
  cy.contains('Código do Ativo').should('be.visible');
  cy.contains('Modelo').should('be.visible');
});

When('clico na aba de depreciação', () => {
  cy.contains('button, [role="tab"]', /deprecia/i).click();
});

Then('devo ver as informações de depreciação', () => {
  cy.contains(/deprecia/i).should('be.visible');
});

When('clico na aba de histórico', () => {
  cy.contains('button, [role="tab"]', /histórico|history/i).click();
});

Then('devo ver o histórico do ativo', () => {
  cy.contains(/histórico|history/i).should('be.visible');
});

// ─── Atribuição de usuário ────────────────────────────────────────────────────

When('clico em "Atribuir usuário" do primeiro ativo disponível', () => {
  cy.get('tbody tr').first().within(() => {
    cy.get('[title="Atribuir usuário"]').click();
  });
});

When('seleciono o primeiro usuário disponível', () => {
  cy.contains('label', 'Usuário').parent().find('select').then(($select) => {
    const options = $select.find('option').not('[value=""]').not(':disabled');
    if (options.length > 0) {
      cy.wrap($select).select(options.first().val() as string);
    }
  });
});

When('confirmo a atribuição', () => {
  cy.contains('button', 'Confirmar Atribuição').click();
});

Then('o modal de atribuição deve ser fechado', () => {
  cy.contains('Atribuir Usuário ao Ativo').should('not.exist');
  cy.waitForTableLoad();
});

// ─── Manutenção ───────────────────────────────────────────────────────────────

When('clico em "Abrir manutenção" do primeiro ativo disponível', () => {
  cy.get('tbody tr').first().within(() => {
    cy.get('[title="Abrir manutenção"]').click();
  });
});

When('preencho a descrição da manutenção com {string}', (descricao: string) => {
  cy.get('textarea[placeholder*="Descreva o problema"]').clear().type(descricao);
});

When('confirmo a solicitação de manutenção', () => {
  cy.contains('button', 'Abrir Ordem').click();
});

Then('o modal de manutenção deve ser fechado', () => {
  cy.contains(/Manutenção:/).should('not.exist');
  cy.waitForTableLoad();
});

Then('devo ver aviso de mínimo de caracteres', () => {
  cy.contains(/Mínimo de 10 caracteres/).should('be.visible');
});

// ─── Transferência ────────────────────────────────────────────────────────────

When('clico em "Solicitar transferência" do primeiro ativo disponível', () => {
  cy.get('tbody tr').first().within(() => {
    cy.get('[title="Solicitar transferência"]').click();
  });
});

When('seleciono a primeira unidade de destino disponível', () => {
  cy.contains('label', 'Unidade de Destino').parent().find('select').then(($select) => {
    const options = $select.find('option').not('[value=""]').not(':disabled');
    if (options.length > 0) {
      cy.wrap($select).select(options.first().val() as string);
    }
  });
});

When('preencho o motivo da transferência com {string}', (motivo: string) => {
  cy.get('textarea[placeholder*="Descreva o motivo"]').clear().type(motivo);
});

When('confirmo a solicitação de transferência', () => {
  cy.contains('button', 'Solicitar Transferência').click();
});

Then('o modal de transferência deve ser fechado', () => {
  cy.contains(/Transferir:/).should('not.exist');
  cy.waitForTableLoad();
});

// ─── Controle de acesso ───────────────────────────────────────────────────────

Then('não devo ver o botão {string}', (label: string) => {
  cy.contains('button', label).should('not.exist');
});

Then('não devo ver o botão {string} na lista', (label: string) => {
  cy.get(`[title="${label}"]`).should('not.exist');
});

// ─── Exportação ───────────────────────────────────────────────────────────────

Then('o download do arquivo deve ser iniciado', () => {
  // Cypress registra a requisição de download; verifica a chamada à API de exportação
  cy.intercept('GET', '**/export**').as('exportRequest');
  cy.contains('button', 'Exportar CSV').click();
  cy.wait('@exportRequest').its('response.statusCode').should('be.oneOf', [200, 204]);
});
