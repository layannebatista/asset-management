import { Given } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../../support/world';
import { CREDENTIALS } from './helpers';

Given('que estou autenticado como administrador', async function (this: CustomWorld) {
  await this.login(CREDENTIALS.admin.email, CREDENTIALS.admin.password);
});

Given('que estou autenticado como gestor', async function (this: CustomWorld) {
  await this.login(CREDENTIALS.gestor.email, CREDENTIALS.gestor.password);
});

Given('que estou autenticado como operador', async function (this: CustomWorld) {
  await this.login(CREDENTIALS.operador.email, CREDENTIALS.operador.password);
});

Given('estou na página de ativos', async function (this: CustomWorld) {
  await this.goto('/assets');
  // Aguarda carregamento completo da página
  await this.page.waitForLoadState('networkidle', { timeout: 15000 });
  // Aguarda pela tabela (os filtros podem não estar visíveis em alguns modos)
  await this.waitForTableLoad();
  // Tenta aguardar pelos filtros, mas não falha se não estiverem presentes
  try {
    await expect(this.page.getByTestId('asset-status-filter-all')).toBeVisible({ timeout: 5000 });
  } catch (_e) {
    // Filtros podem não estar visíveis em modo insurance - está OK
  }
});
