import { Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../../support/world';
import { E2E_ASSETS, findAssetRow } from './helpers';

Then('não devo ver o botão {string}', async function (this: CustomWorld, label: string) {
  const buttonTestIds: Record<string, string> = {
    'Novo Ativo': 'asset-new-btn',
    'Exportar CSV': 'asset-export-btn',
  };

  const testId = buttonTestIds[label];
  if (testId) {
    await expect(this.page.getByTestId(testId)).toBeHidden();
    return;
  }

  await expect(this.page.getByRole('button', { name: label })).toBeHidden();
});

Then('não devo ver o botão {string} na lista', async function (this: CustomWorld, label: string) {
  await expect(this.page.locator(`[title="${label}"]`)).toBeHidden();
});

Then('devo ver o botão {string}', async function (this: CustomWorld, label: string) {
  await expect(this.page.getByRole('button', { name: label })).toBeVisible({ timeout: 10000 });
});

Then('devo ver o botão de aposentar no primeiro ativo disponível', async function (this: CustomWorld) {
  const row = await findAssetRow(this, E2E_ASSETS.availableFilter);
  const btn = row.getByTestId('asset-action-retire');
  await expect(btn).toBeVisible({ timeout: 15000 });
});

Then('o download do arquivo deve ser iniciado', async function (this: CustomWorld) {
  const downloadPromise = this.page.waitForEvent('download');
  const exportBtn = this.page.getByTestId('asset-export-btn');
  await expect(exportBtn).toBeVisible({ timeout: 15000 });
  await exportBtn.click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.(csv|xlsx?)$/i);
});
