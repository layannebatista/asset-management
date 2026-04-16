import { Given, When, Then, Before, After } from '@cucumber/cucumber';
import { expect, Page } from '@playwright/test';
import { CustomWorld } from '../support/world';

const CREDENTIALS = {
  admin: { email: 'admin@empresa.com', password: 'Admin@123' },
  gestor: { email: 'gestor@empresa.com', password: 'Gestor@123' },
  operador: { email: 'operador@empresa.com', password: 'Op@12345' },
};

const E2E_ASSETS = {
  availableFilter: 'E2E-AVAIL-009',
  assignedFilter: 'E2E-ASSIGN-001',
  assign: 'E2E-AVAIL-001',
  maintenance: 'E2E-AVAIL-002',
  transfer: 'E2E-AVAIL-003',
};

async function searchAsset(world: CustomWorld, term: string) {
  const searchInput = world.page.locator('input[placeholder*="Buscar por modelo ou código"]');
  const responsePromise = world.page.waitForResponse(
    (resp) => resp.url().includes('/assets') && resp.status() === 200,
    { timeout: 10000 },
  ).catch(() => {});
  await searchInput.fill(term);
  await responsePromise;
  await world.waitForTableLoad();
}

async function waitForSelectableOption(select: ReturnType<Page['locator']>) {
  await expect(select).toBeVisible({ timeout: 15000 });
  // <option> elements are never "visible" in Playwright (no bounding box inside closed <select>).
  // Use toBeAttached() to verify the option exists in the DOM.
  await expect(select.locator('option:not([disabled]):not([value=""])').first()).toBeAttached({
    timeout: 15000,
  });
}

async function getVisibleAssetRows(world: CustomWorld) {
  await world.waitForTableLoad();
  const rows = world.page.locator('tbody tr:not(:has(td[colspan]))');
  const noResults = world.page.getByText('Nenhum ativo encontrado');

  if (await noResults.isVisible().catch(() => false)) {
    return { rows, count: 0 };
  }

  await expect(rows.first()).toBeVisible({ timeout: 15000 });
  return { rows, count: await rows.count() };
}

Before(async function (this: CustomWorld) {});

After({ tags: '@allure.label.story:Criação_de_ativo' }, async function (this: CustomWorld) {
  await this.captureCreatedAssetId();
  await this.retireCreatedAsset();
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

Given('que filtro os ativos por status {string}', async function (this: CustomWorld, status: string) {
  await this.page.click(`button:has-text("${status}")`);
  await this.page.waitForLoadState('load', { timeout: 5000 }).catch(() => {});
  await this.waitForTableLoad();

  if (status === 'Disponível') {
    const created = await this.ensureAvailableAsset();
    if (created) {
      await this.page.click(`button:has-text("${status}")`);
      await this.page.waitForLoadState('load', { timeout: 5000 }).catch(() => {});
      await this.waitForTableLoad();
    }
    await searchAsset(this, E2E_ASSETS.availableFilter);
  }

  if (status === 'Atribuído') {
    await searchAsset(this, E2E_ASSETS.assignedFilter);
  }
});

When('filtro os ativos por status {string}', async function (this: CustomWorld, status: string) {
  await this.page.click(`button:has-text("${status}")`);
  await this.page.waitForLoadState('load', { timeout: 5000 }).catch(() => {});
  await this.waitForTableLoad();

  if (status === 'Disponível') {
    const created = await this.ensureAvailableAsset();
    if (created) {
      await this.page.click(`button:has-text("${status}")`);
      await this.page.waitForLoadState('load', { timeout: 5000 }).catch(() => {});
      await this.waitForTableLoad();
    }
    await searchAsset(this, E2E_ASSETS.availableFilter);
  }

  if (status === 'Atribuído') {
    await searchAsset(this, E2E_ASSETS.assignedFilter);
  }
});

When('busco por {string}', async function (this: CustomWorld, termo: string) {
  await this.page.fill('input[placeholder*="Buscar por modelo ou código"]', termo);
  await this.waitForTableLoad();
});

Then('devo ver a lista de ativos', async function (this: CustomWorld) {
  await expect(this.page.locator('table')).toBeVisible();
  const rows = this.page.locator('tbody tr');
  await expect(rows).toHaveCount(await rows.count());
  expect(await rows.count()).toBeGreaterThan(0);
});

Then('devo ver as colunas {string}, {string}, {string}, {string}, {string}', async function (
  this: CustomWorld,
  col1: string,
  col2: string,
  col3: string,
  col4: string,
  col5: string,
) {
  for (const col of [col1, col2, col3, col4, col5]) {
    await expect(this.page.locator('thead').getByText(col)).toBeVisible();
  }
});

Then('devo ver apenas ativos com status disponível', async function (this: CustomWorld) {
  const { rows, count } = await getVisibleAssetRows(this);
  expect(count).toBeGreaterThan(0);
  for (let i = 0; i < count; i++) {
    await expect(rows.nth(i).getByText('Disponível')).toBeVisible({ timeout: 15000 });
  }
});

Then('devo ver apenas ativos com status atribuído', async function (this: CustomWorld) {
  const { rows, count } = await getVisibleAssetRows(this);
  expect(count).toBeGreaterThan(0);
  for (let i = 0; i < count; i++) {
    await expect(rows.nth(i).getByText('Atribuído')).toBeVisible({ timeout: 15000 });
  }
});

Then('devo ver ativos que correspondem à busca', async function (this: CustomWorld) {
  const table = this.page.locator('table');
  const noResults = this.page.getByText('Nenhum ativo encontrado');
  await expect(table.or(noResults).first()).toBeVisible();
});

Then('não devo ver o botão {string}', async function (this: CustomWorld, label: string) {
  await expect(this.page.locator(`button:has-text("${label}")`)).toBeHidden();
});

Then('não devo ver o botão {string} na lista', async function (this: CustomWorld, label: string) {
  await expect(this.page.locator(`[title="${label}"]`)).toBeHidden();
});

When('clico no botão {string}', async function (this: CustomWorld, label: string) {
  await this.page.click(`button:has-text("${label}")`);
});

When('confirmo a criação do ativo sem preencher os campos', async function (this: CustomWorld) {
  await this.page.click('button:has-text("Criar Ativo")', { force: true });
});

Then('o formulário não deve ser enviado', async function (this: CustomWorld) {
  await expect(this.page.getByRole('heading', { name: 'Novo Ativo' })).toBeVisible();
});

Then('devo ver aviso de mínimo de caracteres', async function (this: CustomWorld) {
  await expect(this.page.locator('text=/Mínimo de 10 caracteres/')).toBeVisible();
});

When('preencho o tipo de ativo com {string}', async function (this: CustomWorld, tipo: string) {
  const select = this.page.locator('label:has-text("Tipo")').locator('..').locator('select');
  await select.selectOption(tipo);
});

When('preencho o modelo do ativo com um nome único', async function (this: CustomWorld) {
  this.createdAssetModel = `E2E-Temp-${Date.now()}`;
  await this.page.fill('input[placeholder="Dell Latitude 5520"]', this.createdAssetModel);
});

When('seleciono a primeira unidade disponível', async function (this: CustomWorld) {
  const select = this.page.locator('label:has-text("Unidade")').locator('..').locator('select');
  await waitForSelectableOption(select);
  const options = await select.locator('option:not([disabled]):not([value=""])').all();
  if (options.length > 0) {
    const value = await options[0].getAttribute('value');
    if (value) {
      await select.selectOption(value);
    }
  }
});

When('confirmo a criação do ativo', async function (this: CustomWorld) {
  const confirmButton = this.page.getByRole('button', { name: 'Criar Ativo' });
  await expect(confirmButton).toBeEnabled({ timeout: 15000 });
  await confirmButton.click();
});

Then('o modal de criação deve ser fechado', async function (this: CustomWorld) {
  await expect(this.page.getByRole('heading', { name: 'Novo Ativo' })).toBeHidden({ timeout: 15000 });
  await this.waitForTableLoad();
});

Then('o ativo deve aparecer na lista', async function (this: CustomWorld) {
  if (this.createdAssetModel) {
    await this.page.fill('input[placeholder*="Buscar por modelo ou código"]', this.createdAssetModel);
    await this.waitForTableLoad();
    await expect(this.page.locator('tbody tr').first()).toContainText(this.createdAssetModel);
  } else {
    await expect(this.page.locator('tbody tr').first()).toBeVisible();
  }
});

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

When('clico em "Atribuir usuário" do primeiro ativo disponível', async function (this: CustomWorld) {
  await searchAsset(this, E2E_ASSETS.assign);
  const btn = this.page.locator('tbody tr').first().locator('[title="Atribuir usuário"]');
  await btn.waitFor({ state: 'visible', timeout: 15000 });
  await btn.click();
});

When('seleciono o primeiro usuário disponível', async function (this: CustomWorld) {
  const select = this.page.locator('label:has-text("Usuário")').locator('..').locator('select');
  await waitForSelectableOption(select);
  const options = await select.locator('option:not([disabled]):not([value=""])').all();
  if (options.length > 0) {
    const value = await options[0].getAttribute('value');
    if (value) {
      await select.selectOption(value);
    }
  }
});

When('confirmo a atribuição', async function (this: CustomWorld) {
  const confirmButton = this.page.getByRole('button', { name: 'Confirmar Atribuição' });
  await expect(confirmButton).toBeEnabled({ timeout: 15000 });
  await confirmButton.click();
});

Then('o modal de atribuição deve ser fechado', async function (this: CustomWorld) {
  await expect(this.page.getByRole('heading', { name: 'Atribuir Usuário ao Ativo' })).toBeHidden({
    timeout: 15000,
  });
  await this.waitForTableLoad();
});

When('clico em "Abrir manutenção" do primeiro ativo disponível', async function (this: CustomWorld) {
  await searchAsset(this, E2E_ASSETS.maintenance);
  const btn = this.page.locator('tbody tr').first().locator('[title="Abrir manutenção"]');
  await btn.waitFor({ state: 'visible', timeout: 15000 });
  await btn.click();
});

When('preencho a descrição da manutenção com {string}', async function (this: CustomWorld, descricao: string) {
  await this.page.fill('textarea[placeholder*="Descreva o problema"]', descricao);
});

When('confirmo a solicitação de manutenção', async function (this: CustomWorld) {
  const confirmButton = this.page.getByRole('button', { name: 'Abrir Ordem' });
  await expect(confirmButton).toBeEnabled({ timeout: 15000 });
  await confirmButton.click();
});

Then('o modal de manutenção deve ser fechado', async function (this: CustomWorld) {
  await expect(this.page.getByRole('heading', { name: /Manutenção:/ })).toBeHidden({ timeout: 15000 });
  await this.waitForTableLoad();
});

When('clico em "Solicitar transferência" do primeiro ativo disponível', async function (this: CustomWorld) {
  await searchAsset(this, E2E_ASSETS.transfer);
  const btn = this.page.locator('tbody tr').first().locator('[title="Solicitar transferência"]');
  await btn.waitFor({ state: 'visible', timeout: 15000 });
  await btn.click();
});

When('seleciono a primeira unidade de destino disponível', async function (this: CustomWorld) {
  const select = this.page.locator('label:has-text("Unidade de Destino")').locator('..').locator('select');
  await waitForSelectableOption(select);
  const options = await select.locator('option:not([disabled]):not([value=""])').all();
  if (options.length > 0) {
    const value = await options[0].getAttribute('value');
    if (value) {
      await select.selectOption(value);
    }
  }
});

When('preencho o motivo da transferência com {string}', async function (this: CustomWorld, motivo: string) {
  await this.page.fill('textarea[placeholder*="Descreva o motivo"]', motivo);
});

When('confirmo a solicitação de transferência', async function (this: CustomWorld) {
  // Scope to role="dialog" to avoid matching TipButton with aria-label="Solicitar transferência".
  const confirmButton = this.page.getByRole('dialog').getByRole('button', { name: 'Solicitar Transferência' });
  await expect(confirmButton).toBeEnabled({ timeout: 15000 });
  await confirmButton.click();
});

Then('o modal de transferência deve ser fechado', async function (this: CustomWorld) {
  await expect(this.page.getByRole('heading', { name: /Transferir:/ })).toBeHidden({ timeout: 15000 });
  await this.waitForTableLoad();
});

Then('o download do arquivo deve ser iniciado', async function (this: CustomWorld) {
  const downloadPromise = this.page.waitForEvent('download');
  await this.page.click('button:has-text("Exportar CSV")');
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.(csv|xlsx?)$/i);
});

When('seleciono o tipo {string} no filtro de tipo', async function (this: CustomWorld, tipo: string) {
  const select = this.page.locator('select').filter({ has: this.page.locator('option:has-text("Todos os tipos")') });
  await expect(select).toBeVisible({ timeout: 10000 });
  await select.selectOption({ label: tipo });
  await this.waitForTableLoad();
});

Then('devo ver apenas ativos do tipo notebook na lista', async function (this: CustomWorld) {
  const { rows, count } = await getVisibleAssetRows(this);
  expect(count).toBeGreaterThan(0);
  for (let i = 0; i < count; i++) {
    await expect(rows.nth(i).getByText('Notebook')).toBeVisible({ timeout: 10000 });
  }
});

Then('devo ver o botão {string}', async function (this: CustomWorld, label: string) {
  await expect(this.page.getByRole('button', { name: label })).toBeVisible({ timeout: 10000 });
});

Then('devo ver o botão de aposentar no primeiro ativo disponível', async function (this: CustomWorld) {
  await searchAsset(this, E2E_ASSETS.availableFilter);
  const btn = this.page.locator('tbody tr').first().locator('[title="Aposentar ativo"]');
  await expect(btn).toBeVisible({ timeout: 15000 });
});
