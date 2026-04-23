import 'dotenv/config';

function required(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

function optional(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

function parseProviderOrder(raw: string): Array<'localfree' | 'openai' | 'anthropic' | 'githubmodels'> {
  const normalized = raw
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  const allowed = new Set(['localfree', 'openai', 'anthropic', 'githubmodels']);
  const unique: Array<'localfree' | 'openai' | 'anthropic' | 'githubmodels'> = [];

  for (const provider of normalized) {
    if (allowed.has(provider) && !unique.includes(provider as 'localfree' | 'openai' | 'anthropic' | 'githubmodels')) {
      unique.push(provider as 'localfree' | 'openai' | 'anthropic' | 'githubmodels');
    }
  }

  return unique.length > 0 ? unique : ['localfree', 'openai', 'anthropic', 'githubmodels'];
}

function resolveProviderOrder(): Array<'localfree' | 'openai' | 'anthropic' | 'githubmodels'> {
  const localOnlyMode = optional('LOCAL_ONLY_MODE', 'true') === 'true';
  if (localOnlyMode) {
    return ['localfree'];
  }

  return parseProviderOrder(optional('LLM_PROVIDER_ORDER', 'localfree,anthropic,githubmodels,openai'));
}

export const config = {
  service: {
    port: parseInt(optional('AI_SERVICE_PORT', '3100'), 10),
    apiKey: required('AI_SERVICE_API_KEY'),
    nodeEnv: optional('NODE_ENV', 'development'),
  },

  openai: {
    apiKey: optional('OPENAI_API_KEY', ''),
    model: optional('OPENAI_MODEL', 'gpt-4o'),
    fallbackModel: optional('OPENAI_FALLBACK_MODEL', 'gpt-4o-mini'),
    maxTokens: parseInt(optional('OPENAI_MAX_TOKENS', '2048'), 10),
    temperature: parseFloat(optional('OPENAI_TEMPERATURE', '0.2')),
  },

  anthropic: {
    apiKey: optional('ANTHROPIC_API_KEY', ''),
    baseUrl: optional('ANTHROPIC_BASE_URL', 'https://api.anthropic.com/v1/messages'),
    model: optional('ANTHROPIC_MODEL', 'claude-3-5-sonnet-latest'),
    fallbackModel: optional('ANTHROPIC_FALLBACK_MODEL', 'claude-3-5-haiku-latest'),
    maxTokens: parseInt(optional('ANTHROPIC_MAX_TOKENS', '2048'), 10),
    temperature: parseFloat(optional('ANTHROPIC_TEMPERATURE', '0.2')),
  },

  githubModels: {
    apiKey: optional('GITHUB_MODELS_TOKEN', optional('GITHUB_TOKEN', '')),
    baseUrl: optional('GITHUB_MODELS_BASE_URL', 'https://models.inference.ai.azure.com'),
    model: optional('GITHUB_MODELS_MODEL', 'gpt-4o-mini'),
    fallbackModel: optional('GITHUB_MODELS_FALLBACK_MODEL', 'gpt-4o-mini'),
    maxTokens: parseInt(optional('GITHUB_MODELS_MAX_TOKENS', '2048'), 10),
    temperature: parseFloat(optional('GITHUB_MODELS_TEMPERATURE', '0.2')),
  },

  llm: {
    localOnlyMode: optional('LOCAL_ONLY_MODE', 'true') === 'true',
    providerOrder: resolveProviderOrder(),
    localFreeEnabled: optional('LOCAL_LLM_ENABLED', 'true') === 'true',
    localFreeModel: optional('LOCAL_LLM_MODEL', 'local-rule-based-v1'),
  },

  db: {
    host: optional('AI_DB_HOST', 'localhost'),
    port: parseInt(optional('AI_DB_PORT', '5433'), 10),
    database: optional('AI_DB_NAME', 'asset_management'),
    user: optional('AI_DB_USER', 'asset_user'),
    password: optional('AI_DB_PASSWORD', 'asset123'),
  },

  services: {
    prometheusUrl: optional('PROMETHEUS_URL', 'http://localhost:9090'),
    allureUrl: optional('ALLURE_URL', 'http://localhost:5050'),
    backendUrl: optional('BACKEND_URL', 'http://localhost:8080'),
    grafanaUrl: optional('GRAFANA_URL', 'http://localhost:3001'),
  },

  github: {
    token: optional('GITHUB_TOKEN', ''),
    owner: optional('GITHUB_OWNER', ''),
    repo: optional('GITHUB_REPO', ''),
  },

  cache: {
    ttlSeconds: parseInt(optional('ANALYSIS_CACHE_TTL_SECONDS', '300'), 10),
  },

  rateLimit: {
    windowMs: parseInt(optional('RATE_LIMIT_WINDOW_MS', '60000'), 10),
    maxRequests: parseInt(optional('RATE_LIMIT_MAX_REQUESTS', '30'), 10),
  },
} as const;
