import { Given, When, Then } from '@cucumber/cucumber';
import { expect, Locator } from '@playwright/test';
import { CustomWorld } from '../support/world';

const MAINTENANCE_ADMIN = {
  email: 'admin@empresa.com',
  password: 'Admin@123',
};

const MAINTENANCE_ASSETS = {
  validation: 'E2E-AVAIL-004',
  cancel: 'E2E-AVAIL-005',
  complete: 'E2E-AVAIL-006',
};

async function waitForMaintenanceTable(world: CustomWorld) {
  await world.page
    .locator('table')
    .or(world.page.getByText('Nenhuma ordem encontrada'))
    .first()
    .waitFor({ timeout: 15000 });
}

async function waitForSelectableOption(select: Locator) {
  await expect(select).toBeVisible({ timeout: 15000 });
  // <option> elements are never "visible" in Playwright (no bounding box inside closed <select>).
  // Use toBeAttached() to verify the option exists in the DOM.
  await expect(select.locator('option:not([value=""])').first()).toBeAttached({ timeout: 15000 });
}

async function selectAssetByLabel(world: CustomWorld, assetTag: string) {
  const select = world.page.locator('label:has-text("Ativo")').locator('..').locator('select');
  await waitForSelectableOption(select);

  const option = select.locator('option').filter({ hasText: assetTag }).first();
  await expect(option).toBeAttached({ timeout: 15000 });

  const value = await option.getAttribute('value');
  expect(value).toBeTruthy();
  await select.selectOption(value!);
}

function getMaintenanceRow(world: CustomWorld) {
  if (!world.createdMaintenanceDescription) {
    throw new Error('Nenhuma descrição de manutenção foi registrada no cenário atual.');
  }

  return world.page.locator('tbody tr').filter({ hasText: world.createdMaintenanceDescription }).first();
}

Given('que acesso a página de manutenção como administrador', async function (this: CustomWorld) {
  await this.login(MAINTENANCE_ADMIN.email, MAINTENANCE_ADMIN.password);
  await this.goto('/maintenance');
  await expect(this.page.getByRole('heading', { name: 'Manutenção' })).toBeVisible();
  await waitForMaintenanceTable(this);
});

Then('devo ver a tela de manutenção carregada', async function (this: CustomWorld) {
  await expect(this.page.getByRole('heading', { name: 'Manutenção' })).toBeVisible();
  await waitForMaintenanceTable(this);
});

Then('devo ver o botão {string} na tela de manutenção', async function (
  this: CustomWorld,
  label: string,
) {
  await expect(this.page.getByRole('button', { name: label })).toBeVisible();
});

When('abro o formulário de nova manutenção', async function (this: CustomWorld) {
  await this.page.getByRole('button', { name: 'Abrir Ordem' }).click();
  await expect(this.page.getByRole('heading', { name: 'Abrir Ordem de Manutenção' })).toBeVisible();
});

When('seleciono o ativo seeded para validação de manutenção', async function (this: CustomWorld) {
  await selectAssetByLabel(this, MAINTENANCE_ASSETS.validation);
});

When('seleciono o ativo seeded para cancelamento de manutenção', async function (this: CustomWorld) {
  await selectAssetByLabel(this, MAINTENANCE_ASSETS.cancel);
});

When('seleciono o ativo seeded para fluxo completo de manutenção', async function (this: CustomWorld) {
  await selectAssetByLabel(this, MAINTENANCE_ASSETS.complete);
});

When('preencho a descrição da nova manutenção com {string}', async function (
  this: CustomWorld,
  descricao: string,
) {
  this.createdMaintenanceDescription = descricao;
  await this.page.locator('textarea[placeholder*="Descreva o problema detalhadamente"]').fill(descricao);
});

When('preencho a descrição da nova manutenção com um texto único', async function (this: CustomWorld) {
  this.createdMaintenanceDescription = `E2E manutenção ${Date.now()}`;
  await this.page
    .locator('textarea[placeholder*="Descreva o problema detalhadamente"]')
    .fill(this.createdMaintenanceDescription);
});

Then('o botão de abrir manutenção deve ficar desabilitado', async function (this: CustomWorld) {
  await expect(this.page.getByRole('button', { name: 'Abrir Ordem' }).last()).toBeDisabled();
});

When('confirmo a nova manutenção', async function (this: CustomWorld) {
  const confirmButton = this.page.getByRole('button', { name: 'Abrir Ordem' }).last();
  await expect(confirmButton).toBeEnabled({ timeout: 15000 });
  await confirmButton.click();
  await expect(this.page.getByRole('heading', { name: 'Abrir Ordem de Manutenção' })).toBeHidden({
    timeout: 15000,
  });
  await waitForMaintenanceTable(this);
});

Then('devo ver a manutenção recém-criada com status {string}', async function (
  this: CustomWorld,
  status: string,
) {
  const row = getMaintenanceRow(this);
  await expect(row).toBeVisible({ timeout: 15000 });
  await expect(row.getByText(status)).toBeVisible({ timeout: 15000 });
});

When('cancelo a manutenção selecionada', async function (this: CustomWorld) {
  this.page.once('dialog', async (dialog) => {
    await dialog.accept();
  });

  const row = getMaintenanceRow(this);
  await row.locator('[title="Cancelar"]').click();
  await waitForMaintenanceTable(this);
});

When('inicio a manutenção selecionada', async function (this: CustomWorld) {
  const row = getMaintenanceRow(this);
  await row.locator('[title="Iniciar"]').click();
  await waitForMaintenanceTable(this);
});

When('filtro as manutenções por status {string}', async function (this: CustomWorld, status: string) {
  const buttons = this.page.locator('button').filter({ hasText: status });
  await expect(buttons.first()).toBeVisible({ timeout: 10000 });
  await buttons.first().click();
  await waitForMaintenanceTable(this);
});

Then('devo ver apenas manutenções com status {string}', async function (this: CustomWorld, status: string) {
  const table = this.page.locator('table');
  const noResults = this.page.getByText('Nenhuma ordem encontrada');
  await expect(table.or(noResults).first()).toBeVisible({ timeout: 10000 });

  const rows = this.page.locator('tbody tr:not(:has(td[colspan]))');
  const count = await rows.count();
  if (count > 0) {
    for (let i = 0; i < count; i++) {
      await expect(rows.nth(i).getByText(status)).toBeVisible({ timeout: 10000 });
    }
  }
});

When('abro o modal de conclusão da manutenção selecionada', async function (this: CustomWorld) {
  const row = getMaintenanceRow(this);
  await row.locator('[title="Concluir"]').click();
  await expect(this.page.getByRole('heading', { name: 'Concluir Manutenção' })).toBeVisible({ timeout: 15000 });
});

Then('o botão de concluir deve estar desabilitado sem resolução', async function (this: CustomWorld) {
  const confirmButton = this.page.locator('button').filter({ hasText: /^Concluir$/ });
  await expect(confirmButton).toBeDisabled({ timeout: 10000 });
});

When('concluo a manutenção selecionada com uma resolução única', async function (this: CustomWorld) {
  const row = getMaintenanceRow(this);
  await row.locator('[title="Concluir"]').click();

  await expect(this.page.getByRole('heading', { name: 'Concluir Manutenção' })).toBeVisible({
    timeout: 15000,
  });

  await this.page
    .locator('textarea[placeholder*="Descreva como o problema foi resolvido"]')
    .fill(`Resolução E2E ${Date.now()} para manutenção`);

  // Scope to text content to avoid matching TipButtons that have aria-label="Concluir" but no text.
  const confirmButton = this.page.locator('button').filter({ hasText: /^Concluir$/ });
  await expect(confirmButton).toBeEnabled({ timeout: 15000 });
  await confirmButton.click();

  await expect(this.page.getByRole('heading', { name: 'Concluir Manutenção' })).toBeHidden({
    timeout: 15000,
  });
  await waitForMaintenanceTable(this);
});
