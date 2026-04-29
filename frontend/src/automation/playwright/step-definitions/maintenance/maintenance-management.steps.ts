import { Given, When, Then } from '@cucumber/cucumber';
import { expect, Locator } from '@playwright/test';
import { CustomWorld } from '../../support/world';

const MAINTENANCE_ADMIN = {
  email: 'admin@empresa.com',
  password: 'Admin@123',
};

const MAINTENANCE_ASSETS = {
  validation: 'E2E-AVAIL-004',
  cancel: 'E2E-AVAIL-005',
  complete: 'E2E-AVAIL-006',
  cancelInProgress: 'E2E-AVAIL-007',
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
  // Use toBeAttached() to verify the option exists. Poll to handle async asset loading.
  await expect
    .poll(
      async () => await select.locator('option:not([disabled]):not([value=""])').count(),
      { timeout: 20000, message: 'Nenhum ativo disponível no select de manutenção.' },
    )
    .toBeGreaterThan(0);
}

async function selectAssetByLabel(world: CustomWorld, assetTag: string) {
  // Fallback: se o data-testid não estiver no build compilado, usa o select dentro do modal
  const select = world.page
    .getByTestId('create-maintenance-asset-select')
    .or(world.page.getByTestId('create-maintenance-modal').locator('select').first());
  await waitForSelectableOption(select);

  const option = select.locator('option:not([value=""])').filter({ hasText: assetTag }).first();
  const hasPreferredOption = await option.count().then((count) => count > 0);

  if (!hasPreferredOption) {
    const fallbackOption = select.locator('option:not([value=""])').first();
    await expect(fallbackOption).toBeAttached({ timeout: 15000 });
    const fallbackValue = await fallbackOption.getAttribute('value');
    expect(fallbackValue).toBeTruthy();
    await select.selectOption(fallbackValue!);
    return;
  }

  await expect(option).toBeAttached({ timeout: 15000 });

  const value = await option.getAttribute('value');
  expect(value).toBeTruthy();
  await select.selectOption(value!);
}

function mockMaintenancePage(content: Array<Record<string, unknown>>) {
  return {
    content,
    pageable: { pageNumber: 0, pageSize: 20 },
    totalPages: 1,
    totalElements: content.length,
    last: true,
    first: true,
    size: 20,
    number: 0,
    numberOfElements: content.length,
    empty: content.length === 0,
  };
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
  // Aguarda carregamento completo
  await this.waitForPageReady(5000);
  await expect(this.page.getByRole('heading', { name: 'Manutenção' })).toBeVisible({ timeout: 15000 });
  // Aguarda pelos filtros de status ficarem visíveis
  await expect(this.page.getByTestId('maintenance-status-filter-all')).toBeVisible({ timeout: 15000 });
  // Aguarda pela tabela
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
  const openBtn = this.page.getByTestId('maintenance-open-order-btn');
  await expect(openBtn).toBeVisible({ timeout: 15000 });
  await openBtn.click();
  await expect(this.page.getByRole('heading', { name: 'Abrir Ordem de Manutenção' })).toBeVisible({ timeout: 15000 });
});

When('seleciono o ativo seeded para cancelamento de manutenção em andamento', async function (this: CustomWorld) {
  await selectAssetByLabel(this, MAINTENANCE_ASSETS.cancelInProgress);
});

Given('que acesso a página de manutenção como gestor', async function (this: CustomWorld) {
  await this.login('gestor@empresa.com', 'Gestor@123');
  await this.goto('/maintenance');
  await this.waitForPageReady(5000);
  await expect(this.page.getByRole('heading', { name: 'Manutenção' })).toBeVisible({ timeout: 15000 });
  await expect(this.page.getByTestId('maintenance-status-filter-all')).toBeVisible({ timeout: 15000 });
  await waitForMaintenanceTable(this);
});

Given('que acesso a página de manutenção como operador', async function (this: CustomWorld) {
  await this.login('operador@empresa.com', 'Op@12345');
  await this.goto('/maintenance');
  await this.waitForPageReady(5000);
  await expect(this.page.getByRole('heading', { name: 'Manutenção' })).toBeVisible({ timeout: 15000 });
  await expect(this.page.getByTestId('maintenance-status-filter-all')).toBeVisible({ timeout: 15000 });
  await waitForMaintenanceTable(this);
});

Then('a lista de manutenção deve estar visível ou indicar ausência de registros', async function (this: CustomWorld) {
  const tableOrEmpty = this.page
    .locator('table')
    .or(this.page.getByText(/Nenhuma ordem encontrada/i));
  await expect(tableOrEmpty.first()).toBeVisible({ timeout: 15000 });
});

Given('que a listagem de manutenção contém uma ordem bloqueada para iniciar', async function (this: CustomWorld) {
  await this.page.route('**/api/maintenance/budget*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        totalRecords: 1,
        completedRecords: 0,
        totalEstimatedCost: 0,
        totalActualCost: 0,
      }),
    });
  });

  await this.page.route('**/api/assets*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        content: [
          {
            id: 8801,
            assetTag: 'MNT-BLOCK-001',
            model: 'Asset Maintenance Blocked',
            type: 'NOTEBOOK',
            status: 'AVAILABLE',
            unitId: 1,
            assignedUserId: null,
          },
        ],
        totalElements: 1,
      }),
    });
  });

  await this.page.route('**/api/maintenance/*/start', async (route) => {
    await route.fulfill({
      status: 403,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Acesso negado para iniciar manutenção' }),
    });
  });

  await this.page.route('**/api/maintenance*', async (route) => {
    if (route.request().method() !== 'GET' || route.request().url().includes('/api/maintenance/budget')) {
      await route.fallback();
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(
        mockMaintenancePage([
          {
            id: 8701,
            assetId: 8801,
            description: 'Ordem bloqueada para teste de 403',
            status: 'REQUESTED',
            createdAt: new Date().toISOString(),
          },
        ]),
      ),
    });
  });

  await this.goto('/maintenance');
  await waitForMaintenanceTable(this);
});

When('tento iniciar a ordem de manutenção bloqueada', async function (this: CustomWorld) {
  const row = this.page.locator('tbody tr').filter({ hasText: 'Ordem bloqueada para teste de 403' }).first();
  await expect(row).toBeVisible({ timeout: 15000 });
  const startBtn = row.getByTestId('maintenance-action-start');
  await expect(startBtn).toBeVisible({ timeout: 15000 });
  await startBtn.click();
});

Then('devo ver a mensagem de erro de manutenção {string}', async function (this: CustomWorld, message: string) {
  await expect(this.page.getByRole('alert')).toContainText(message, { timeout: 15000 });
});

When('tento navegar para a página de manutenção sem autenticação', async function (this: CustomWorld) {
  await this.goto('/maintenance');
  await this.page.waitForLoadState('domcontentloaded');
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
  await this.page.getByTestId('create-maintenance-description-input').fill(descricao);
});

When('preencho a descrição da nova manutenção com um texto único', async function (this: CustomWorld) {
  this.createdMaintenanceDescription = `E2E manutenção ${Date.now()}`;
  await this.page
    .getByTestId('create-maintenance-description-input')
    .fill(this.createdMaintenanceDescription);
});

Then('o botão de abrir manutenção deve ficar desabilitado', async function (this: CustomWorld) {
  await expect(this.page.getByTestId('create-maintenance-confirm-btn')).toBeDisabled();
});

When('confirmo a nova manutenção', async function (this: CustomWorld) {
  const confirmButton = this.page.getByTestId('create-maintenance-confirm-btn');
  await expect(confirmButton).toBeEnabled({ timeout: 15000 });
  await confirmButton.click();
  await expect(this.page.getByTestId('create-maintenance-modal')).toBeHidden({
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
  await row.getByTestId('maintenance-action-cancel').click();
  await waitForMaintenanceTable(this);
});

When('inicio a manutenção selecionada', async function (this: CustomWorld) {
  const row = getMaintenanceRow(this);
  await row.getByTestId('maintenance-action-start').click();
  await waitForMaintenanceTable(this);
});

When('filtro as manutenções por status {string}', async function (this: CustomWorld, status: string) {
  const statusFilterTestIds: Record<string, string> = {
    'Todas': 'maintenance-status-filter-all',
    'Solicitado': 'maintenance-status-filter-requested',
    'Solicitada': 'maintenance-status-filter-requested',
    'Em Andamento': 'maintenance-status-filter-in_progress',
    'Concluído': 'maintenance-status-filter-completed',
    'Concluída': 'maintenance-status-filter-completed',
    'Cancelado': 'maintenance-status-filter-cancelled',
    'Cancelada': 'maintenance-status-filter-cancelled',
  };

  const testId = statusFilterTestIds[status] ?? `maintenance-status-filter-${status.toLowerCase()}`;
  const button = this.page.getByTestId(testId);
  await expect(button).toBeVisible({ timeout: 15000 });
  await button.click();
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
  await row.getByTestId('maintenance-action-complete').click();
  await expect(this.page.getByRole('heading', { name: 'Concluir Manutenção' })).toBeVisible({ timeout: 15000 });
});

Then('o botão de concluir deve estar desabilitado sem resolução', async function (this: CustomWorld) {
  const confirmButton = this.page.getByTestId('complete-maintenance-confirm-btn');
  await expect(confirmButton).toBeDisabled({ timeout: 10000 });
});

When('concluo a manutenção selecionada com uma resolução única', async function (this: CustomWorld) {
  const row = getMaintenanceRow(this);
  await row.getByTestId('maintenance-action-complete').click();

  await expect(this.page.getByRole('heading', { name: 'Concluir Manutenção' })).toBeVisible({
    timeout: 15000,
  });

  await this.page
    .getByTestId('complete-maintenance-resolution-input')
    .fill(`Resolução E2E ${Date.now()} para manutenção`);

  const confirmButton = this.page.getByTestId('complete-maintenance-confirm-btn');
  await expect(confirmButton).toBeEnabled({ timeout: 15000 });
  await confirmButton.click();

  await expect(this.page.getByTestId('complete-maintenance-modal')).toBeHidden({
    timeout: 15000,
  });
  await waitForMaintenanceTable(this);
});
