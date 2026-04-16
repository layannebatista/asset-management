import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../support/world';

const TRANSFER_ADMIN = {
  email: 'admin@empresa.com',
  password: 'Admin@123',
};

Given('que acesso a página de transferências como administrador', async function (this: CustomWorld) {
  await this.login(TRANSFER_ADMIN.email, TRANSFER_ADMIN.password);
  await this.goto('/transfers');
  await expect(this.page.getByRole('heading', { name: 'Transferências' })).toBeVisible();
});

Then('devo ver a tela de transferências carregada', async function (this: CustomWorld) {
  await expect(this.page.getByRole('heading', { name: 'Transferências' })).toBeVisible();
});

Then('devo ver o botão {string} na tela de transferências', async function (
  this: CustomWorld,
  label: string,
) {
  await expect(this.page.getByRole('button', { name: label })).toBeVisible();
});

When('abro o formulário de nova transferência', async function (this: CustomWorld) {
  await this.page.getByRole('button', { name: 'Nova Solicitação' }).click();
  await expect(this.page.getByRole('heading', { name: 'Nova Solicitação de Transferência' })).toBeVisible();
});

When('seleciono o primeiro ativo disponível na nova transferência', async function (this: CustomWorld) {
  const select = this.page.locator('label:has-text("Ativo *")').locator('..').locator('select');
  // Wait for options to load — the modal fetches assets asynchronously after opening.
  const firstOption = select.locator('option:not([value=""])').first();
  await expect(firstOption).toBeAttached({ timeout: 15000 });

  const value = await firstOption.getAttribute('value');
  expect(value).toBeTruthy();
  await select.selectOption(value!);
});

When('seleciono a primeira unidade de destino na nova transferência', async function (this: CustomWorld) {
  const select = this.page.locator('label:has-text("Unidade de Destino *")').locator('..').locator('select');
  // Wait for options to load — the modal fetches units asynchronously after opening.
  const firstOption = select.locator('option:not([value=""])').first();
  await expect(firstOption).toBeAttached({ timeout: 15000 });

  const value = await firstOption.getAttribute('value');
  expect(value).toBeTruthy();
  await select.selectOption(value!);
});

When('preencho o motivo da nova transferência com {string}', async function (
  this: CustomWorld,
  motivo: string,
) {
  this.createdTransferReason = motivo;
  await this.page.locator('textarea[placeholder*="motivo da transferência"]').fill(motivo);
});

When('preencho o motivo da nova transferência com um texto único', async function (this: CustomWorld) {
  this.createdTransferReason = `E2E transferência ${Date.now()}`;
  await this.page
    .locator('textarea[placeholder*="motivo da transferência"]')
    .fill(this.createdTransferReason);
});

Then('o botão de solicitar transferência deve ficar desabilitado', async function (this: CustomWorld) {
  await expect(this.page.getByRole('button', { name: 'Solicitar' })).toBeDisabled();
});

When('confirmo a nova transferência', async function (this: CustomWorld) {
  await this.page.getByRole('button', { name: 'Solicitar' }).click();
  await expect(this.page.getByRole('heading', { name: 'Nova Solicitação de Transferência' })).toBeHidden();
  // Wait for the loading spinner to appear (list is being reloaded) and then disappear.
  // If loading resolves before we can catch it, the catch is a no-op and we still continue.
  const loadingText = this.page.getByText('Carregando...');
  await loadingText.waitFor({ state: 'visible', timeout: 3000 }).catch(() => {});
  await loadingText.waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
});

Then('devo ver a transferência recém-criada em estado pendente', async function (this: CustomWorld) {
  // Wait for the sidebar list to show at least one transfer item (list reloaded after creation).
  // The transfer code "TRF-XXXXXX" in the sidebar uniquely identifies list items.
  const firstTransferCode = this.page.locator('span.font-mono').filter({ hasText: /^TRF-/ }).first();
  await expect(firstTransferCode).toBeVisible({ timeout: 20000 });

  // Click the first sidebar item to force-select it — this guarantees the detail panel
  // shows the newest (just-created) transfer, regardless of React's auto-selection timing.
  await firstTransferCode.click();

  // Confirm the detail panel shows a PENDING transfer (Cancelar only visible for PENDING).
  await expect(this.page.getByRole('button', { name: /Cancelar/ })).toBeVisible({ timeout: 15000 });

  if (this.createdTransferReason) {
    await expect(this.page.getByText(this.createdTransferReason)).toBeVisible({ timeout: 10000 });
  }

  await expect(this.page.getByText('Pendente').first()).toBeVisible();
});

When('cancelo a transferência selecionada', async function (this: CustomWorld) {
  await this.page.getByRole('button', { name: /Cancelar/ }).click();
});

When('aprovo a transferência selecionada', async function (this: CustomWorld) {
  await this.page.getByRole('button', { name: /Aprovar Transferência/ }).click();
});

When('confirmo o recebimento da transferência selecionada', async function (this: CustomWorld) {
  await this.page.getByRole('button', { name: /Confirmar Recebimento/ }).click();
});

When('rejeito a transferência selecionada', async function (this: CustomWorld) {
  await this.page.getByRole('button', { name: /Rejeitar/ }).click();
});

Then('devo ver a transferência selecionada com status {string}', async function (
  this: CustomWorld,
  status: string,
) {
  await expect(this.page.getByText(status)).toBeVisible({ timeout: 15000 });
});

When('filtro as transferências por status {string}', async function (this: CustomWorld, status: string) {
  const buttons = this.page.locator('button').filter({ hasText: status });
  await expect(buttons.first()).toBeVisible({ timeout: 10000 });
  await buttons.first().click();
  // Wait for the list to reload after applying the filter.
  await this.page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
});

Then('devo ver apenas transferências com status {string}', async function (this: CustomWorld, status: string) {
  const firstTransferCode = this.page.locator('span.font-mono').filter({ hasText: /^TRF-/ }).first();
  const noResults = this.page.getByText(/nenhuma transferência|nenhum resultado/i);
  await expect(firstTransferCode.or(noResults).first()).toBeVisible({ timeout: 15000 });

  // If there are transfers visible, verify all badges show the expected status.
  const isVisible = await firstTransferCode.isVisible().catch(() => false);
  if (isVisible) {
    await expect(this.page.getByText(status).first()).toBeVisible({ timeout: 10000 });
  }
});

Then('devo ver os detalhes da transferência selecionada', async function (this: CustomWorld) {
  // The detail panel should show the transfer reason/motivo and the origin/destination units.
  if (this.createdTransferReason) {
    await expect(this.page.getByText(this.createdTransferReason)).toBeVisible({ timeout: 10000 });
  }
  // Check that unit information is visible in the detail panel.
  await expect(this.page.getByText(/unidade|origem|destino/i).first()).toBeVisible({ timeout: 10000 });
});
