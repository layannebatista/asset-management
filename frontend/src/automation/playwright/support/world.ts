import { World, setWorldConstructor, IWorldOptions } from '@cucumber/cucumber';
import { Browser, BrowserContext, Page } from 'playwright';

export class CustomWorld extends World {
  browser!: Browser;
  context!: BrowserContext;
  page!: Page;

  // Usado para rastrear assets criados no cenário de criação e removê-los depois
  createdAssetModel?: string;
  createdAssetId?: number;
  createdTransferReason?: string;
  createdMaintenanceDescription?: string;

  constructor(options: IWorldOptions) {
    super(options);
  }

  get baseUrl(): string {
    const params = this.parameters as Record<string, unknown> | undefined;
    return (params?.baseUrl as string)
      || process.env.BASE_URL
      || 'http://localhost:5173';
  }

  get apiUrl(): string {
    return process.env.API_URL || 'http://localhost:8080';
  }

  async getAccessToken(): Promise<string | null> {
    return this.page.evaluate(() =>
      localStorage.getItem('accessToken') || null,
    ).catch(() => null);
  }

  async goto(urlPath: string): Promise<void> {
    await this.page.goto(`${this.baseUrl}${urlPath}`, {
      waitUntil: 'domcontentloaded',
      timeout: 15000,
    });
  }

  /**
   * Autentica o usuário. Se o contexto já tem um token válido para este email,
   * apenas navega ao dashboard (sem consumir o rate limit de login).
   * Caso contrário faz login via API diretamente.
   */
  async login(email: string, password: string): Promise<void> {
    const currentUrl = this.page.url();
    if (!currentUrl.startsWith(this.baseUrl)) {
      await this.page.goto(`${this.baseUrl}/login`, {
        waitUntil: 'domcontentloaded',
        timeout: 10000,
      });
    }

    const existingToken = await this.page.evaluate(() =>
      localStorage.getItem('accessToken'),
    ).catch(() => null);

    if (existingToken) {
      try {
        const parts = existingToken.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(
            Buffer.from(parts[1], 'base64').toString('utf-8'),
          );
          if (payload.sub === email) {
            await this.page.goto(`${this.baseUrl}/dashboard`, {
              waitUntil: 'domcontentloaded',
              timeout: 10000,
            });
            return;
          }
        }
      } catch {
        // Token malformado — faz login completo
      }
    }

    const response = await this.page.request.post(
      `${this.baseUrl}/api/auth/login`,
      {
        data: JSON.stringify({ email, password }),
        headers: { 'Content-Type': 'application/json' },
      },
    );

    if (!response.ok()) {
      const body = await response.text().catch(() => '');
      throw new Error(
        `Login falhou. Status: ${response.status()}. Resposta: ${body.substring(0, 300)}`,
      );
    }

    const data = await response.json() as { accessToken?: string; refreshToken?: string };
    if (!data.accessToken) {
      throw new Error(
        `Login falhou. Sem accessToken: ${JSON.stringify(data).substring(0, 200)}`,
      );
    }

    await this.page.evaluate(
      ({ access, refresh }: { access: string; refresh: string }) => {
        localStorage.setItem('accessToken', access);
        localStorage.setItem('refreshToken', refresh);
      },
      { access: data.accessToken, refresh: data.refreshToken ?? '' },
    );

    await this.page.goto(`${this.baseUrl}/dashboard`, {
      waitUntil: 'domcontentloaded',
      timeout: 10000,
    });

    if (!this.page.url().includes('/dashboard')) {
      const body = await this.page.textContent('body').catch(() => '');
      throw new Error(
        `Login falhou. URL: ${this.page.url()}. Resposta: ${body?.substring(0, 300)}`,
      );
    }
  }

  async waitForTableLoad(): Promise<void> {
    await this.page
      .locator('table')
      .or(this.page.locator('text=Nenhum ativo encontrado'))
      .first()
      .waitFor({ timeout: 15000 })
      .catch(() => {});
  }

  async ensureAvailableAsset(): Promise<boolean> {
    const rows = this.page.locator('tbody tr:not(:has(td[colspan]))');
    const count = await rows.count();
    if (count > 0) return false;

    const allBtn = this.page.locator('button:has-text("Todos")');
    if (await allBtn.isVisible()) {
      await allBtn.click();
      await this.page.waitForLoadState('load', { timeout: 5000 }).catch(() => {});
      await this.waitForTableLoad();
    }
    return true;
  }

  /**
   * Busca o ID do asset criado via API para evitar depender da paginação da tabela.
   */
  async captureCreatedAssetId(): Promise<void> {
    if (!this.createdAssetModel) return;

    const token = await this.getAccessToken();
    if (!token) return;

    const response = await this.page.request.get(`${this.apiUrl}/assets`, {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        page: 0,
        size: 20,
        search: this.createdAssetModel,
      },
    });

    if (!response.ok()) return;

    const data = await response.json() as {
      content?: Array<{ id: number; model: string }>;
    };

    const createdAsset = data.content?.find((asset) => asset.model === this.createdAssetModel);
    if (createdAsset) {
      this.createdAssetId = createdAsset.id;
    }
  }

  async retireCreatedAsset(): Promise<void> {
    if (!this.createdAssetId) return;

    const token = await this.getAccessToken();

    if (token) {
      await this.page.request.patch(
        `${this.apiUrl}/assets/${this.createdAssetId}/retire`,
        { headers: { Authorization: `Bearer ${token}` } },
      ).catch(() => {});
    }

    this.createdAssetId = undefined;
    this.createdAssetModel = undefined;
  }
}

setWorldConstructor(CustomWorld);
