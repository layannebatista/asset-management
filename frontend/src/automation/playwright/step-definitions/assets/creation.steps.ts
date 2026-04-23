import { After, Then, When } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../../support/world';
import { waitForSelectableOption } from './helpers';

After({ tags: '@allure.label.story:Criação_de_ativo' }, async function (this: CustomWorld) {
  await this.captureCreatedAssetId();
  await this.retireCreatedAsset();
});

When('clico no botão {string}', async function (this: CustomWorld, label: string) {
  if (label === 'Novo Ativo') {
    const newBtn = this.page.getByTestId('asset-new-btn');
    await expect(newBtn).toBeVisible({ timeout: 15000 });
    await newBtn.click();
    return;
  }

  const btn = this.page.getByRole('button', { name: label });
  await expect(btn).toBeVisible({ timeout: 15000 });
  await btn.click();
});

When('confirmo a criação do ativo sem preencher os campos', async function (this: CustomWorld) {
  await this.page.getByTestId('create-asset-confirm-btn').click({ force: true });
});

Then('o formulário não deve ser enviado', async function (this: CustomWorld) {
  await expect(this.page.getByRole('heading', { name: 'Novo Ativo' })).toBeVisible();
});

When('preencho o tipo de ativo com {string}', async function (this: CustomWorld, tipo: string) {
  const select = this.page.getByTestId('create-asset-type-select');
  await select.selectOption(tipo);
});

When('preencho o modelo do ativo com um nome único', async function (this: CustomWorld) {
  this.createdAssetModel = `E2E-Temp-${Date.now()}`;
  await this.page.getByTestId('create-asset-model-input').fill(this.createdAssetModel);
});

When('seleciono a primeira unidade disponível', async function (this: CustomWorld) {
  const select = this.page.getByTestId('create-asset-unit-select');
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
  const confirmButton = this.page.getByTestId('create-asset-confirm-btn');
  await expect(confirmButton).toBeEnabled({ timeout: 15000 });
  await confirmButton.click();
});

Then('o modal de criação deve ser fechado', async function (this: CustomWorld) {
  await expect(this.page.getByTestId('create-asset-modal')).toBeHidden({ timeout: 15000 });
  await this.waitForTableLoad();
});

Then('o ativo deve aparecer na lista', async function (this: CustomWorld) {
  if (this.createdAssetModel) {
    await this.page.getByTestId('asset-search-input').fill(this.createdAssetModel);
    await this.waitForTableLoad();
    await expect(this.page.getByTestId('asset-row').first()).toContainText(this.createdAssetModel);
  } else {
    await expect(this.page.getByTestId('asset-row').first()).toBeVisible();
  }
});
