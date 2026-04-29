# Guia Detalhado de Configuracao de Testes

Este documento descreve em detalhe como a estrategia de testes esta implementada hoje no projeto, incluindo:

- testes de backend (JUnit + Cucumber + Rest Assured)
- testes E2E de frontend (Playwright + Cucumber)
- consolidacao de resultados no Allure
- orquestracao local com Docker Compose
- orquestracao de CI com GitHub Actions

Conteudo revisado contra os arquivos reais de configuracao:

- `backend/pom.xml`
- `backend/src/test/resources/junit-platform.properties`
- `backend/src/test/resources/allure.properties`
- `backend/Dockerfile.test`
- `frontend/src/automation/playwright/package.json`
- `frontend/src/automation/playwright/cucumber.js`
- `frontend/src/automation/playwright/support/hooks.ts`
- `frontend/src/automation/playwright/support/world.ts`
- `frontend/src/automation/playwright/Dockerfile`
- `docker-compose.yml`
- `scripts/run-all-tests-docker.ps1`
- `.github/workflows/ci.yml`
- `.github/workflows/security.yml`

---

## 1. Visao Geral da Arquitetura de Testes

O projeto adota uma estrategia em camadas:

1. Backend
- unitarios e integracao com JUnit 5
- BDD com Cucumber
- validacao de API com Rest Assured

2. Frontend
- E2E com Playwright
- modelagem de cenarios em Gherkin com Cucumber

3. Consolidacao
- ambos escrevem no mesmo diretorio `allure-results/`
- o Allure Docker Service renderiza um painel unificado (separacao por labels)

4. Execucao
- local/QA: Docker Compose + script PowerShell
- CI: GitHub Actions

---

## 2. Backend: Como os Testes Estao Configurados

### 2.1 Stack de testes no Maven

No `backend/pom.xml`, os principais componentes de testes sao:

- JUnit 5 (`spring-boot-starter-test`, `junit-platform-suite`)
- Cucumber (`cucumber-java`, `cucumber-junit-platform-engine`, `cucumber-spring`)
- Rest Assured (`rest-assured`, `spring-mock-mvc`, `json-path`)
- Allure (`allure-junit5`, `allure-cucumber7-jvm`)
- qualidade complementar (`archunit-junit5`, PMD, Spotless, JaCoCo)

### 2.2 Integracao Cucumber + JUnit Platform + Allure

No `backend/src/test/resources/junit-platform.properties`:

- `cucumber.junit-platform.naming-strategy=long`
  - melhora leitura de cenarios nos relatórios
- `cucumber.plugin=pretty,html:target/cucumber-reports/cucumber.html,io.qameta.allure.cucumber7jvm.AllureCucumber7Jvm`
  - gera saida de console
  - gera HTML nativo do Cucumber
  - envia eventos para o Allure
- `cucumber.glue=com.portfolio.assetmanagement`
  - define onde estao steps e configuracoes Spring

### 2.3 Diretorio de resultados Allure do backend

No `backend/src/test/resources/allure.properties`:

- `allure.results.directory=../allure-results`

Isso faz o backend escrever resultados no diretorio raiz do repositorio (`allure-results/`) e nao dentro de `backend/target`, permitindo consolidacao com os resultados do frontend.

### 2.4 Execucao de testes backend em container dedicado

No `backend/Dockerfile.test`:

- imagem base Maven + Java 17
- copia `settings-docker.xml` para resolver downloads Maven em ambiente container
- pre-cache de dependencias (`dependency:resolve`)
- comando final:

```bash
mvn test -B --no-transfer-progress -Dallure.results.directory=/allure-results
```

Esse override garante que, dentro do container, os resultados caiam no volume compartilhado com Allure.

### 2.5 Perfil de integracao HTTP alinhado com producao

Nos testes de integracao da camada HTTP (`BaseIntegrationTest`), o projeto usa:

- PostgreSQL real via Testcontainers
- Flyway habilitado nas execucoes de integracao
- `ddl-auto=validate` para validar schema em vez de gerar schema automaticamente

Com isso, as suites de integracao ficam mais proximas do comportamento de producao e reduzem risco de falso positivo por diferenca entre H2 e PostgreSQL.

---

## 3. Frontend E2E: Como os Testes Estao Configurados

### 3.1 Stack de automacao

No `frontend/src/automation/playwright/package.json`:

- `@playwright/test` e `playwright`
- `@cucumber/cucumber`
- `allure-cucumberjs`
- scripts:
  - `npm test` -> `cucumber-js`
  - `npm run test:headed` -> modo visual
  - `npm run test:assets` -> execucao por tag

Importante: nesta suite, o runner principal e o Cucumber, usando Playwright por baixo nas step definitions/hook.

### 3.2 Configuracao do Cucumber e reporter Allure

No `frontend/src/automation/playwright/cucumber.js`:

- cenarios em `features/**/*.feature`
- carrega `world.ts`, `hooks.ts` e `step-definitions/**/*.ts`
- formato de saida:
  - `summary`
  - `html:reports/cucumber-report.html`
  - `json:reports/cucumber-report.json`
  - `allure-cucumberjs/reporter`
- `formatOptions.resultsDir` aponta para `ALLURE_RESULTS_DIR`

Quando `ALLURE_RESULTS_DIR` nao existe no ambiente, usa fallback para `../../../../allure-results`.

### 3.3 Hooks de execucao e estabilidade

No `frontend/src/automation/playwright/support/hooks.ts`:

- `BeforeAll`:
  - cria estrutura de reports/screenshots
  - executa limpeza de dados de teste via endpoint de suporte (best-effort)
  - realiza pre-autenticacao do usuario admin e salva `storageState`
- `Before`:
  - abre browser/context/page por cenario
  - reaproveita `auth-state.json` para reduzir flakiness
- `After`:
  - captura screenshot em falhas e anexa no report
- `AfterAll`:
  - executa cleanup final

### 3.4 World customizado

No `frontend/src/automation/playwright/support/world.ts`:

- encapsula utilitarios de navegacao/login
- executa login real via API para validar fluxo completo de autenticacao
- inclui rotinas para identificar e aposentar assets criados durante cenarios

### 3.5 Container dedicado para E2E

No `frontend/src/automation/playwright/Dockerfile`:

- instala dependencias Node
- instala dependencias de sistema do Chromium (`playwright install-deps`)
- define `ALLURE_RESULTS_DIR=/allure-results`
- comando de execucao: `npm test`

### 3.6 Padrao de seletores estaveis (`data-testid`)

Para reduzir flakiness, os fluxos E2E principais foram padronizados para usar `getByTestId` em vez de seletores baseados em texto/placeholder:

- autenticacao (login e MFA)
- listagem e operacoes de ativos (acoes por linha e modais)
- abertura e conclusao de manutencao
- fluxo de transferencias (criacao, filtros e painel de detalhe)

Diretrizes adotadas:

- sempre adicionar `data-testid` em botoes de acao e campos de formulario usados por steps
- evitar seletores fragieis como `button:has-text(...)`, placeholders e seletores de overlay por classe CSS
- quando houver componente compartilhado (ex.: `Modal`, `ModalFooter`, `TipButton`), expor props de `testId` para reutilizacao consistente

---

## 4. Allure: Como Backend e Frontend Compartilham o Mesmo Relatorio

### 4.1 Servicos Allure no Docker Compose

No `docker-compose.yml`:

- `allure` (API/engine): porta `5050`
- `allure-ui` (interface): porta `5252`
- volume principal de resultados:
  - host: `./allure-results`
  - container Allure: `/app/allure-results`

### 4.2 Separacao visual Backend x Frontend

A separacao no painel Allure ocorre por labels nos cenarios (`@allure.label.parentSuite:Backend` e `@allure.label.parentSuite:Frontend`).

Resultado: ambos aparecem no mesmo projeto Allure, mas organizados por suites.

### 4.3 Limpeza e historico

O servico one-shot `clean-allure-results` no `docker-compose.yml`:

- limpa arquivos antigos em `allure-results/`
- limpa reports antigos do Playwright
- chama endpoint para limpar historico do Allure

Isso evita mistura de execucoes anteriores com execucao atual.

---

## 5. Orquestracao Local de Testes (Fluxo Recomendado)

### 5.1 Script unico para backend + frontend + Allure

O script `scripts/run-all-tests-docker.ps1` executa o fluxo ponta a ponta:

1. sobe servicos base (`postgres`, `asset-management`, `frontend`, `allure`, `allure-ui`)
2. remove containers one-shot anteriores
3. roda `clean-allure-results`
4. roda `reset-e2e-data`
5. roda `test-backend`
6. roda `test-playwright`
7. aciona geracao de relatorio no Allure

Comando principal:

```powershell
./scripts/run-all-tests-docker.ps1 -Build
```

Opcional sem cache:

```powershell
./scripts/run-all-tests-docker.ps1 -Build -NoCache
```

### 5.2 Servicos de teste no Docker Compose

No `docker-compose.yml`:

- `test-backend`
  - usa `backend/Dockerfile.test`
  - monta `./allure-results:/allure-results`
- `test-playwright`
  - usa `frontend/src/automation/playwright/Dockerfile`
  - monta `./allure-results:/allure-results`
  - depende de `reset-e2e-data` e frontend healthy

Esse desenho permite executar suites desacopladas, mas com consolidacao unica no Allure.

---

## 6. CI Atual: Quem Orquestra Hoje

### 6.1 Orquestrador atual

O CI atual e orquestrado por GitHub Actions:

- `.github/workflows/ci.yml`
- `.github/workflows/security.yml`

### 6.2 Pipeline principal (`ci.yml`)

Jobs atuais:

- `backend`
  - `mvn clean verify`
  - upload de JaCoCo
  - upload de `allure-results`
  - publicacao no Codecov
- `backend-quality`
  - Spotless check
  - PMD check
- `frontend`
  - `npm ci`, lint e build
- `ai-intelligence`
  - `npm ci`, typecheck (`tsc --noEmit`) e build
- `playwright-e2e`
  - sobe stack de teste via Docker Compose
  - executa `test-playwright`
  - publica artefatos Allure e relatórios Playwright
- `docker`
  - build de imagens
  - scan com Trivy

### 6.3 Pipeline de seguranca (`security.yml`)

- workflow agendado/manual
- executa `dependency-check:check` (OWASP) no backend
- publica artefato HTML do scan

---

## 7. Comandos de Referencia

### 7.1 Backend

```bash
cd backend
mvn clean verify
```

```bash
mvn test
```

```bash
mvn spotless:check
mvn pmd:check
```

### 7.2 Frontend E2E

```bash
cd frontend/src/automation/playwright
npm ci
npm run test
```

```bash
npm run test:headed
```

```bash
npx cucumber-js --dry-run --format summary
```

### 7.3 Fluxo integrado (recomendado)

```powershell
./scripts/run-all-tests-docker.ps1 -Build
```

---

## 8. Troubleshooting Rapido

### 8.1 Allure nao mostra execucoes novas

Verifique:

- se `allure-results/` recebeu arquivos novos
- se `allure` esta healthy
- se `clean-allure-results` nao falhou antes das suites

### 8.2 Flakiness no E2E por dados de ambiente

Use sempre o fluxo com:

- `reset-e2e-data`
- cleanup best-effort no inicio/fim via hooks

### 8.3 Falha por dependencia de servico

No fluxo Docker, confirme healthchecks de:

- `asset-management`
- `frontend`
- `allure`

---

## 9. Resumo Executivo

Hoje a configuracao de testes do projeto funciona assim:

- Backend valida regras e API com JUnit + Cucumber + Rest Assured.
- Frontend valida fluxos reais de UI com Playwright + Cucumber.
- Ambos escrevem no mesmo `allure-results/`.
- Allure agrega em um unico painel visual.
- Orquestracao local esta no Docker Compose + `run-all-tests-docker.ps1`.
- Orquestracao de CI hoje e GitHub Actions.
