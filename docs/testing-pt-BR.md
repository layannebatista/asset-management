# Guia de Testes

Documento revisado contra `backend/pom.xml`, `frontend/src/automation/playwright`, `k6/test.js` e workflows em `.github/workflows`.

## Estratégia Geral

O projeto hoje combina:

- backend: JUnit 5, Mockito, Cucumber, JaCoCo, PMD e Spotless
- frontend E2E: Playwright + Cucumber
- carga: k6 + InfluxDB + Grafana
- relatórios: Allure via Docker

---

## Backend

### Executar

```bash
cd backend
mvn clean verify
```

### O que está presente

- testes unitários
- cenários BDD com Cucumber
- cobertura JaCoCo
- checks de arquitetura via ArchUnit
- PMD e Spotless como qualidade adicional

Há também suporte a testes com perfil `application-test.yml` e uso de H2/Testcontainers conforme a suíte executada.

### Comandos úteis

```bash
mvn test
```

```bash
mvn spotless:check
```

```bash
mvn spotless:apply
```

```bash
mvn pmd:check
```

```bash
mvn dependency-check:check
```

---

## Frontend E2E

Local dos testes:

`frontend/src/automation/playwright`

Arquivos principais:

- `features/asset-management.feature`
- `step-definitions/asset-management.steps.ts`
- `support/world.ts`
- `support/hooks.ts`

### Executar localmente

```bash
cd frontend/src/automation/playwright
npm install
npx playwright install chromium
npm run test
```

Modo com browser visível:

```bash
npm run test:headed
```

### Pré-requisito

O backend e o frontend precisam estar acessíveis para os testes. O `docker-compose` já possui um serviço dedicado `test-playwright`.

---

## Allure

No `docker-compose.yml`, o Allure lê resultados do diretório raiz:

- host: `./allure-results`
- container: `/app/allure-results`

Interfaces:

- `http://localhost:5050`
- `http://localhost:5252`

Serviços relacionados:

- `allure`
- `allure-ui`
- `clean-allure-results`
- `test-backend`
- `test-playwright`

---

## Testes de Carga — k6

Arquivo principal:

`k6/test.js`

### Via Docker Compose (Recomendado)

O serviço `k6` no `docker-compose.yml` executa automaticamente após toda a stack estar healthy:

```bash
docker compose up
# Aguarde todos os containers ficarem healthy (~2-3 minutos)
# O k6 executará automaticamente após asset-management e influxdb
```

Métricas em tempo real aparecem em:

- **Grafana**: http://localhost:3001 → Dashboard **k6 Load Testing**
- **InfluxDB**: http://localhost:8086 → banco de dados `k6`

### Localmente (sem Docker)

Instale k6 primeiro: https://k6.io/docs/getting-started/installation/

Execução simples (sem gravar métricas):

```bash
k6 run k6/test.js
```

Execução com envio para InfluxDB (Docker rodando):

```bash
# Se Docker estiver rodando e InfluxDB acessível em localhost:8086
k6 run --out influxdb=http://localhost:8086/k6 k6/test.js
```

Com variáveis de ambiente:

```bash
BASE_URL=http://localhost:8080 \
ADMIN_EMAIL=admin@empresa.com \
ADMIN_PASSWORD=Admin@123 \
  k6 run --out influxdb=http://localhost:8086/k6 k6/test.js
```

### Parar apenas o k6 (mantém os dados)

```bash
docker compose stop k6
```

### Limpar dados de k6

```bash
docker compose down -v  # Remove todos os volumes, incluindo InfluxDB
```

### Troubleshooting

**Os dados do k6 não aparecem no Grafana?**

1. Verifique se o k6 completou: `docker compose logs k6`
2. Verifique InfluxDB: `docker compose exec influxdb influx -execute "SELECT * FROM k6 LIMIT 1"`
3. Reinicie Grafana: `docker compose restart grafana`

**A conexão com a API falha durante o k6?**

- Verifique se `asset-management` está healthy: `docker compose logs asset-management`
- Use `BASE_URL=http://asset-management:8080` (nome do serviço) se rodar do host
- Se rodar k6 local: `BASE_URL=http://localhost:8080`

---

## CI/CD

Workflows encontrados:

- `.github/workflows/ci.yml`
- `.github/workflows/security.yml`

Jobs atuais no CI principal:

- `backend`
- `backend-quality`
- `frontend`
- `ai-intelligence`
- `docker`

Observações validadas:

- `ai-intelligence` executa `tsc --noEmit` e `npm run build`
- o workflow principal não roda `npm run lint` no diretório `ai-intelligence`
- o workflow `security.yml` executa OWASP Dependency Check no backend

---

## Observações

- o repositório contém evidências e relatórios gerados em `frontend/src/automation/playwright/reports/`
- há seed E2E em `V9__e2e_seed_data.sql`
- o `docker-compose` inclui `reset-e2e-data` para preparar massa antes dos E2E
