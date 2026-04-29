import { Then, When } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../../support/world';
import { E2E_ASSETS, findAssetRow, waitForSelectableOption } from './helpers';

async function getAssetMaintenanceConfirmButton(world: CustomWorld) {
  const modal = world.page
    .getByTestId('maintenance-modal')
    .or(world.page.getByTestId('create-maintenance-modal'))
    .first();

  await expect(modal).toBeVisible({ timeout: 15000 });

  const maintenanceButton = modal.getByTestId('maintenance-confirm-btn').first();
  if (await maintenanceButton.count().then((count) => count > 0)) {
    return maintenanceButton;
  }

  const createButton = modal.getByTestId('create-maintenance-confirm-btn').first();
  if (await createButton.count().then((count) => count > 0)) {
    return createButton;
  }

  return modal.getByRole('button', { name: /abrir ordem/i }).first();
}

When('clico em "Atribuir usuário" do primeiro ativo disponível', async function (this: CustomWorld) {
  const row = await findAssetRow(this, E2E_ASSETS.assign);
  const btn = row.getByTestId('asset-action-assign');
  await btn.waitFor({ state: 'visible', timeout: 15000 });
  await btn.click();
});

When('seleciono o primeiro usuário disponível', async function (this: CustomWorld) {
  const select = this.page.getByTestId('assign-user-select');
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
  const confirmButton = this.page.getByTestId('assign-user-confirm-btn');
  await expect(confirmButton).toBeEnabled({ timeout: 15000 });
  await confirmButton.click();
});

Then('o modal de atribuição deve ser fechado', async function (this: CustomWorld) {
  await expect(this.page.getByTestId('assign-user-modal')).toBeHidden({
    timeout: 15000,
  });
  await this.waitForTableLoad();
});

When('clico em "Abrir manutenção" do primeiro ativo disponível', async function (this: CustomWorld) {
  const row = await findAssetRow(this, E2E_ASSETS.maintenance);
  const btn = row.getByTestId('asset-action-maintenance');
  await btn.waitFor({ state: 'visible', timeout: 15000 });
  await btn.click();
});

When('preencho a descrição da manutenção com {string}', async function (this: CustomWorld, descricao: string) {
  await this.page.getByTestId('maintenance-description-input').fill(descricao);
});

When('confirmo a solicitação de manutenção', async function (this: CustomWorld) {
  const confirmButton = await getAssetMaintenanceConfirmButton(this);
  await expect(confirmButton).toBeEnabled({ timeout: 15000 });
  await confirmButton.click();
});

Then('o modal de manutenção deve ser fechado', async function (this: CustomWorld) {
  const modal = this.page
    .getByTestId('maintenance-modal')
    .or(this.page.getByTestId('create-maintenance-modal'))
    .first();
  await expect(modal).toBeHidden({ timeout: 15000 });
  await this.waitForTableLoad();
});

Then('devo ver aviso de mínimo de caracteres', async function (this: CustomWorld) {
  await expect(this.page.locator('text=/Mínimo de 10 caracteres/')).toBeVisible();
});

When('clico em "Solicitar transferência" do primeiro ativo disponível', async function (this: CustomWorld) {
  const row = await findAssetRow(this, E2E_ASSETS.transfer);
  const btn = row.getByTestId('asset-action-transfer');
  await btn.waitFor({ state: 'visible', timeout: 15000 });
  await btn.click();
});

When('seleciono a primeira unidade de destino disponível', async function (this: CustomWorld) {
  const select = this.page.getByTestId('asset-transfer-unit-select');
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
  await this.page.getByTestId('asset-transfer-reason-input').fill(motivo);
});

When('confirmo a solicitação de transferência', async function (this: CustomWorld) {
  const confirmButton = this.page.getByTestId('asset-transfer-confirm-btn');
  await expect(confirmButton).toBeEnabled({ timeout: 15000 });
  await confirmButton.click();
});

Then('o modal de transferência deve ser fechado', async function (this: CustomWorld) {
  await expect(this.page.getByTestId('asset-transfer-modal')).toBeHidden({ timeout: 15000 });
  await this.waitForTableLoad();
});
