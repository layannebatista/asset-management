import { After, Then, When } from '@cucumber/cucumber';
import { expect, Locator } from '@playwright/test';
import { CustomWorld } from '../../support/world';
import { waitForSelectableOption } from './helpers';

function getCreateAssetDialog(world: CustomWorld) {
  return world.page
    .getByRole('dialog')
    .filter({ has: world.page.getByRole('heading', { name: 'Novo Ativo' }) })
    .first();
}

// Get type select: first select in dialog (for type field)
function getTypeSelect(dialog: Locator) {
  return dialog.locator('select').first();
}

// Get model input: first input in dialog (for model field)
function getModelInput(dialog: Locator) {
  return dialog.locator('input').first();
}

// Get unit select: second select in dialog (for unit field)
function getUnitSelect(dialog: Locator) {
  return dialog.locator('select').nth(1);
}

After({ tags: '@allure.label.story:Criação_de_ativo' }, async function (this: CustomWorld) {
  await this.captureCreatedAssetId();
  await this.retireCreatedAsset();
});

When('clico no botão {string}', async function (this: CustomWorld, label: string) {
  // Use role-based selector for all buttons
  const btn = this.page.getByRole('button', { name: label });
  await expect(btn).toBeVisible({ timeout: 15000 });
  await btn.click();
});

When('confirmo a criação do ativo sem preencher os campos', async function (this: CustomWorld) {
  const dialog = getCreateAssetDialog(this);
  const confirmButton = dialog.getByRole('button', { name: /criar ativo/i }).first();
  await confirmButton.click({ force: true });
});

Then('o formulário não deve ser enviado', async function (this: CustomWorld) {
  await expect(this.page.getByRole('heading', { name: 'Novo Ativo' })).toBeVisible();
});

When('preencho o tipo de ativo com {string}', async function (this: CustomWorld, tipo: string) {
  const dialog = getCreateAssetDialog(this);
  await expect(dialog).toBeVisible({ timeout: 15000 });

  const select = getTypeSelect(dialog);
  await expect(select).toBeVisible({ timeout: 15000 });
  await select.selectOption(tipo);
  
  // Wait for React to process
  await this.page.waitForTimeout(300);
});

When('preencho o modelo do ativo com um nome único', async function (this: CustomWorld) {
  const dialog = getCreateAssetDialog(this);
  await expect(dialog).toBeVisible({ timeout: 15000 });

  this.createdAssetModel = `E2E-Temp-${Date.now()}`;
  const input = getModelInput(dialog);
  await expect(input).toBeVisible({ timeout: 15000 });
  
  await input.fill(this.createdAssetModel);
  await this.page.waitForTimeout(300);
});

When('seleciono a primeira unidade disponível', async function (this: CustomWorld) {
  const dialog = getCreateAssetDialog(this);
  await expect(dialog).toBeVisible({ timeout: 15000 });

  const select = getUnitSelect(dialog);
  await expect(select).toBeVisible({ timeout: 15000 });
  await waitForSelectableOption(select);

  const availableOptionsCount = await select.locator('option:not([disabled]):not([value=""])').count();
  expect(availableOptionsCount).toBeGreaterThan(0);

  const options = await select.locator('option:not([disabled]):not([value=""])').all();
  if (options.length > 0) {
    const value = await options[0].getAttribute('value');
    if (value) {
      await select.selectOption(value);
      await this.page.waitForTimeout(300);
    }
  }
});

When('confirmo a criação do ativo', async function (this: CustomWorld) {
  const dialog = getCreateAssetDialog(this);

  const confirmButton = dialog
    .getByRole('button', { name: /criar ativo/i })
    .first();

  const isEnabled = await confirmButton.isEnabled();
  if (!isEnabled) {
    await confirmButton.click({ force: true });
  } else {
    await confirmButton.click();
  }

  await this.page.waitForTimeout(1000);
});

Then('o modal de criação deve ser fechado', async function (this: CustomWorld) {
  // Modal should be hidden by checking for the dialog with "Novo Ativo" heading
  const modal = this.page
    .getByRole('dialog')
    .filter({ has: this.page.getByRole('heading', { name: 'Novo Ativo' }) })
    .first();
  await expect(modal).toBeHidden({ timeout: 15000 });
  await this.waitForTableLoad();
});

Then('o ativo deve aparecer na lista', async function (this: CustomWorld) {
  if (this.createdAssetModel) {
    // Find the search input by looking for a textbox role near the "Ativo" text
    const searchInput = this.page.getByRole('textbox').first();
    await expect(searchInput).toBeVisible({ timeout: 15000 });
    await searchInput.fill(this.createdAssetModel);
    await this.waitForTableLoad();
    
    // Find asset row by looking for table cells containing the model
    const assetRow = this.page
      .getByRole('row')
      .filter({ has: this.page.getByText(this.createdAssetModel) })
      .first();
    await expect(assetRow).toBeVisible({ timeout: 15000 });
  } else {
    // If no model was set, just check that at least one row exists
    const assetRow = this.page.getByRole('row').nth(1); // Skip header
    await expect(assetRow).toBeVisible({ timeout: 15000 });
  }
});
