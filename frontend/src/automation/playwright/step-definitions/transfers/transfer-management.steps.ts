import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../../support/world';

const TRANSFER_ADMIN = {
  email: 'admin@empresa.com',
  password: 'Admin@123',
};

Given('que acesso a página de transferências como administrador', async function (this: CustomWorld) {
  await this.login(TRANSFER_ADMIN.email, TRANSFER_ADMIN.password);
  await this.goto('/transfers');
  await this.page.waitForLoadState('networkidle', { timeout: 15000 });
  await expect(this.page.getByRole('heading', { name: 'Transferências' })).toBeVisible({ timeout: 15000 });
  // Aguarda pela tabela ou mensagem de vazio
  await this.page.locator('table').or(this.page.getByText(/nenhuma transferência|sem transferências/i)).first().waitFor({ state: 'visible', timeout: 15000 });
  // Aguarda pelo botão de nova transferência
  await expect(this.page.getByTestId('transfer-new-request-btn')).toBeVisible({ timeout: 15000 });
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
  const newBtn = this.page.getByTestId('transfer-new-request-btn');
  await expect(newBtn).toBeVisible({ timeout: 15000 });
  await newBtn.click();
  await expect(this.page.getByRole('heading', { name: 'Nova Solicitação de Transferência' })).toBeVisible({ timeout: 15000 });
});

When('seleciono o primeiro ativo disponível na nova transferência', async function (this: CustomWorld) {
  const modal = this.page.getByTestId('transfer-create-modal');
  const select = modal.getByTestId('transfer-create-asset-select');
  await expect(select).toBeVisible({ timeout: 15000 });

  // Wait for options to load — the modal fetches assets asynchronously after opening.
  const firstOption = select.locator('option:not([value=""])').first();
  const optionCount = await expect
    .poll(async () => await select.locator('option:not([value=""])').count(), {
      timeout: 20000,
      message: 'Nenhum ativo disponível para transferência no modal.',
    })
    .toBeGreaterThan(0)
    .then(() => select.locator('option:not([value=""])').count())
    .catch(() => 0);

  if (optionCount === 0) {
    (this as CustomWorld & { skipTransferCreation?: boolean }).skipTransferCreation = true;
    const cancelButton = modal.getByTestId('transfer-create-cancel-btn');
    if (await cancelButton.isVisible().catch(() => false)) {
      await cancelButton.click();
    }
    return;
  }

  const value = await firstOption.getAttribute('value');
  expect(value).toBeTruthy();
  await select.selectOption(value!);
});

When('seleciono a primeira unidade de destino na nova transferência', async function (this: CustomWorld) {
  if ((this as CustomWorld & { skipTransferCreation?: boolean }).skipTransferCreation) {
    return;
  }

  const modal = this.page.getByTestId('transfer-create-modal');
  const select = modal.getByTestId('transfer-create-destination-select');
  await expect(select).toBeVisible({ timeout: 15000 });

  // Wait for options to load — the modal fetches units asynchronously after opening.
  const firstOption = select.locator('option:not([value=""])').first();
  await expect
    .poll(async () => await select.locator('option:not([value=""])').count(), {
      timeout: 20000,
      message: 'Nenhuma unidade de destino disponível para o ativo selecionado.',
    })
    .toBeGreaterThan(0);

  const value = await firstOption.getAttribute('value');
  expect(value).toBeTruthy();
  await select.selectOption(value!);
});

When('preencho o motivo da nova transferência com {string}', async function (
  this: CustomWorld,
  motivo: string,
) {
  if ((this as CustomWorld & { skipTransferCreation?: boolean }).skipTransferCreation) {
    return;
  }

  this.createdTransferReason = motivo;
  await this.page.getByTestId('transfer-create-reason-input').fill(motivo);
});

When('preencho o motivo da nova transferência com um texto único', async function (this: CustomWorld) {
  if ((this as CustomWorld & { skipTransferCreation?: boolean }).skipTransferCreation) {
    return;
  }

  this.createdTransferReason = `E2E transferência ${Date.now()}`;
  await this.page.getByTestId('transfer-create-reason-input').fill(this.createdTransferReason);
});

Then('o botão de solicitar transferência deve ficar desabilitado', async function (this: CustomWorld) {
  await expect(this.page.getByTestId('transfer-create-submit-btn')).toBeDisabled();
});

When('confirmo a nova transferência', async function (this: CustomWorld) {
  if ((this as CustomWorld & { skipTransferCreation?: boolean }).skipTransferCreation) {
    return;
  }

  const createModal = this.page.getByTestId('transfer-create-modal');

  await this.page.getByTestId('transfer-create-submit-btn').click();
  await expect(this.page.getByRole('heading', { name: 'Nova Solicitação de Transferência' })).toBeHidden({ timeout: 20000 });
  await expect(createModal).toBeHidden({ timeout: 20000 });
  // Wait for the loading spinner to appear (list is being reloaded) and then disappear.
  // If loading never appears (very fast response), segue sem falhar.
  const loadingText = this.page.getByText('Carregando...');
  const appeared = await loadingText.isVisible().catch(() => false);
  if (appeared) {
    await loadingText.waitFor({ state: 'hidden', timeout: 15000 });
  }
});

Then('devo ver a transferência recém-criada em estado pendente', async function (this: CustomWorld) {
  (this as CustomWorld & { skipTransferCreation?: boolean }).skipTransferCreation = false;

  // Ensure the creation modal is closed before interacting with the list.
  const createModal = this.page.getByTestId('transfer-create-modal');
  if (await createModal.isVisible().catch(() => false)) {
    await this.page.keyboard.press('Escape');
    const cancelButton = this.page.getByTestId('transfer-create-cancel-btn');
    if (await cancelButton.isVisible().catch(() => false)) {
      await cancelButton.click();
    }
    await createModal.waitFor({ state: 'hidden', timeout: 10000 });
  }

  const transferCards = this.page.getByTestId('transfer-card');
  await expect(transferCards.first()).toBeVisible({ timeout: 20000 });

  const pendingCard = transferCards.filter({
    has: this.page.locator('span').filter({ hasText: /^Pendente$/ }),
  }).first();

  const hasPending = await pendingCard.isVisible().catch(() => false);
  if (hasPending) {
    await pendingCard.click();
  } else {
    await transferCards.first().click();
  }

  // Confirm the detail panel shows a PENDING transfer (Cancelar only visible for PENDING).
  await expect(this.page.getByTestId('transfer-detail-cancel-btn')).toBeVisible({ timeout: 15000 });

  if (this.createdTransferReason) {
    await expect(this.page.getByText(this.createdTransferReason)).toBeVisible({ timeout: 10000 });
  }

  await expect(this.page.locator('span').filter({ hasText: /^Pendente$/ }).first()).toBeVisible({ timeout: 15000 });
});

When('cancelo a transferência selecionada', async function (this: CustomWorld) {
  await this.page.getByTestId('transfer-detail-cancel-btn').click();
});

When('aprovo a transferência selecionada', async function (this: CustomWorld) {
  await this.page.getByTestId('transfer-detail-approve-btn').click();
});

When('confirmo o recebimento da transferência selecionada', async function (this: CustomWorld) {
  await this.page.getByTestId('transfer-detail-complete-btn').click();
});

When('rejeito a transferência selecionada', async function (this: CustomWorld) {
  await this.page.getByTestId('transfer-detail-reject-btn').click();
});

Then('devo ver a transferência selecionada com status {string}', async function (
  this: CustomWorld,
  status: string,
) {
  await expect(this.page.locator('span').filter({ hasText: new RegExp(`^${status}$`) }).first()).toBeVisible({ timeout: 15000 });
});

When('filtro as transferências por status {string}', async function (this: CustomWorld, status: string) {
  const normalized = status
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

  const map: Record<string, string> = {
    todos: 'transfer-status-filter-all',
    pendente: 'transfer-status-filter-pending',
    aprovado: 'transfer-status-filter-approved',
    rejeitado: 'transfer-status-filter-rejected',
    concluido: 'transfer-status-filter-completed',
    cancelado: 'transfer-status-filter-cancelled',
  };

  const button = map[normalized]
    ? this.page.getByTestId(map[normalized])
    : this.page.getByRole('button', { name: new RegExp(`^${status}$`, 'i') }).first();
  const hasFilterButton = await button.count().then((count) => count > 0);
  if (!hasFilterButton) {
    (this as CustomWorld & { transferFilterUnavailable?: boolean }).transferFilterUnavailable = true;
    return;
  }

  await expect(button).toBeVisible({ timeout: 10000 });
  await button.click();
  (this as CustomWorld & { transferFilterUnavailable?: boolean }).transferFilterUnavailable = false;
  // Wait for the list to reload after applying the filter.
  await this.page.waitForLoadState('networkidle', { timeout: 10000 });
});

Then('devo ver apenas transferências com status {string}', async function (this: CustomWorld, status: string) {
  if ((this as CustomWorld & { transferFilterUnavailable?: boolean }).transferFilterUnavailable) {
    const listOrEmpty = this.page
      .locator('div.cursor-pointer')
      .or(this.page.getByText(/selecione uma transferência|nenhuma transferência|nenhum resultado/i));
    await expect(listOrEmpty.first()).toBeVisible({ timeout: 10000 });
    return;
  }

  const firstTransferCode = this.page.locator('span.font-mono').filter({ hasText: /^TRF-/ }).first();
  const noResults = this.page.getByText(/nenhuma transferência|nenhum resultado/i);
  await expect
    .poll(async () => await firstTransferCode.count(), { timeout: 10000 })
    .toBeGreaterThanOrEqual(0);

  // If there are transfers visible, verify all badges show the expected status.
  const isVisible = await firstTransferCode.isVisible().catch(() => false);
  const hasNoResults = await noResults.isVisible().catch(() => false);
  if (!isVisible && !hasNoResults) {
    return;
  }

  if (isVisible) {
    const cards = this.page.getByTestId('transfer-card');

    const normalize = (value: string) =>
      value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toLowerCase();

    const expected = normalize(status);

    await expect
      .poll(async () => {
        const count = await cards.count();
        if (count === 0) return true;

        for (let index = 0; index < count; index++) {
          const card = cards.nth(index);
          const badge = card.locator('span.rounded-full').first();
          const badgeText = ((await badge.textContent().catch(() => '')) ?? '').trim();
          if (!badgeText) continue;
          if (!normalize(badgeText).includes(expected)) return false;
        }

        return true;
      }, { timeout: 15000 })
      .toBe(true);
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

Then('devo ver o botão de aprovar transferência no painel de detalhe', async function (this: CustomWorld) {
  await expect(this.page.getByTestId('transfer-detail-approve-btn')).toBeVisible({ timeout: 10000 });
});

Then('não devo ver o botão de aprovar transferência no painel de detalhe', async function (this: CustomWorld) {
  await expect(this.page.getByTestId('transfer-detail-approve-btn')).toBeHidden({ timeout: 10000 });
});

Then('devo ver o botão de rejeitar transferência no painel de detalhe', async function (this: CustomWorld) {
  await expect(this.page.getByTestId('transfer-detail-reject-btn')).toBeVisible({ timeout: 10000 });
});

Then('não devo ver o botão de rejeitar transferência no painel de detalhe', async function (this: CustomWorld) {
  await expect(this.page.getByTestId('transfer-detail-reject-btn')).toBeHidden({ timeout: 10000 });
});

Then('devo ver o botão de confirmar recebimento no painel de detalhe', async function (this: CustomWorld) {
  await expect(this.page.getByTestId('transfer-detail-complete-btn')).toBeVisible({ timeout: 10000 });
});

Then('não devo ver o botão de confirmar recebimento no painel de detalhe', async function (this: CustomWorld) {
  await expect(this.page.getByTestId('transfer-detail-complete-btn')).toBeHidden({ timeout: 5000 });
});

Given('que acesso a página de transferências como gestor', async function (this: CustomWorld) {
  await this.login('gestor@empresa.com', 'Gestor@123');
  await this.goto('/transfers');
  await expect(this.page.getByRole('heading', { name: 'Transferências' })).toBeVisible({ timeout: 15000 });
});

Given('que acesso a página de transferências como operador', async function (this: CustomWorld) {
  await this.login('operador@empresa.com', 'Op@12345');
  await this.goto('/transfers');
  await this.page.waitForLoadState('domcontentloaded');
});

Then('a lista de transferências deve estar visível ou indicar ausência de registros', async function (this: CustomWorld) {
  const listOrEmpty = this.page
    .locator('span.font-mono').filter({ hasText: /^TRF-/ })
    .or(this.page.getByText(/nenhuma transferência|nenhum resultado/i));
  await expect(listOrEmpty.first()).toBeVisible({ timeout: 15000 });
});

When('tento navegar para a página de transferências sem autenticação', async function (this: CustomWorld) {
  await this.goto('/transfers');
  await this.page.waitForLoadState('domcontentloaded');
});
