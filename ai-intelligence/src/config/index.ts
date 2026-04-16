import 'dotenv/config';

function required(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

function optional(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

export const config = {
  service: {
    port: parseInt(optional('AI_SERVICE_PORT', '3100'), 10),
    apiKey: required('AI_SERVICE_API_KEY'),
    nodeEnv: optional('NODE_ENV', 'development'),
  },

  openai: {
    apiKey: required('OPENAI_API_KEY'),
    model: optional('OPENAI_MODEL', 'gpt-4o'),
    fallbackModel: optional('OPENAI_FALLBACK_MODEL', 'gpt-4o-mini'),
    maxTokens: parseInt(optional('OPENAI_MAX_TOKENS', '2048'), 10),
    temperature: parseFloat(optional('OPENAI_TEMPERATURE', '0.2')),
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
