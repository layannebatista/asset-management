import { setWorldConstructor, World, IWorldOptions } from '@cucumber/cucumber';
import { Browser, BrowserContext, Page, chromium } from 'playwright';

export interface AssetWorld extends World {
  browser: Browser;
  context: BrowserContext;
  page: Page;
  baseUrl: string;
  headless: boolean;
}

export class CustomWorld extends World implements AssetWorld {
  browser!: Browser;
  context!: BrowserContext;
  page!: Page;
  baseUrl: string;
  headless: boolean;

  constructor(options: IWorldOptions) {
    super(options);
    const params = options.parameters as { baseUrl?: string; headless?: boolean };
    this.baseUrl = params.baseUrl ?? 'http://localhost:5173';
    this.headless = params.headless ?? true;
  }

  async init(): Promise<void> {
    this.browser = await chromium.launch({ headless: this.headless });
    this.context = await this.browser.newContext({
      viewport: { width: 1280, height: 720 },
      locale: 'pt-BR',
    });
    this.page = await this.context.newPage();
  }

  async destroy(): Promise<void> {
    await this.context?.close();
    await this.browser?.close();
  }

  /** Navega para uma rota relativa à baseUrl */
  async goto(path: string): Promise<void> {
    await this.page.goto(`${this.baseUrl}${path}`);
  }

  /** Realiza login com as credenciais informadas */
  async login(email: string, password: string): Promise<void> {
    await this.goto('/login');
    await this.page.fill('input[type="email"]', email);
    await this.page.fill('input[type="password"]', password);
    await this.page.click('button:has-text("Entrar no sistema")');
    await this.page.waitForURL((url: URL) => !url.pathname.includes('/login'));
  }

  /** Aguarda a tabela de ativos carregar */
  async waitForTableLoad(): Promise<void> {
    await this.page.waitForSelector('text=Carregando...', { state: 'hidden', timeout: 15000 });
    await this.page.waitForSelector('table', { state: 'visible' });
  }
}

setWorldConstructor(CustomWorld);
