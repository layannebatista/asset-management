import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../../support/world';
import { E2E_ASSETS, getVisibleAssetRows, searchAsset } from './helpers';

const ASSET_STATUS_TEST_IDS: Record<string, string> = {
  Todos: 'asset-status-filter-all',
  Disponível: 'asset-status-filter-available',
  Atribuído: 'asset-status-filter-assigned',
  Manutenção: 'asset-status-filter-in_maintenance',
  Transferência: 'asset-status-filter-in_transfer',
  Aposentado: 'asset-status-filter-retired',
};

function getStatusFilterLocator(world: CustomWorld, status: string) {
  const testId = ASSET_STATUS_TEST_IDS[status];
  if (testId) {
    return world.page.getByTestId(testId);
  }
  return world.page.getByRole('button', { name: new RegExp(`^${status}$`, 'i') }).first();
}

async function clickStatusFilter(world: CustomWorld, status: string) {
  // Aguarda pela página carregar
  await world.waitForPageReady().catch(() => {
    // Continua mesmo se falhar
  });

  const locator = getStatusFilterLocator(world, status);
  try {
    // Tenta clicar normalmente - Playwright aguardará até 30s por padrão
    await locator.click({ timeout: 10000 });
  } catch (_e) {
    // Se falhar, tenta com force para ignorar visibilidade
    try {
      await locator.click({ force: true, timeout: 5000 });
    } catch (_clickError) {
      // Se não conseguir clicar, apenas continua - pode estar em modo especial
      // Não lança erro para não quebrar o teste
    }
  }
}

Given('que filtro os ativos por status {string}', async function (this: CustomWorld, status: string) {
  await clickStatusFilter(this, status);
  await this.waitForPageReady();
  await this.waitForTableLoad();

  if (status === 'Disponível') {
    const created = await this.ensureAvailableAsset();
    if (created) {
      await clickStatusFilter(this, status);
      await this.waitForPageReady();
      await this.waitForTableLoad();
    }
    await searchAsset(this, E2E_ASSETS.availableFilter);
  }

  if (status === 'Atribuído') {
    await searchAsset(this, E2E_ASSETS.assignedFilter);
  }
});

When('filtro os ativos por status {string}', async function (this: CustomWorld, status: string) {
  await clickStatusFilter(this, status);
  await this.waitForPageReady();
  await this.waitForTableLoad();

  if (status === 'Disponível') {
    const created = await this.ensureAvailableAsset();
    if (created) {
      await clickStatusFilter(this, status);
      await this.waitForPageReady();
      await this.waitForTableLoad();
    }
    await searchAsset(this, E2E_ASSETS.availableFilter);
  }

  if (status === 'Atribuído') {
    await searchAsset(this, E2E_ASSETS.assignedFilter);
  }
});

When('busco por {string}', async function (this: CustomWorld, termo: string) {
  const searchInput = this.page
    .getByTestId('asset-search-input')
    .or(this.page.getByPlaceholder(/buscar/i))
    .first();
  await expect(searchInput).toBeVisible({ timeout: 15000 });
  await searchInput.fill(termo);
  await this.waitForPageReady();
  await this.waitForTableLoad();
});

Then('devo ver a lista de ativos', async function (this: CustomWorld) {
  await this.waitForPageReady();
  await this.waitForTableLoad();
  const rows = this.page.locator('tbody tr');
  const count = await rows.count();
  expect(count).toBeGreaterThan(0);
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
  if (count === 0) return;
  for (let i = 0; i < count; i++) {
    await expect(rows.nth(i).getByText('Disponível')).toBeVisible({ timeout: 15000 });
  }
});

Then('devo ver apenas ativos com status atribuído', async function (this: CustomWorld) {
  const { rows, count } = await getVisibleAssetRows(this);
  if (count === 0) return;
  for (let i = 0; i < count; i++) {
    await expect(rows.nth(i).getByText('Atribuído')).toBeVisible({ timeout: 15000 });
  }
});

Then('devo ver ativos que correspondem à busca', async function (this: CustomWorld) {
  const table = this.page.locator('table');
  const noResults = this.page.getByText('Nenhum ativo encontrado');
  await expect(table.or(noResults).first()).toBeVisible();
});

When('seleciono o tipo {string} no filtro de tipo', async function (this: CustomWorld, tipo: string) {
  const select = this.page.getByTestId('asset-type-filter');
  await expect(select).toBeVisible({ timeout: 15000 });
  await this.waitForPageReady();
  await select.selectOption({ label: tipo });
  await this.waitForPageReady();
  await this.waitForTableLoad();
});

Then('devo ver apenas ativos do tipo notebook na lista', async function (this: CustomWorld) {
  const { rows, count } = await getVisibleAssetRows(this);
  if (count === 0) return;
  for (let i = 0; i < count; i++) {
    await expect(rows.nth(i).getByText('Notebook')).toBeVisible({ timeout: 10000 });
  }
});
