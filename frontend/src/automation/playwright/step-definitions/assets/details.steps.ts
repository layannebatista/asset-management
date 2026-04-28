import { Then, When } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../../support/world';

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
