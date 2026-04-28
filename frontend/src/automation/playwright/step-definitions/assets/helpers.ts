import { expect, Page } from '@playwright/test';
import { CustomWorld } from '../../support/world';

export const CREDENTIALS = {
  admin: { email: 'admin@empresa.com', password: 'Admin@123' },
  gestor: { email: 'gestor@empresa.com', password: 'Gestor@123' },
  operador: { email: 'operador@empresa.com', password: 'Op@12345' },
};

export const E2E_ASSETS = {
  availableFilter: 'E2E-AVAIL-009',
  assignedFilter: 'E2E-ASSIGN-001',
  assign: 'E2E-AVAIL-001',
  maintenance: 'E2E-AVAIL-002',
  transfer: 'E2E-AVAIL-003',
  retire: 'E2E-AVAIL-010',
};

export async function searchAsset(world: CustomWorld, term: string) {
  const searchInput = world.page.getByTestId('asset-search-input');
  const responsePromise = world.page
    .waitForResponse((resp) => resp.url().includes('/assets') && resp.status() === 200, {
      timeout: 10000,
    })
    .then(() => true)
    .catch(() => false);
  await searchInput.fill(term);
  const responseArrived = await responsePromise;
  if (!responseArrived) {
    await world.page.waitForLoadState('networkidle', { timeout: 10000 });
  }
  await world.waitForTableLoad();
}

export async function findAssetRow(world: CustomWorld, preferredTerm?: string) {
  if (preferredTerm) {
    await searchAsset(world, preferredTerm);

    const preferredRow = world.page.locator('tbody tr:not(:has(td[colspan]))').filter({ hasText: preferredTerm }).first();
    if (await preferredRow.isVisible().catch(() => false)) {
      return preferredRow;
    }

    const searchInput = world.page.getByTestId('asset-search-input');
    await searchInput.fill('');
    await world.waitForTableLoad();
  }

  const fallbackRow = world.page.getByTestId('asset-row').first();
  await expect(fallbackRow).toBeVisible({ timeout: 15000 });
  return fallbackRow;
}

export async function waitForSelectableOption(select: ReturnType<Page['locator']>) {
  await expect(select).toBeVisible({ timeout: 15000 });
  await expect(select.locator('option:not([disabled]):not([value=""])').first()).toBeAttached({
    timeout: 15000,
  });
}

export async function getVisibleAssetRows(world: CustomWorld) {
  await world.waitForTableLoad();
  const rows = world.page.getByTestId('asset-row');
  const noResults = world.page.getByText('Nenhum ativo encontrado');

  if (await noResults.isVisible().catch(() => false)) {
    return { rows, count: 0 };
  }

  await expect(rows.first()).toBeVisible({ timeout: 15000 });
  return { rows, count: await rows.count() };
}
