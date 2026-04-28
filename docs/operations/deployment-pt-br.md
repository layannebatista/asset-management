# Deploy

Documento revisado contra `docker-compose.yml`, `backend/src/main/resources/application*.yml` e a estrutura atual dos serviços.

# 1. Visão Geral

O projeto hoje possui uma stack completa com:

- PostgreSQL
- backend Spring Boot
- frontend React servido por Nginx
- AI Intelligence
- Prometheus
- Grafana
- InfluxDB
- Allure + Allure UI
- cAdvisor

---

# 2. Execução Recomendada em Desenvolvimento

```bash
cp .env.example .env
docker compose up --build
```

Portas principais:

| Serviço | Porta |
|---|---|
| Frontend | `5173` |
| Backend | `8080` |
| PostgreSQL | `5433` |
| AI Intelligence | `3100` |
| Prometheus | `9090` |
| Grafana | `3001` |
| InfluxDB | `8086` |
| Allure | `5050` |
| Allure UI | `5252` |
| cAdvisor | `8081` |

---

# 3. Variáveis de Ambiente

## Backend

- `DB_URL`
- `DB_USERNAME`
- `DB_PASSWORD`
- `JWT_SECRET`
- `JWT_EXPIRATION`
- `JWT_REFRESH_EXPIRATION`
- `MAIL_HOST`
- `MAIL_PORT`
- `MAIL_USERNAME`
- `MAIL_PASSWORD`
- `MAIL_FROM`
- `MAIL_FROM_NAME`
- `CORS_ALLOWED_ORIGINS`
- `FRONTEND_URL`
- `AI_SERVICE_URL`
- `AI_SERVICE_API_KEY`
- `MFA_EXPIRATION_SECONDS`

## AI Intelligence

- `AI_SERVICE_PORT`
- `AI_SERVICE_API_KEY`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `OPENAI_FALLBACK_MODEL`
- `OPENAI_MAX_TOKENS`
- `AI_DB_HOST`
- `AI_DB_PORT`
- `AI_DB_NAME`
- `AI_DB_USER`
- `AI_DB_PASSWORD`
- `PROMETHEUS_URL`
- `ALLURE_URL`
- `BACKEND_URL`
- `GRAFANA_URL`
- `GITHUB_TOKEN`
- `GITHUB_OWNER`
- `GITHUB_REPO`

## Observabilidade

- `GRAFANA_USER`
- `GRAFANA_PASSWORD`

---

# 4. Banco de Dados

O backend usa PostgreSQL com Flyway automático no startup.

No `docker-compose`, o serviço `asset-management` sobrescreve `DB_URL` para apontar para o hostname interno `postgres:5432`.

O banco também é usado pelo serviço `ai-intelligence`, que persiste análises em schema próprio.

---

# 5. Healthchecks

Healthchecks configurados:

- backend: `GET /actuator/health`
- Prometheus: `GET /-/healthy`
- Grafana: `GET /api/health`
- Allure: endpoint do serviço Allure
- AI Intelligence: `GET /health`
- PostgreSQL: `pg_isready`
- InfluxDB: `SHOW DATABASES`

Isso controla a ordem de inicialização da stack.

---

# 6. Frontend em Docker

O frontend Dockerizado usa build estático e Nginx.

Configuração importante:

- `VITE_API_URL=/api`
- o proxy reverso do Nginx encaminha `/api` para o backend

Para desenvolvimento local fora do Docker, o frontend pode usar `npm run dev` e `VITE_API_URL` direto.

---

# 7. Produção

Topologia recomendada:

1. HTTPS no reverse proxy ou load balancer
2. frontend estático atrás de proxy
3. backend Spring Boot em rede privada
4. PostgreSQL sem exposição pública
5. AI Intelligence acessível apenas internamente

Recomendações:

- restringir CORS a domínios válidos
- usar segredos fortes para JWT e integração AI
- externalizar volumes persistentes
- centralizar logs e métricas

---

# 8. Testes e Serviços Auxiliares

O `docker-compose` também inclui serviços de apoio:

- `reset-e2e-data`
- `clean-allure-results`
- `test-backend`
- `test-playwright`

Eles não fazem parte do runtime de produção, mas são parte oficial do ambiente local e do fluxo de testes.

---

# 9. Resumo

O deploy atual já não é apenas backend + banco. A stack real inclui frontend servido por Nginx, observabilidade, relatórios de testes e um sidecar de IA, todos orquestrados pelo `docker-compose.yml`.
