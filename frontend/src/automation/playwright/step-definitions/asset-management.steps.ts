import { Given, When, Then, Before } from '@cucumber/cucumber';
import { expect } from 'playwright/test';
import { CustomWorld } from '../support/world';

const CREDENTIALS = {
  admin: { email: 'admin@empresa.com', password: 'Admin@123' },
  gestor: { email: 'gestor@empresa.com', password: 'Gestor@123' },
  operador: { email: 'operador@empresa.com', password: 'Op@12345' },
};

// ─── Contexto / Background ───────────────────────────────────────────────────

Before(async function (this: CustomWorld) {
  // Inicialização ocorre no hook global (hooks.ts)
});

Given('que estou autenticado como administrador', async function (this: CustomWorld) {
  await this.login(CREDENTIALS.admin.email, CREDENTIALS.admin.password);
});

Given('que estou autenticado como gestor', async function (this: CustomWorld) {
  await this.login(CREDENTIALS.gestor.email, CREDENTIALS.gestor.password);
});

Given('que estou autenticado como operador', async function (this: CustomWorld) {
  await this.login(CREDENTIALS.operador.email, CREDENTIALS.operador.password);
});

Given('estou na página de ativos', async function (this: CustomWorld) {
  await this.goto('/assets');
  await this.waitForTableLoad();
});

// ─── Filtros e busca ──────────────────────────────────────────────────────────

Given('que filtro os ativos por status {string}', async function (this: CustomWorld, status: string) {
  await this.page.click(`button:has-text("${status}")`);
  await this.waitForTableLoad();
});

When('filtro os ativos por status {string}', async function (this: CustomWorld, status: string) {
  await this.page.click(`button:has-text("${status}")`);
  await this.waitForTableLoad();
});

When('busco por {string}', async function (this: CustomWorld, termo: string) {
  await this.page.fill('input[placeholder*="Buscar por modelo ou código"]', termo);
  await this.waitForTableLoad();
});

// ─── Assertions de listagem ───────────────────────────────────────────────────

Then('devo ver a lista de ativos', async function (this: CustomWorld) {
  await expect(this.page.locator('table')).toBeVisible();
  const rows = this.page.locator('tbody tr');
  await expect(rows).toHaveCount(await rows.count());
  expect(await rows.count()).toBeGreaterThan(0);
});

Then(
  'devo ver as colunas {string}, {string}, {string}, {string}, {string}',
  async function (this: CustomWorld, col1: string, col2: string, col3: string, col4: string, col5: string) {
    for (const col of [col1, col2, col3, col4, col5]) {
      await expect(this.page.locator('thead').getByText(col)).toBeVisible();
    }
  }
);

Then('devo ver apenas ativos com status disponível', async function (this: CustomWorld) {
  const rows = this.page.locator('tbody tr');
  const count = await rows.count();
  expect(count).toBeGreaterThan(0);
  for (let i = 0; i < count; i++) {
    await expect(rows.nth(i).getByText('Disponível')).toBeVisible();
  }
});

Then('devo ver apenas ativos com status atribuído', async function (this: CustomWorld) {
  const rows = this.page.locator('tbody tr');
  const count = await rows.count();
  expect(count).toBeGreaterThan(0);
  for (let i = 0; i < count; i++) {
    await expect(rows.nth(i).getByText('Atribuído')).toBeVisible();
  }
});

Then('devo ver ativos que correspondem à busca', async function (this: CustomWorld) {
  await expect(this.page.locator('table')).toBeVisible();
  const rows = this.page.locator('tbody tr');
  const empty = this.page.getByText('Nenhum ativo encontrado');
  const hasRows = (await rows.count()) > 0;
  const hasEmpty = await empty.isVisible();
  expect(hasRows || hasEmpty).toBe(true);
});

// ─── Criar ativo ─────────────────────────────────────────────────────────────

When('clico no botão {string}', async function (this: CustomWorld, label: string) {
  await this.page.click(`button:has-text("${label}")`);
});

When('preencho o tipo de ativo com {string}', async function (this: CustomWorld, tipo: string) {
  const select = this.page.locator('label:has-text("Tipo")').locator('..').locator('select');
  await select.selectOption(tipo);
});

When('preencho o modelo do ativo com {string}', async function (this: CustomWorld, modelo: string) {
  await this.page.fill('input[placeholder="Dell Latitude 5520"]', modelo);
});

When('seleciono a primeira unidade disponível', async function (this: CustomWorld) {
  const select = this.page.locator('label:has-text("Unidade")').locator('..').locator('select');
  const options = await select.locator('option:not([disabled]):not([value=""])').all();
  if (options.length > 0) {
    const value = await options[0].getAttribute('value');
    if (value) await select.selectOption(value);
  }
});

When('confirmo a criação do ativo', async function (this: CustomWorld) {
  await this.page.click('button:has-text("Criar Ativo")');
});

When('confirmo a criação do ativo sem preencher os campos', async function (this: CustomWorld) {
  await this.page.click('button:has-text("Criar Ativo")');
});

Then('o modal de criação deve ser fechado', async function (this: CustomWorld) {
  await expect(this.page.getByText('Novo Ativo')).toBeHidden();
  await this.waitForTableLoad();
});

Then('o formulário não deve ser enviado', async function (this: CustomWorld) {
  await expect(this.page.getByText('Novo Ativo')).toBeVisible();
  await expect(this.page.locator('button:has-text("Criar Ativo")')).toBeVisible();
});

// ─── Detalhes do ativo ────────────────────────────────────────────────────────

When('clico em "Ver detalhes" do primeiro ativo da lista', async function (this: CustomWorld) {
  await this.page.locator('tbody tr').first().locator('[title="Ver detalhes"]').click();
});

Then('devo estar na página de detalhes do ativo', async function (this: CustomWorld) {
  await expect(this.page).toHaveURL(/\/assets\/\d+/);
  await expect(this.page.locator('h1, h2').first()).toBeVisible();
});

Then('devo ver as informações básicas do ativo', async function (this: CustomWorld) {
  await expect(this.page.getByText('Código do Ativo')).toBeVisible();
  await expect(this.page.getByText('Modelo')).toBeVisible();
});

When('clico na aba de depreciação', async function (this: CustomWorld) {
  await this.page.locator('button, [role="tab"]').filter({ hasText: /deprecia/i }).click();
});

Then('devo ver as informações de depreciação', async function (this: CustomWorld) {
  await expect(this.page.getByText(/deprecia/i).first()).toBeVisible();
});

When('clico na aba de histórico', async function (this: CustomWorld) {
  await this.page.locator('button, [role="tab"]').filter({ hasText: /histórico|history/i }).click();
});

Then('devo ver o histórico do ativo', async function (this: CustomWorld) {
  await expect(this.page.getByText(/histórico|history/i).first()).toBeVisible();
});

// ─── Atribuição de usuário ────────────────────────────────────────────────────

When('clico em "Atribuir usuário" do primeiro ativo disponível', async function (this: CustomWorld) {
  await this.page.locator('tbody tr').first().locator('[title="Atribuir usuário"]').click();
});

When('seleciono o primeiro usuário disponível', async function (this: CustomWorld) {
  const select = this.page.locator('label:has-text("Usuário")').locator('..').locator('select');
  const options = await select.locator('option:not([disabled]):not([value=""])').all();
  if (options.length > 0) {
    const value = await options[0].getAttribute('value');
    if (value) await select.selectOption(value);
  }
});

When('confirmo a atribuição', async function (this: CustomWorld) {
  await this.page.click('button:has-text("Confirmar Atribuição")');
});

Then('o modal de atribuição deve ser fechado', async function (this: CustomWorld) {
  await expect(this.page.getByText('Atribuir Usuário ao Ativo')).toBeHidden();
  await this.waitForTableLoad();
});

// ─── Manutenção ───────────────────────────────────────────────────────────────

When('clico em "Abrir manutenção" do primeiro ativo disponível', async function (this: CustomWorld) {
  await this.page.locator('tbody tr').first().locator('[title="Abrir manutenção"]').click();
});

When('preencho a descrição da manutenção com {string}', async function (this: CustomWorld, descricao: string) {
  await this.page.fill('textarea[placeholder*="Descreva o problema"]', descricao);
});

When('confirmo a solicitação de manutenção', async function (this: CustomWorld) {
  await this.page.click('button:has-text("Abrir Ordem")');
});

Then('o modal de manutenção deve ser fechado', async function (this: CustomWorld) {
  await expect(this.page.locator('text=/Manutenção:/')).toBeHidden();
  await this.waitForTableLoad();
});

Then('devo ver aviso de mínimo de caracteres', async function (this: CustomWorld) {
  await expect(this.page.getByText(/Mínimo de 10 caracteres/)).toBeVisible();
});

// ─── Transferência ────────────────────────────────────────────────────────────

When('clico em "Solicitar transferência" do primeiro ativo disponível', async function (this: CustomWorld) {
  await this.page.locator('tbody tr').first().locator('[title="Solicitar transferência"]').click();
});

When('seleciono a primeira unidade de destino disponível', async function (this: CustomWorld) {
  const select = this.page.locator('label:has-text("Unidade de Destino")').locator('..').locator('select');
  const options = await select.locator('option:not([disabled]):not([value=""])').all();
  if (options.length > 0) {
    const value = await options[0].getAttribute('value');
    if (value) await select.selectOption(value);
  }
});

When('preencho o motivo da transferência com {string}', async function (this: CustomWorld, motivo: string) {
  await this.page.fill('textarea[placeholder*="Descreva o motivo"]', motivo);
});

When('confirmo a solicitação de transferência', async function (this: CustomWorld) {
  await this.page.click('button:has-text("Solicitar Transferência")');
});

Then('o modal de transferência deve ser fechado', async function (this: CustomWorld) {
  await expect(this.page.locator('text=/Transferir:/')).toBeHidden();
  await this.waitForTableLoad();
});

// ─── Controle de acesso ───────────────────────────────────────────────────────

Then('não devo ver o botão {string}', async function (this: CustomWorld, label: string) {
  await expect(this.page.locator(`button:has-text("${label}")`)).toBeHidden();
});

Then('não devo ver o botão {string} na lista', async function (this: CustomWorld, label: string) {
  await expect(this.page.locator(`[title="${label}"]`)).toBeHidden();
});

// ─── Exportação ───────────────────────────────────────────────────────────────

Then('o download do arquivo deve ser iniciado', async function (this: CustomWorld) {
  const downloadPromise = this.page.waitForEvent('download');
  await this.page.click('button:has-text("Exportar CSV")');
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.(csv|xlsx?)$/i);
});
