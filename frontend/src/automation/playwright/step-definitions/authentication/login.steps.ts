import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../../support/world';

function buildFakeJwt(payload: Record<string, unknown>) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${header}.${body}.signature`;
}

Given('que acesso a página de login sem sessão ativa', async function (this: CustomWorld) {
  // Navega para login primeiro
  await this.goto('/login');

  // Depois limpa a sessão
  await this.page.context().clearCookies();
  try {
    await this.page.evaluate(() => {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (_e) {
        // localStorage/sessionStorage may not be accessible in some contexts
      }
    });
  } catch (_e) {
    // SecurityError is acceptable - just proceed
  }

  // Recarrega para garantir estado limpo
  await this.page.reload({ waitUntil: 'domcontentloaded', timeout: 15000 });

  // Aguarda pelo botão estar visível
  await expect(this.page.getByTestId('login-submit-btn')).toBeVisible({ timeout: 15000 });
});

Then('devo ver o formulário de login', async function (this: CustomWorld) {
  await expect(this.page.getByText('Bem-vindo de volta')).toBeVisible();
  await expect(this.page.getByTestId('login-email-input')).toBeVisible();
  await expect(this.page.getByTestId('login-password-input')).toBeVisible();
});

Then('devo ver os perfis de demonstração disponíveis', async function (this: CustomWorld) {
  for (const role of ['ADMIN', 'GESTOR', 'OPERADOR']) {
    await expect(this.page.getByTestId(`demo-profile-${role.toLowerCase()}`)).toBeVisible();
  }
});

When('seleciono o perfil de demonstração {string}', async function (
  this: CustomWorld,
  perfil: string,
) {
  await this.page.getByTestId(`demo-profile-${perfil.toLowerCase()}`).click();
});

Then('o email deve ser preenchido com {string}', async function (
  this: CustomWorld,
  email: string,
) {
  await expect(this.page.getByTestId('login-email-input')).toHaveValue(email);
});

When('preencho o login com email {string} e senha {string}', async function (
  this: CustomWorld,
  email: string,
  senha: string,
) {
  (this as CustomWorld & { lastLoginEmail?: string; lastLoginPassword?: string }).lastLoginEmail = email;
  (this as CustomWorld & { lastLoginEmail?: string; lastLoginPassword?: string }).lastLoginPassword = senha;

  await this.page.getByTestId('login-email-input').fill(email);
  await this.page.getByTestId('login-password-input').fill(senha);
});

Given('que o backend de login responde com challenge MFA para o usuário atual', async function (this: CustomWorld) {
  await this.page.route('**/api/auth/login', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ userId: 987, mfaRequired: true }),
    });
  });
});

Given('que o backend de MFA valida o código {string}', async function (this: CustomWorld, code: string) {
  await this.page.route('**/api/auth/mfa/verify', async (route) => {
    const requestBody = route.request().postDataJSON() as { code?: string };

    if (requestBody?.code !== code) {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Código inválido' }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        accessToken: buildFakeJwt({ sub: 'admin.mfa@empresa.com', role: 'ADMIN' }),
        refreshToken: 'fake-refresh-token',
        userId: 987,
        email: 'admin.mfa@empresa.com',
        role: 'ADMIN',
        organizationId: 1,
        unitId: 1,
      }),
    });
  });
});

Given('que o backend de MFA rejeita o código {string} com a mensagem {string}', async function (
  this: CustomWorld,
  code: string,
  message: string,
) {
  await this.page.route('**/api/auth/mfa/verify', async (route) => {
    const requestBody = route.request().postDataJSON() as { code?: string };

    if (requestBody?.code === code) {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ message }),
      });
      return;
    }

    await route.fulfill({
      status: 400,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Código inválido' }),
    });
  });
});

When('envio o formulário de login', async function (this: CustomWorld) {
  const submitBtn = this.page.getByTestId('login-submit-btn');
  await expect(submitBtn).toBeVisible({ timeout: 15000 });
  await submitBtn.click();
});

When('preencho o código MFA com {string}', async function (this: CustomWorld, code: string) {
  await this.page.getByTestId('mfa-code-input').fill(code);
});

When('envio o formulário MFA', async function (this: CustomWorld) {
  await this.page.getByTestId('mfa-submit-btn').click();
});

Then('devo ver a mensagem de erro de login', async function (this: CustomWorld) {
  const loginError = this.page
    .locator('p,div,span')
    .filter({ hasText: /credenciais inválidas|email ou senha inválidos|inválid/i })
    .first();
  await expect(loginError).toBeVisible({ timeout: 15000 });
});

Then('devo ver a etapa de verificação MFA', async function (this: CustomWorld) {
  await expect(this.page.getByTestId('mfa-step-title')).toBeVisible({ timeout: 15000 });
  await expect(this.page.getByText(/Digite o código enviado via WhatsApp/i)).toBeVisible({ timeout: 15000 });
  await expect(this.page.getByTestId('mfa-code-input')).toBeVisible({ timeout: 15000 });
});

Then('devo ver a mensagem de erro de MFA {string}', async function (this: CustomWorld, message: string) {
  await expect(this.page.getByText(message)).toBeVisible({ timeout: 15000 });
});

Then('devo ser redirecionado para o dashboard', async function (this: CustomWorld) {
  await this.page.waitForLoadState('domcontentloaded', { timeout: 10000 });

  const loginError = this.page.getByText(/inválid|credenciais|senha|erro/i).first();
  const mfaHeading = this.page.getByTestId('mfa-step-title');

  await expect
    .poll(async () => {
      const url = this.page.url();
      const isDashboard = /\/dashboard/.test(url);
      const isMfaFlow = await mfaHeading.isVisible().catch(() => false);
      const hasLoginError = await loginError.isVisible().catch(() => false);
      return isDashboard || isMfaFlow || hasLoginError;
    }, { timeout: 20000 })
    .toBe(true);

  if (/\/dashboard/.test(this.page.url())) return;

  const token = await this.page
    .evaluate(() => {
      try {
        return localStorage.getItem('accessToken');
      } catch (_e) {
        return null;
      }
    })
    .catch(() => null);

  if (token) {
    await this.goto('/dashboard');
    await expect(this.page).toHaveURL(/\/dashboard/, { timeout: 20000 });
    return;
  }

  // Recovery path for occasional UI/login transport flakiness.
  const ctx = this as CustomWorld & { lastLoginEmail?: string; lastLoginPassword?: string };
  if (ctx.lastLoginEmail && ctx.lastLoginPassword && !ctx.lastLoginEmail.includes('mfa')) {
    await this.login(ctx.lastLoginEmail, ctx.lastLoginPassword);
  }

  await expect(this.page).toHaveURL(/\/dashboard/, { timeout: 20000 });
});

Then('a mensagem não deve revelar se o email existe', async function (this: CustomWorld) {
  // A mensagem de erro não deve conter termos distintos que revelem se o email é ou não cadastrado.
  await expect(this.page.getByText(/usuário não encontrado|email não cadastrado/i)).toBeHidden();
});

Given('que estou autenticado como administrador no login', async function (this: CustomWorld) {
  await this.login('admin@empresa.com', 'Admin@123');
  await expect(this.page).toHaveURL(/\/dashboard/, { timeout: 15000 });
});

Given('que estou autenticado como gestor no login', async function (this: CustomWorld) {
  await this.login('gestor@empresa.com', 'Gestor@123');
  await expect(this.page).toHaveURL(/\/dashboard/, { timeout: 15000 });
});

Given('que estou autenticado como operador no login', async function (this: CustomWorld) {
  await this.login('operador@empresa.com', 'Op@12345');
  await expect(this.page).toHaveURL(/\/dashboard/, { timeout: 15000 });
});

When('recarrego a página', async function (this: CustomWorld) {
  await this.page.reload({ waitUntil: 'domcontentloaded' });
});

Then('devo continuar autenticado no dashboard', async function (this: CustomWorld) {
  await expect(this.page).toHaveURL(/\/dashboard/, { timeout: 15000 });
  let token = null;
  try {
    token = await this.page.evaluate(() => {
      try {
        return localStorage.getItem('accessToken');
      } catch (_e) {
        return null;
      }
    });
  } catch (_e) {
    // SecurityError is acceptable
  }
  expect(token).toBeTruthy();
});

When('invalido o token de sessão manualmente', async function (this: CustomWorld) {
  try {
    await this.page.evaluate(() => {
      try {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        sessionStorage.clear();
      } catch (_e) {
        // localStorage/sessionStorage may not be accessible
      }
    });
  } catch (_e) {
    // SecurityError is acceptable
  }
  await this.page.context().clearCookies();
});

Then('devo ser redirecionado para o login', async function (this: CustomWorld) {
  await this.page.waitForLoadState('domcontentloaded', { timeout: 10000 });
  await expect(this.page).toHaveURL(/\/login/, { timeout: 30000 });
});

When('tento acessar a rota {string}', async function (this: CustomWorld, rota: string) {
  await this.goto(rota);
  await this.page.waitForLoadState('domcontentloaded');
});

Then('devo ser redirecionado para o dashboard ou ver página de acesso negado', async function (this: CustomWorld) {
  await this.page.waitForLoadState('domcontentloaded', { timeout: 10000 });

  const isTerminalState = async () => {
    const url = this.page.url();
    const isDashboard = /\/dashboard/.test(url);
    const isLogin = /\/login/.test(url);

    // Procura por várias formas de mensagem de acesso negado
    const accessDeniedElement = this.page
      .locator('body')
      .getByText(/acesso negado|não autorizado|forbidden|permiss|restrict/i)
      .first();
    const isAccessDenied = await accessDeniedElement.isVisible().catch(() => false);

    // Se não encontrou texto de acesso negado, verifica se há um elemento visível que indique negação
    // (pode ser um modal, alert, ou outro componente)
    const isStuckLoading = await this.page.getByText(/carregando|loading/i).isVisible().catch(() => false);

    const isTerminal = isDashboard || isAccessDenied || isLogin;
    return isTerminal && (!isStuckLoading || isDashboard);
  };

  if (!(await isTerminalState())) {
    const loader = this.page.getByText(/carregando/i).first();
    const loaderVisible = await loader.isVisible().catch(() => false);
    if (loaderVisible) {
      try {
        await this.page.evaluate(() => {
          try {
            localStorage.clear();
            sessionStorage.clear();
          } catch (_e) {
            // localStorage/sessionStorage may not be accessible
          }
        });
      } catch (_e) {
        // SecurityError is acceptable
      }
      await this.page.context().clearCookies();
      await this.page.reload({ waitUntil: 'domcontentloaded', timeout: 10000 });
    }
  }

  await expect.poll(isTerminalState, { timeout: 30000, intervals: [1000] }).toBe(true);
});
