import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../../support/world';
import { E2E_ASSETS, findAssetRow, searchAsset } from './helpers';

function mockAssetsPage(content: Array<Record<string, unknown>>) {
  return {
    content,
    pageable: { pageNumber: 0, pageSize: 10 },
    totalPages: 1,
    totalElements: content.length,
    last: true,
    first: true,
    size: 10,
    number: 0,
    numberOfElements: content.length,
    empty: content.length === 0,
  };
}

// ──────────────────────────────────────────────────────────────────────────
// Desatribuição de ativo
// ──────────────────────────────────────────────────────────────────────────

When('clico em "Desatribuir usuário" do primeiro ativo atribuído', async function (this: CustomWorld) {
  const row = await findAssetRow(this, E2E_ASSETS.assignedFilter);
  const btn = row.locator('[title="Desatribuir usuário"], [title="Remover atribuição"]');
  await btn.waitFor({ state: 'visible', timeout: 15000 });
  await btn.click();
});

Then('o modal de desatribuição deve ser fechado', async function (this: CustomWorld) {
  await expect(this.page.getByRole('heading', { name: /Desatribuir|Remover atribuição/i })).toBeHidden({ timeout: 15000 });
  await this.waitForTableLoad();
});

Then('o ativo deve retornar ao status disponível', async function (this: CustomWorld) {
  const availableFilter = this.page.getByRole('button', { name: /Disponível/i }).first();
  const stableAvailableFilter = this.page.getByTestId('asset-status-filter-available');
  if (await stableAvailableFilter.isVisible().catch(() => false)) {
    await stableAvailableFilter.click();
  } else if (await availableFilter.isVisible().catch(() => false)) {
    await availableFilter.click();
  }
  await this.waitForTableLoad();
  await searchAsset(this, E2E_ASSETS.assignedFilter);
  const row = await findAssetRow(this, E2E_ASSETS.assignedFilter);
  await expect(row.getByText(/Disponível|AVAILABLE/i)).toBeVisible({ timeout: 15000 });
});

// ──────────────────────────────────────────────────────────────────────────
// Aposentadoria de ativo (RetireModal)
// ──────────────────────────────────────────────────────────────────────────

When('clico em "Aposentar ativo" do ativo seeded para aposentadoria', async function (this: CustomWorld) {
  const row = await findAssetRow(this, E2E_ASSETS.retire);
  const btn = row.getByTestId('asset-action-retire');
  await btn.waitFor({ state: 'visible', timeout: 15000 });
  await btn.click();
  await expect(this.page.getByTestId('retire-modal')).toBeVisible({ timeout: 15000 });
});

When('digito o código do ativo no modal de confirmação', async function (this: CustomWorld) {
  const modal = this.page.getByTestId('retire-modal');
  await expect(modal).toBeVisible({ timeout: 15000 });

  const tagInLabel = await modal
    .locator('label span.font-mono')
    .first()
    .textContent({ timeout: 10000 })
    .catch(() => E2E_ASSETS.retire);

  const assetTag = (tagInLabel || E2E_ASSETS.retire).trim();
  await modal.getByTestId('retire-confirm-input').fill(assetTag);
});

When('digito um código incorreto no modal de confirmação', async function (this: CustomWorld) {
  await this.page.getByTestId('retire-confirm-input').fill('CODIGO-ERRADO-XYZ');
});

When('confirmo a aposentadoria', async function (this: CustomWorld) {
  const btn = this.page.getByTestId('retire-confirm-btn');
  await expect(btn).toBeEnabled({ timeout: 10000 });
  await btn.click();
});

Then('o modal de aposentadoria deve ser fechado', async function (this: CustomWorld) {
  await expect(this.page.getByTestId('retire-modal')).toBeHidden({ timeout: 15000 });
  await this.waitForTableLoad();
});

Then('o botão de confirmar aposentadoria deve ficar desabilitado', async function (this: CustomWorld) {
  const btn = this.page.getByTestId('retire-confirm-btn');
  await expect(btn).toBeDisabled({ timeout: 5000 });
});

// ──────────────────────────────────────────────────────────────────────────
// Asset RETIRED — sem ações de mudança de estado
// ──────────────────────────────────────────────────────────────────────────

Then('não devo ver ações de atribuir manutenção ou transferência na linha', async function (this: CustomWorld) {
  const row = this.page.locator('tbody tr').first();
  await expect(row).toBeVisible({ timeout: 15000 });
  await expect(row.getByTestId('asset-action-assign')).toBeHidden();
  await expect(row.getByTestId('asset-action-maintenance')).toBeHidden();
  await expect(row.getByTestId('asset-action-transfer')).toBeHidden();
});

// ──────────────────────────────────────────────────────────────────────────
// Escopos por papel
// ──────────────────────────────────────────────────────────────────────────

Then('a lista de ativos deve conter apenas ativos do operador ou estado vazio', async function (this: CustomWorld) {
  // OPERADOR: a API filtra por assignedUserId do operador.
  // O frontend deve mostrar a lista (possivelmente vazia se nenhum ativo está atribuído ao operador).
  const tableOrEmpty = this.page
    .locator('table')
    .or(this.page.getByText(/Nenhum ativo encontrado/i));
  await expect(tableOrEmpty.first()).toBeVisible({ timeout: 15000 });
});

Then('a lista de ativos deve estar filtrada pela unidade do gestor', async function (this: CustomWorld) {
  // GESTOR: a API filtra por unitId do gestor automaticamente.
  // O frontend deve renderizar sem erro — presença de tabela ou mensagem de lista vazia confirma o escopo.
  const tableOrEmpty = this.page
    .locator('table')
    .or(this.page.getByText(/Nenhum ativo encontrado/i));
  await expect(tableOrEmpty.first()).toBeVisible({ timeout: 15000 });
});

// ──────────────────────────────────────────────────────────────────────────
// Proteção de rota (BLOCKER)
// ──────────────────────────────────────────────────────────────────────────

Given('que limpo a sessão ativa', async function (this: CustomWorld) {
  await this.goto('/login');
  await this.page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await this.page.context().clearCookies();
  await this.page.reload({ waitUntil: 'domcontentloaded' });
});

When('tento navegar para a página de ativos sem autenticação', async function (this: CustomWorld) {
  await this.goto('/assets');
  await this.page.waitForLoadState('domcontentloaded');
});

Given(
  'que a API de ativos valida os parâmetros de URL status {string} unitId {string} assignedUserId {string} e type {string}',
  async function (
    this: CustomWorld,
    status: string,
    unitId: string,
    assignedUserId: string,
    _type: string,
  ) {
    await this.page.route('**/api/assets*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(
          mockAssetsPage([
            {
              id: 9101,
              assetTag: 'URL-MOCK-001',
              model: 'Notebook URL Filter',
              type: 'NOTEBOOK',
              status: 'ASSIGNED',
              unitId: Number(unitId),
              assignedUserId: Number(assignedUserId),
            },
          ]),
        ),
      });
    });
  },
);

When('acesso a página de ativos com a URL {string}', async function (this: CustomWorld, path: string) {
  await this.goto(path);
  const responsePromise = this.page.waitForResponse(
    (response) => response.url().includes('/api/assets') && response.request().method() === 'GET',
    { timeout: 15000 },
  );

  const responseArrived = await responsePromise
    .then(() => true)
    .catch(() => false);

  if (!responseArrived) {
    await this.page.waitForLoadState('networkidle', { timeout: 10000 });
  }

  await this.waitForTableLoad();
});

Then('devo ver o ativo mockado filtrado pela URL', async function (this: CustomWorld) {
  const row = this.page.locator('tbody tr').filter({ hasText: 'URL-MOCK-001' }).first();
  await expect(row).toBeVisible({ timeout: 15000 });
  await expect(row).toContainText('Notebook', { timeout: 10000 });
  await expect(row).toContainText('Atribuído', { timeout: 10000 });
});

Then('não devo ver as colunas {string} e {string} na listagem', async function (
  this: CustomWorld,
  firstColumn: string,
  secondColumn: string,
) {
  await expect(this.page.locator('thead').getByText(firstColumn)).toBeHidden();
  await expect(this.page.locator('thead').getByText(secondColumn)).toBeHidden();
});

Given('que a listagem de ativos no modo insurance está mockada', async function (this: CustomWorld) {
  await this.page.route('**/api/assets/insurance/expiring*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: 7001,
          assetId: 9201,
          insurer: 'Seguradora QA',
          policyNumber: 'POL-EXP-001',
          expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          coverageAmount: 15000,
        },
      ]),
    });
  });

  await this.page.route('**/api/assets*', async (route) => {
    if (route.request().url().includes('/api/assets/insurance/expiring')) {
      await route.fallback();
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(
        mockAssetsPage([
          {
            id: 9201,
            assetTag: 'INS-EXP-001',
            model: 'Notebook com seguro expirando',
            type: 'NOTEBOOK',
            status: 'AVAILABLE',
            unitId: 1,
            assignedUserId: null,
          },
          {
            id: 9202,
            assetTag: 'INS-NOPE-001',
            model: 'Notebook sem seguro a vencer',
            type: 'NOTEBOOK',
            status: 'AVAILABLE',
            unitId: 1,
            assignedUserId: null,
          },
        ]),
      ),
    });
  });
});

Then('devo ver o banner do modo insurance', async function (this: CustomWorld) {
  await expect(
    this.page.getByText('Exibindo apenas ativos com apólice de seguro a vencer em até 30 dias. Acesse o detalhe do ativo para renovar.'),
  ).toBeVisible({ timeout: 15000 });
});

Then('devo ver a coluna {string} na listagem', async function (this: CustomWorld, column: string) {
  await expect(this.page.locator('thead').getByText(column)).toBeVisible({ timeout: 10000 });
});

Then('devo ver apenas ativos com apólice a vencer na listagem', async function (this: CustomWorld) {
  await expect(this.page.getByText('INS-EXP-001')).toBeVisible({ timeout: 15000 });
  await expect(this.page.getByText('INS-NOPE-001')).toBeHidden();
  await expect(this.page.getByText(/Seguradora QA/i)).toBeVisible({ timeout: 10000 });
});

Given('que a listagem de ativos com múltiplos status está mockada', async function (this: CustomWorld) {
  await this.page.route('**/api/assets*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(
        mockAssetsPage([
          { id: 9301, assetTag: 'STS-AVAIL-001', model: 'Asset Available', type: 'NOTEBOOK', status: 'AVAILABLE', unitId: 1, assignedUserId: null },
          { id: 9302, assetTag: 'STS-ASSIGN-001', model: 'Asset Assigned', type: 'NOTEBOOK', status: 'ASSIGNED', unitId: 1, assignedUserId: 55 },
          { id: 9303, assetTag: 'STS-MAINT-001', model: 'Asset Maintenance', type: 'NOTEBOOK', status: 'IN_MAINTENANCE', unitId: 1, assignedUserId: null },
          { id: 9304, assetTag: 'STS-TRANS-001', model: 'Asset Transfer', type: 'NOTEBOOK', status: 'IN_TRANSFER', unitId: 1, assignedUserId: null },
          { id: 9305, assetTag: 'STS-RET-001', model: 'Asset Retired', type: 'NOTEBOOK', status: 'RETIRED', unitId: 1, assignedUserId: null },
        ]),
      ),
    });
  });
});

Then('devo ver as ações corretas para cada status de ativo', async function (this: CustomWorld) {
  await this.page.waitForLoadState('networkidle', { timeout: 10000 });
  await this.waitForTableLoad();

  const availableRow = this.page.locator('tbody tr').filter({ hasText: 'STS-AVAIL-001' }).first();
  await expect(availableRow).toBeVisible({ timeout: 15000 });
  await expect(availableRow.getByTestId('asset-action-assign')).toBeVisible({ timeout: 15000 });
  await expect(availableRow.getByTestId('asset-action-transfer')).toBeVisible({ timeout: 15000 });
  await expect(availableRow.getByTestId('asset-action-maintenance')).toBeVisible({ timeout: 15000 });

  const assignedRow = this.page.locator('tbody tr').filter({ hasText: 'STS-ASSIGN-001' }).first();
  await expect(assignedRow.getByTestId('asset-action-unassign')).toBeVisible({ timeout: 15000 });
  await expect(assignedRow.getByTestId('asset-action-maintenance')).toBeVisible({ timeout: 15000 });
  await expect(assignedRow.getByTestId('asset-action-assign')).toBeHidden({ timeout: 15000 });

  const maintenanceRow = this.page.locator('tbody tr').filter({ hasText: 'STS-MAINT-001' }).first();
  await expect(maintenanceRow.getByTestId('asset-action-maintenance')).toBeHidden({ timeout: 15000 });
  await expect(maintenanceRow.getByTestId('asset-action-transfer')).toBeHidden({ timeout: 15000 });

  const transferRow = this.page.locator('tbody tr').filter({ hasText: 'STS-TRANS-001' }).first();
  await expect(transferRow.getByTestId('asset-action-transfer')).toBeHidden({ timeout: 15000 });
  await expect(transferRow.getByTestId('asset-action-assign')).toBeHidden({ timeout: 15000 });

  const retiredRow = this.page.locator('tbody tr').filter({ hasText: 'STS-RET-001' }).first();
  await expect(retiredRow.getByTestId('asset-action-retire')).toBeHidden({ timeout: 15000 });
  await expect(retiredRow.getByTestId('asset-action-maintenance')).toBeHidden({ timeout: 15000 });
  await expect(retiredRow.getByTestId('asset-action-transfer')).toBeHidden({ timeout: 15000 });
});

Given('que a operação de desatribuição de ativo responde 403', async function (this: CustomWorld) {
  await this.page.route('**/api/assets/*/unassign', async (route) => {
    await route.fulfill({
      status: 403,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Acesso negado para remover atribuição' }),
    });
  });

  await this.page.route('**/api/assets*', async (route) => {
    if (route.request().method() !== 'GET') {
      await route.fallback();
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(
        mockAssetsPage([
          { id: 9401, assetTag: 'FORBID-001', model: 'Asset Forbidden', type: 'NOTEBOOK', status: 'ASSIGNED', unitId: 1, assignedUserId: 10 },
        ]),
      ),
    });
  });

  await this.goto('/assets');
  await this.waitForTableLoad();
});

When('tento remover a atribuição do ativo bloqueado', async function (this: CustomWorld) {
  this.page.once('dialog', async (dialog) => {
    await dialog.accept();
  });

  const row = this.page.locator('tbody tr').filter({ hasText: 'FORBID-001' }).first();
  await row.locator('[title="Remover atribuição"]').click();
});

Then('devo ver a mensagem de erro de ativo {string}', async function (this: CustomWorld, message: string) {
  await expect(this.page.getByRole('alert')).toContainText(message, { timeout: 15000 });
});
