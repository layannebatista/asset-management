import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../support/world';

Given('que acesso a página de login sem sessão ativa', async function (this: CustomWorld) {
  await this.goto('/login');
  await this.page.evaluate(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  });
  await this.page.reload({ waitUntil: 'domcontentloaded' });
  await expect(this.page.getByRole('button', { name: 'Entrar no sistema' })).toBeVisible();
});

Then('devo ver o formulário de login', async function (this: CustomWorld) {
  await expect(this.page.getByText('Bem-vindo de volta')).toBeVisible();
  await expect(this.page.locator('input[type="email"]')).toBeVisible();
  await expect(this.page.locator('input[type="password"]')).toBeVisible();
});

Then('devo ver os perfis de demonstração disponíveis', async function (this: CustomWorld) {
  for (const role of ['ADMIN', 'GESTOR', 'OPERADOR']) {
    await expect(this.page.getByRole('button', { name: new RegExp(role) })).toBeVisible();
  }
});

When('seleciono o perfil de demonstração {string}', async function (
  this: CustomWorld,
  perfil: string,
) {
  await this.page.getByRole('button', { name: new RegExp(perfil) }).click();
});

Then('o email deve ser preenchido com {string}', async function (
  this: CustomWorld,
  email: string,
) {
  await expect(this.page.locator('input[type="email"]')).toHaveValue(email);
});

When('preencho o login com email {string} e senha {string}', async function (
  this: CustomWorld,
  email: string,
  senha: string,
) {
  await this.page.locator('input[type="email"]').fill(email);
  await this.page.locator('input[type="password"]').fill(senha);
});

When('envio o formulário de login', async function (this: CustomWorld) {
  await this.page.getByRole('button', { name: 'Entrar no sistema' }).click();
});

Then('devo ver a mensagem de erro de login', async function (this: CustomWorld) {
  await expect(this.page.getByText(/inválid|inválid|credenciais|senha/i)).toBeVisible({
    timeout: 15000,
  });
});

Then('devo ser redirecionado para o dashboard', async function (this: CustomWorld) {
  await expect(this.page).toHaveURL(/\/dashboard/, { timeout: 15000 });
  await expect(this.page.getByText(/dashboard|carregando dashboard/i)).toBeVisible({
    timeout: 15000,
  });
});
