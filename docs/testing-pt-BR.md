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

Execução simples:

```bash
k6 run k6/test.js
```

Execução com envio para InfluxDB:

```bash
k6 run --out influxdb=http://localhost:8086/k6 k6/test.js
```

O Grafana usa o dashboard `k6-performance.json`.

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
