# Asset Management — Plataforma Enterprise de Gestão de Ativos

![Java](https://img.shields.io/badge/Java-17-blue)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.2.5-green)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791)
![React](https://img.shields.io/badge/React-19-61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-4.x-38BDF8)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED)
![CI](https://github.com/layannebatista/asset-management/actions/workflows/ci.yml/badge.svg)
![Status](https://img.shields.io/badge/Status-Em_Desenvolvimento-yellow)

Plataforma enterprise para gestão completa do ciclo de vida de ativos corporativos. Uma organização central com múltiplas filiais/unidades, controle de acesso por perfil, rastreabilidade financeira e auditoria completa.

Backend Java 17 + Spring Boot 3. Frontend React 19 + TypeScript + Tailwind CSS. Observabilidade com Prometheus + Grafana. Relatórios de teste com Allure. Testes de carga com k6. Pipeline CI/CD com GitHub Actions.

---

## Sumário

- [Início Rápido](#-início-rápido)
- [Serviços e Acessos](#-serviços-e-acessos)
- [Arquitetura](#-arquitetura)
- [Funcionalidades](#-funcionalidades)
- [Stack](#-stack)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Ambiente Docker](#-ambiente-docker)
- [Credenciais de Demonstração](#-credenciais-de-demonstração)
- [Controle de Acesso por Perfil](#-controle-de-acesso-por-perfil)
- [Autenticação](#-autenticação)
- [Perfis de Configuração](#-perfis-de-configuração)
- [Testes e Qualidade](#-testes-e-qualidade)
- [Automação de Testes Frontend](#-automação-de-testes-frontend)
- [Testes de Carga — k6](#-testes-de-carga--k6)
- [Observabilidade — Prometheus + Grafana](#-observabilidade--prometheus--grafana)
- [Relatórios de Teste — Allure](#-relatórios-de-teste--allure)
- [Pipeline CI/CD](#-pipeline-cicd)
- [Documentação da API](#-documentação-da-api)
- [Objetivo do Projeto](#-objetivo-do-projeto)

---

## 🚀 Início Rápido

### 1. Clone e configure as variáveis de ambiente

```bash
git clone <url-do-repositorio>
cd asset-management
cp .env.example .env
```

Edite o `.env` com suas credenciais reais (SMTP, JWT secret). Os valores padrão já funcionam para subir o Docker localmente sem configuração adicional.

### 2. Suba toda a stack

```bash
docker compose up --build
```

> Não é necessário ter Java, Node.js ou PostgreSQL instalados localmente. Tudo roda dentro dos containers.

### 3. Aguarde a inicialização

A sequência de dependências é respeitada automaticamente:

```
postgres (healthy) → backend (healthy) → frontend + prometheus
prometheus → grafana
allure-results/ → allure → allure-ui
```

Para parar:

```bash
docker compose down          # mantém volumes (dados persistem)
docker compose down -v       # remove volumes (reset completo)
```

---

## 🌐 Serviços e Acessos

Após `docker compose up --build`, todos os serviços ficam disponíveis:

| Serviço | URL | Credenciais | Descrição |
|---|---|---|---|
| **Frontend** | http://localhost:5173 | ver tabela abaixo | Interface React |
| **API REST** | http://localhost:8080 | — | Backend Spring Boot |
| **Swagger UI** | http://localhost:8080/swagger-ui.html | Bearer token | Documentação interativa |
| **Health Check** | http://localhost:8080/actuator/health | público | Status da aplicação |
| **Métricas (Prometheus)** | http://localhost:8080/actuator/prometheus | público | Métricas expostas para coleta |
| **Prometheus** | http://localhost:9090 | — | Coleta e consulta de métricas da API |
| **Grafana** | http://localhost:3001 | admin / admin123 | Dashboards de observabilidade e performance |
| **InfluxDB** | http://localhost:8086 | sem autenticação | Banco de métricas de carga do k6 |
| **Allure UI** | http://localhost:5252 | — | Interface de relatórios — navegue entre execuções e histórico |
| **Allure Relatório** | http://localhost:5050/allure-docker-service/projects/default/reports/latest/index.html | — | Último relatório gerado (abre direto) |
| **Allure API** | http://localhost:5050/allure-docker-service/ | — | REST API do Allure (integração CI) |

> As credenciais do Grafana são configuráveis via `GRAFANA_USER` e `GRAFANA_PASSWORD` no `.env`.

---

## 🏛 Arquitetura

O sistema é organizado em uma **organização central com múltiplas filiais (unidades)**. Cada usuário pertence a uma unidade e seu escopo de acesso é determinado pelo seu perfil.

O backend segue arquitetura em camadas inspirada em Clean Architecture e DDD:

```
interfaces/rest      → Controllers REST (entrada HTTP)
application          → Services, DTOs, Mappers (casos de uso)
domain               → Entidades, Enums, regras de negócio
infrastructure       → Repositórios JPA (persistência)
shared               → Exceptions, paginação, validações, utilitários
security             → JWT, filtros, contexto do usuário autenticado
config               → Beans Spring, DataSeeder, configurações
```

O isolamento de escopo é aplicado em todos os serviços via `LoggedUserContext`, que resolve o usuário autenticado a partir do JWT e determina o perímetro de acesso (organização → unidade → usuário).

---

## ✅ Funcionalidades

### Gestão de Ativos
- Cadastro com geração automática de `assetTag`
- Tipos suportados: `NOTEBOOK`, `DESKTOP`, `MOBILE_PHONE`, `TABLET`, `VEHICLE`, `OTHER`
- Ciclo de vida: `AVAILABLE` → `ASSIGNED` → `IN_TRANSFER` → `IN_MAINTENANCE` → `UNAVAILABLE` → `RETIRED`
- Atribuição de ativo a usuário com histórico completo de atribuições e status
- Dados fiscais: nota fiscal, data de compra, fornecedor, garantia

### Depreciação Financeira
- Três métodos: `LINEAR`, `DECLINING_BALANCE`, `SUM_OF_YEARS`
- Relatório por ativo e portfólio consolidado

### Transferências entre Unidades
- Fluxo com aprovação e Optimistic Locking (`@Version`)
- Status: `PENDING` → `APPROVED` → `COMPLETED` / `REJECTED` / `CANCELLED`

### Manutenção
- Abertura, início e conclusão com rastreabilidade de responsável
- Custo estimado vs real, SLA e centro de custo

### Inventário
- Sessões de inventário por unidade com lock de concorrência
- `OPEN` → `IN_PROGRESS` → `CLOSED`

### Seguros
- Registro de apólice por ativo com alertas de vencimento no dashboard

### Usuários e Acesso
- Fluxo de ativação por e-mail, MFA via WhatsApp (OTP 6 dígitos, 5 min), refresh token com rotação

### Dashboard por Perfil
- **ADMIN**: visão consolidada — ativos por unidade/status/tipo, manutenções, transferências, custos, seguros
- **GESTOR**: visão da unidade — utilização, ativos ociosos, transferências pendentes, custo do mês
- **OPERADOR**: visão pessoal — ativos atribuídos, manutenções abertas

### Auditoria
- Registro de todos os eventos com ator, alvo, organização e timestamp

---

## 🛠 Stack

### Backend
| Tecnologia | Versão | Uso |
|---|---|---|
| Java | 17 | Linguagem principal |
| Spring Boot | 3.2.5 | Framework base |
| Spring Security | — | Autenticação e autorização |
| JJWT | 0.11.5 | Geração e validação de JWT |
| Spring Data JPA + HikariCP | — | Persistência com pool configurado |
| Flyway | — | Migrações de banco (V1 a V7) |
| Lombok | — | Redução de boilerplate |
| SpringDoc OpenAPI | 2.5.0 | Swagger UI |
| Spring Mail | — | Ativação de conta por e-mail |
| Micrometer Prometheus | — | Exposição de métricas |

### Banco de Dados
| Tecnologia | Versão | Uso |
|---|---|---|
| PostgreSQL | 16 | Banco principal |
| H2 | — | Banco em memória (testes unitários) |

### Frontend
| Tecnologia | Versão | Uso |
|---|---|---|
| React | 19 | Framework UI |
| TypeScript | 5.9 | Tipagem estática |
| Tailwind CSS | 4.x | Estilização |
| Vite | 8.x | Build e dev server |
| React Router | 7.x | Roteamento SPA |
| Axios | 1.x | Requisições HTTP |

### Infraestrutura e Observabilidade
| Tecnologia | Porta | Uso |
|---|---|---|
| Docker Compose | — | Orquestração de toda a stack (9 containers) |
| PostgreSQL | 5433 | Banco de dados principal |
| Prometheus | 9090 | Coleta de métricas da API (intervalo 15s, retenção 15 dias) |
| Grafana | 3001 | Dashboards auto-provisionados: Backend (Spring Boot) + k6 Performance |
| InfluxDB | 8086 | Banco de séries temporais para métricas de carga do k6 |
| Allure Service | 5050 | Geração e servimento de relatórios de teste (backend + frontend) |
| Allure UI | 5252 | Interface web para navegar entre execuções e histórico |
| k6 | — | Testes de carga e performance (3 cenários: smoke, load, spike) |

### Qualidade e Testes
| Tecnologia | Uso |
|---|---|
| JUnit 5 | Testes unitários |
| Rest Assured | Automação de testes de API |
| Cucumber 7 + BDD | Testes em linguagem natural (Gherkin) |
| Testcontainers | Testes de integração com PostgreSQL real |
| ArchUnit | Validação de dependências entre camadas |
| JaCoCo | Cobertura de código (gate: 50% mínimo) |
| Allure | Relatórios ricos de teste com histórico e tendências |
| PIT (Pitest) | Mutation testing |
| Spotless | Formatação automática (Google Java Format) |
| PMD | Análise estática de código |
| OWASP Dependency Check | Varredura de vulnerabilidades em dependências |
| Cypress + Cucumber | Testes E2E frontend (BDD) |
| Playwright + Cucumber | Testes E2E frontend (BDD) |

--- 

## 📂 Estrutura do Projeto

```
asset-management/
├── .env.example                         # Template de variáveis de ambiente
├── .env                                 # Variáveis locais (não commitado)
├── docker-compose.yml                   # Stack completa: 9 serviços
├── .github/
│   ├── dependabot.yml                   # Atualizações automáticas (Maven, npm, Actions)
│   └── workflows/
│       ├── ci.yml                       # CI: 4 jobs paralelos
│       └── security.yml                 # OWASP (agendado, toda segunda)
├── backend/
│   ├── Dockerfile                       # Multi-stage: build Maven → JRE não-root
│   ├── .dockerignore
│   ├── pom.xml                          # Dependências + plugins (JaCoCo, PMD, PIT, Spotless)
│   ├── allure-results/                  # Resultados dos testes (gitignored, lido pelo Docker)
│   └── src/
│       ├── main/
│       │   ├── java/com/portfolio/assetmanagement/
│       │   │   ├── application/         # Services, DTOs, Mappers
│       │   │   ├── config/              # Beans, DataSeeder
│       │   │   ├── domain/              # Entidades e Enums
│       │   │   ├── infrastructure/      # Repositórios JPA
│       │   │   ├── interfaces/rest/     # Controllers REST
│       │   │   ├── security/            # JWT, filtros
│       │   │   └── shared/              # Exceptions, paginação
│       │   └── resources/
│       │       ├── application.yml      # Configuração base
│       │       ├── application-docker.yml
│       │       └── db/migration/        # Flyway V1–V7
│       └── test/
│           ├── java/                    # JUnit, BDD steps, ArchUnit
│           └── resources/
│               ├── features/            # Gherkin (.feature)
│               └── junit-platform.properties  # Cucumber + Allure listener
├── frontend/
│   ├── Dockerfile                       # Multi-stage: Vite build → Nginx
│   ├── .dockerignore
│   ├── nginx.conf                       # SPA routing + gzip + security headers
│   └── src/
│       ├── api/                         # Axios + endpoints
│       ├── components/                  # Layout, Sidebar, Header
│       ├── context/                     # AuthContext
│       ├── pages/                       # Módulos (assets, dashboard, etc.)
│       ├── routes/                      # AppRoutes com proteção por perfil
│       ├── shared/                      # Componentes UI reutilizáveis
│       ├── types/                       # Tipos TypeScript globais
│       └── automation/
│           ├── shared/features/         # Feature files BDD compartilhados
│           ├── cypress/                 # Cypress + Cucumber
│           │   ├── cypress.config.ts
│           │   ├── e2e/features/
│           │   └── support/step-definitions/
│           └── playwright/              # Playwright + Cucumber
│               ├── cucumber.js
│               ├── step-definitions/
│               └── support/             # World, Hooks
├── infra/
│   ├── prometheus/
│   │   ├── prometheus.yml               # Scrape config (15s interval)
│   │   └── alerts.yml                   # 7 regras: disponibilidade, HTTP, JVM, HikariCP
│   └── grafana/
│       ├── provisioning/
│       │   ├── datasources/datasource.yml
│       │   └── dashboards/dashboard.yml
│       └── dashboards/
│           ├── backend.json             # Dashboard Spring Boot com 14 painéis (auto-provisionado)
│           └── k6-performance.json      # Dashboard k6 com 13 painéis (auto-provisionado)
└── k6/
    └── test.js                          # Testes de carga e performance
```

---

## 🐳 Ambiente Docker

A stack completa sobe via `docker compose up --build` com **9 containers**:

| Container | Imagem | Porta | Função |
|---|---|---|---|
| `asset-management-db` | postgres:16-alpine | 5433 | Banco de dados |
| `asset-management-api` | build ./backend | 8080 | Backend Spring Boot |
| `asset-management-frontend` | build ./frontend | 5173→80 | Frontend via Nginx |
| `prometheus` | prom/prometheus:latest | 9090 | Coleta de métricas da API |
| `influxdb` | influxdb:1.8-alpine | 8086 | Métricas de carga do k6 |
| `grafana` | grafana/grafana:latest | 3001 | Dashboards (Backend + k6) |
| `allure` | frankescobar/allure-docker-service | 5050 | Relatórios de teste (API + geração) |
| `allure-ui` | frankescobar/allure-docker-service-ui | 5252 | Interface de relatórios |

### Ordem de inicialização

```
postgres ──(healthy)──► backend ──(healthy)──► frontend
                                           └──► prometheus ──► grafana ◄── influxdb
backend/allure-results/ ──────────────────────► allure ──────────────────► allure-ui
```

### Recursos por container

| Container | CPU limit | Memória limit |
|---|---|---|
| postgres | 0.5 core | 512 MB |
| backend | 1.0 core | 768 MB |
| frontend (nginx) | 0.25 core | 128 MB |

### Variáveis de ambiente

Todas as credenciais são lidas do arquivo `.env` (nunca commitado). Copie o template:

```bash
cp .env.example .env
```

Variáveis disponíveis:

```bash
# Banco de dados
DB_USERNAME=asset_user
DB_PASSWORD=asset123

# JWT (gere com: openssl rand -hex 64)
JWT_SECRET=sua-chave-secreta

# E-mail SMTP
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=seu@email.com
MAIL_PASSWORD=sua-senha-de-app

# Grafana
GRAFANA_USER=admin
GRAFANA_PASSWORD=admin123

# Frontend
VITE_API_URL=http://localhost:8080
```

---

## 🔑 Credenciais de Demonstração

Criados automaticamente pelo Flyway + DataSeeder na inicialização:

| E-mail | Senha | Perfil | Unidade |
|---|---|---|---|
| admin@empresa.com | Admin@123 | ADMIN | Matriz SP |
| gestor@empresa.com | Gestor@123 | GESTOR | Filial RJ |
| operador@empresa.com | Op@12345 | OPERADOR | Filial BH |

---

## 👤 Controle de Acesso por Perfil

O isolamento é aplicado em todos os serviços via `LoggedUserContext` — resolve o usuário do JWT e define o perímetro de acesso:

### ADMIN
- Acesso completo a todas as unidades da organização
- Gerencia organizações, unidades e usuários
- Dashboard executivo consolidado, auditoria e relatórios globais

### GESTOR
- Acesso restrito à **sua própria unidade**
- Dashboard com taxa de utilização, ativos ociosos e custos da unidade

### OPERADOR
- Acesso restrito aos **ativos atribuídos a ele**
- Dashboard pessoal com seus ativos e manutenções

Qualquer acesso fora do escopo retorna `403 Forbidden`.

---

## 🔐 Autenticação

JWT stateless com refresh token e suporte a MFA.

### Fluxo padrão

```
POST /auth/login
  { "email": "...", "password": "..." }
  → { "accessToken": "...", "refreshToken": "..." }
```

### Fluxo com MFA

```
POST /auth/login
  → { "mfaRequired": true, "userId": 1 }

POST /auth/mfa/verify
  { "userId": 1, "code": "123456" }
  → { "accessToken": "...", "refreshToken": "..." }
```

Código MFA: 6 dígitos, expira em 5 minutos, uso único.

### Renovação de token

```
POST /auth/refresh
  { "refreshToken": "..." }
  → { "accessToken": "...", "refreshToken": "..." }  ← rotação automática
```

### Como usar no Swagger

1. Acesse `POST /auth/login` e execute com suas credenciais
2. Copie o `accessToken`
3. Clique em **Authorize** (ícone de cadeado)
4. Cole: `Bearer SEU_TOKEN_AQUI`

---

## ⚙️ Perfis de Configuração

### `application.yml` — desenvolvimento local

Requer variáveis de ambiente definidas localmente (ou use o `.env` com uma ferramenta como `direnv`):

```bash
export DB_URL=jdbc:postgresql://localhost:5433/asset_management
export DB_USERNAME=asset_user
export DB_PASSWORD=asset123
export JWT_SECRET=sua-chave-secreta-aqui
export MAIL_USERNAME=seu@email.com
export MAIL_PASSWORD=sua-senha
```

Principais configurações:
- `ddl-auto: validate` — Hibernate valida schema, Flyway gerencia migrações
- `open-in-view: false` — previne lazy loading fora da camada de serviço
- Graceful shutdown: aguarda até 30s para encerrar requisições em andamento
- HikariCP: pool de 5–10 conexões, leak detection em 60s
- Batch JPA: `batch_size: 25` com `order_inserts/updates`
- JWT: expiração de 1h, refresh de 7 dias

### `application-docker.yml` — containers

Ativo automaticamente com `SPRING_PROFILES_ACTIVE=docker`. Sobreposições:
- Pool HikariCP: 3–15 conexões
- Swagger UI desabilitado
- Logging em formato linha única (para coleta por Loki/ELK)
- `show-details: when-authorized` no health endpoint

### Endpoints do Actuator

| Endpoint | Acesso | Descrição |
|---|---|---|
| `/actuator/health` | público | Status geral (UP/DOWN) |
| `/actuator/health/liveness` | público | Liveness probe (Kubernetes) |
| `/actuator/health/readiness` | público | Readiness probe |
| `/actuator/prometheus` | público | Métricas para Prometheus |
| `/actuator/info` | público | Versão e build info |
| `/actuator/metrics` | ADMIN | Browser de métricas |
| `/actuator/loggers` | ADMIN | Alteração de log level em runtime |

---

## 🧪 Testes e Qualidade

### Executar todos os testes

```bash
cd backend
mvn clean verify
```

### Tipos de teste

**Testes unitários** — JUnit 5 + Mockito, banco H2 em memória.

**Testes de integração** — Testcontainers sobe PostgreSQL real, garantindo compatibilidade total com produção.

**Testes BDD** — cenários em Gherkin (`.feature`) executados com Cucumber 7 + Rest Assured. Resultados integrados ao Allure via listener `AllureCucumber7Jvm`.

**Testes de arquitetura** — ArchUnit valida as dependências entre camadas (ex: `domain` não pode depender de `application`).

### Relatórios após `mvn verify`

```bash
# Cobertura JaCoCo (gate: mínimo 50% de linhas)
open target/site/jacoco/index.html

# Relatório Allure local (via Maven)
mvn allure:report
open target/site/allure-maven-plugin/index.html

# Relatório Allure via Docker (automático após gerar resultados)
# Acesse: http://localhost:5252
```

### Ferramentas de qualidade

```bash
# Verificar formatação (Google Java Format)
mvn spotless:check

# Corrigir formatação automaticamente
mvn spotless:apply

# Análise estática PMD
mvn pmd:check

# Mutation testing (não roda no verify; execute separadamente)
mvn pitest:mutationCoverage

# Análise de vulnerabilidades (executado no CI toda segunda)
mvn dependency-check:check
```

---

## 🎭 Automação de Testes Frontend

Dois frameworks de automação E2E com BDD (Cucumber + Gherkin) estão configurados em `frontend/src/automation/`.

### Cenários cobertos (17 no total)

- Listagem e filtros de ativos por status
- Criação de ativo com validação de campos
- Visualização de detalhes e navegação por abas (Info, Depreciação, Histórico)
- Atribuição e remoção de usuário
- Solicitação de manutenção com validação de mínimo de caracteres
- Solicitação de transferência entre unidades
- Controle de acesso: operador não vê botões restritos
- Exportação CSV

### Cypress (BDD com Cucumber)

```bash
cd frontend/src/automation/cypress
npm install

# Modo interativo (abre o Cypress Test Runner)
npm run test:open

# Modo headless (CI)
npm run test
```

Configuração: `cypress.config.ts`
Feature file: `e2e/features/asset-management.feature`
Steps: `support/step-definitions/asset-management.steps.ts`
Comandos customizados: `support/commands.ts` (`loginAs`, `navigateToAssets`, `waitForTableLoad`)

### Playwright (BDD com Cucumber)

```bash
cd frontend/src/automation/playwright
npm install
npx playwright install chromium

# Modo headless
npm run test

# Modo com browser visível
npm run test:headed
```

Configuração: `cucumber.js`
Feature file: `../shared/features/asset-management.feature` (compartilhado com Cypress)
Steps: `step-definitions/asset-management.steps.ts`
World class: `support/world.ts` (encapsula browser, página, login, navegação)
Hooks: `support/hooks.ts` (screenshot automático em falha, limpeza de browser)

> **Pré-requisito:** a aplicação deve estar rodando (`docker compose up` ou local) antes de executar os testes E2E.

---

## 📈 Testes de Carga — k6

Testes de performance com [k6](https://k6.io/) em `k6/test.js`. Os resultados são enviados em tempo real para o InfluxDB e visualizados no Grafana.

### Pré-requisito

```bash
# Instalar k6
# macOS:
brew install k6

# Linux:
sudo apt install k6

# Windows:
winget install k6
```

### Executar

```bash
# Modo simples (resultados apenas no terminal)
k6 run k6/test.js

# Com envio de métricas para Grafana (recomendado)
k6 run --out influxdb=http://localhost:8086/k6 k6/test.js
```

> Com `docker compose up` rodando, o InfluxDB já está disponível. O dashboard **"Patrimônio 360 — Testes de Performance (k6)"** no Grafana atualiza em tempo real durante a execução.

### Cenários de teste (3)

| Cenário | VUs | Duração | Objetivo |
|---|---|---|---|
| **Smoke** | 1 VU | ~1 min | Verificar que os endpoints respondem sem carga |
| **Load** | até 20 VUs | ~7 min | Simular carga normal de produção |
| **Spike** | até 50 VUs | ~5 min | Verificar comportamento sob pico repentino |

### Endpoints cobertos

- **Health**: `GET /actuator/health`
- **Auth**: `POST /auth/login` (métricas de latência de login separadas)
- **Ativos**: listagem, criação, detalhes, histórico, depreciação (por unidade e global)
- **Manutenção**: listagem e criação de solicitações
- **Transferências**: listagem e solicitação
- **Usuários**: listagem por organização
- **Dashboard**: métricas por perfil (ADMIN, GESTOR, OPERADOR)
- **Auditoria**: listagem de logs de auditoria

### Thresholds (critérios de aprovação)

| Métrica | Limite |
|---|---|
| `http_req_duration` p95 | ≤ 2000 ms |
| `http_req_failed` | ≤ 10% |
| `login_duration` p95 | ≤ 3000 ms |
| `assets_duration` p95 | ≤ 2000 ms |
| `maintenance_duration` p95 | ≤ 2000 ms |

### Interpretar resultados no Grafana

Acesse http://localhost:3001 → dashboard **"Patrimônio 360 — Testes de Performance (k6)"**:

- **Resumo do Teste**: requisições totais, taxa de erros, duração média e p95
- **Latência ao Longo do Tempo**: gráfico temporal de p50/p90/p95/p99
- **Erros e Thresholds**: falhas HTTP e verificações com falha
- **Métricas Customizadas**: latência separada por domínio (login, ativos, manutenção)

---

## 📊 Observabilidade — Prometheus + Grafana

### Como funciona

```
Backend (/actuator/prometheus)
    ↓ coleta a cada 15s
Prometheus (armazena séries temporais por 15 dias)
    ↓ datasource
Grafana (dashboards e alertas)
```

### Grafana — acesso e dashboard

```
URL:  http://localhost:3001
User: admin  (configurável via GRAFANA_USER no .env)
Pass: admin123  (configurável via GRAFANA_PASSWORD no .env)
```

Dois dashboards são **provisionados automaticamente** ao subir o container — nenhuma configuração manual é necessária. Eles carregam via `infra/grafana/provisioning/`.

#### Dashboard 1 — Patrimônio 360: Backend (Spring Boot)

**14 painéis em 4 seções:**

| Seção | Painéis |
|---|---|
| **Visão Geral** | Req/s, Taxa de erros 5xx, Latência P99, Uptime |
| **HTTP** | Taxa por endpoint, Latência p50/p90/p95/p99, Status HTTP, Erros 4xx/5xx |
| **JVM** | Heap (usado/máximo/confirmado), CPU, GC pausas, Threads |
| **HikariCP** | Conexões (ativas/ociosas/pendentes/máximo), Tempo de aquisição e uso |

#### Dashboard 2 — Patrimônio 360: Testes de Performance (k6)

Alimentado pelo InfluxDB (métricas enviadas em tempo real pelo k6). **13 painéis em 4 seções:**

| Seção | Painéis |
|---|---|
| **Resumo do Teste** | Total de requisições, Taxa de erros, Duração média, p95 geral |
| **Latência ao Longo do Tempo** | p50, p90, p95, p99 em gráfico temporal |
| **Erros e Thresholds** | Falhas HTTP, Verificações com falha |
| **Métricas Customizadas** | Latência de login (p95), Ativos (p95), Manutenção (p95), Total de req., Tráfego |

### Prometheus — acesso e alertas

```
URL: http://localhost:9090
```

**7 regras de alerta** configuradas em `infra/prometheus/alerts.yml`:

| Grupo | Alerta | Condição |
|---|---|---|
| Disponibilidade | `BackendIndisponivel` | Backend sem resposta por >1 min |
| HTTP | `AltaTaxaDeErros5xx` | Erros 5xx >5% por >2 min |
| HTTP | `AltaLatenciaP99` | P99 >2s por >5 min |
| JVM | `HeapMemoriaAlta` | Heap >85% por >5 min |
| JVM | `HeapMemoriaCritica` | Heap >95% por >2 min |
| JVM | `AltoPauseGC` | GC pausando >100ms/s por >5 min |
| HikariCP | `PoolConexoesEsgotado` | Conexões pendentes >5 por >2 min |
| HikariCP | `PoolConexoesAtivoCritico` | Pool >90% de utilização por >2 min |

Para consultar alertas ativos:
- Acesse: http://localhost:9090/alerts

---

## 📋 Relatórios de Teste — Allure

### Como funciona

```
# Backend (BDD com Cucumber + Rest Assured)
mvn clean verify
    ↓ (AllureCucumber7Jvm listener via junit-platform.properties)
backend/allure-results/*.json  ←  JSONs gerados automaticamente

# Frontend (E2E com Cypress + Cucumber)
npm test  (dentro de frontend/src/automation/cypress)
    ↓ (allure-cypress reporter configurado em cypress.config.ts)
backend/allure-results/*.json  ←  JSONs gravados no mesmo diretório

    ↓ (volume Docker montado: backend/allure-results → /app/allure-results)
Container allure (porta 5050)  ←  detecta arquivos em até 3s e gera relatório
    ↓
Container allure-ui (porta 5252)  ←  interface web com histórico
```

> Backend e Frontend escrevem no **mesmo diretório** (`backend/allure-results/`) e aparecem no **mesmo projeto Allure**. A separação visual é feita pela label `@allure.label.parentSuite:Backend` / `@allure.label.parentSuite:Frontend` na aba **Suites** do relatório.

### Acessos

| Interface | URL | Descrição |
|---|---|---|
| **Allure UI** | http://localhost:5252 | Interface principal — histórico de execuções e tendências |
| **Relatório direto** | http://localhost:5050/allure-docker-service/projects/default/reports/latest/index.html | Último relatório gerado (abre direto) |
| **API REST** | http://localhost:5050/allure-docker-service/ | REST API para integração com CI |

### Fluxo completo

```bash
# 1. Suba a stack (se ainda não estiver rodando)
docker compose up allure allure-ui

# 2. Execute os testes backend (gera JSONs em backend/allure-results/)
cd backend && mvn clean verify

# 3. Execute os testes E2E frontend (grava no mesmo diretório)
cd frontend/src/automation/cypress && npm test

# 4. Acesse o relatório (gerado automaticamente em até 3s)
# http://localhost:5252
```

### Organização do relatório

Na aba **Suites**, os testes aparecem em dois grupos separados:

| Grupo | Origem | Label |
|---|---|---|
| **Backend** | Cucumber BDD (Java) — features em `backend/src/test/resources/features/` | `@allure.label.parentSuite:Backend` |
| **Frontend** | Cypress BDD (TypeScript) — features em `frontend/src/automation/cypress/e2e/` | `@allure.label.parentSuite:Frontend` |

### O que o relatório contém

- **Overview**: total de testes, passou/falhou/quebrado/ignorado
- **Suites**: agrupamento por parentSuite (Backend / Frontend), depois por feature
- **Behaviors**: cenários BDD organizados por Epic e Feature
- **Timeline**: execução dos testes ao longo do tempo
- **Graphs**: distribuição de status, duração, severidade
- **Categories**: classificação automática de falhas por tipo
- **History Trend**: gráfico de estabilidade ao longo das últimas 20 execuções

### Histórico entre execuções

O container mantém histórico das últimas **20 execuções** (`KEEP_HISTORY_LATEST=20`), permitindo acompanhar tendências de qualidade ao longo do tempo.

---

## 🔄 Pipeline CI/CD

### Workflows

| Workflow | Arquivo | Gatilho | Descrição |
|---|---|---|---|
| CI | `ci.yml` | push/PR para `main` + manual | Build, testes, qualidade, Docker |
| Security | `security.yml` | toda segunda às 06h UTC + manual | OWASP Dependency Check |

### Estrutura do CI (4 jobs paralelos)

```
backend ─────────────────────────────────────────┐
  └─ build + mvn verify (testes + JaCoCo gate)   │
  └─ upload JaCoCo report (artefato)             │
  └─ upload allure-results (artefato)            ├─► docker
  └─ Codecov upload                              │     └─ build imagem backend
                                                 │     └─ build imagem frontend
backend-quality ─────────────────────────────────┤     └─ Trivy scan (CRITICAL/HIGH)
  └─ Spotless (formatação)                       │
  └─ PMD (análise estática)                      │
  └─ upload PMD report (artefato)                │
                                                 │
frontend ────────────────────────────────────────┘
  └─ npm ci + lint + build de produção
  └─ upload dist/ (artefato)
```

- `backend` e `frontend` rodam **em paralelo**
- `docker` aguarda **ambos** passarem antes de rodar
- `backend-quality` roda **em paralelo** com os demais (feedback independente)

### Security workflow (OWASP)

Separado do CI principal para não bloquear PRs (pode levar 15-20 min pelo download do NVD):

```bash
# Executar manualmente via GitHub Actions UI ou localmente:
cd backend
NVD_API_KEY=sua-chave mvn dependency-check:check
```

Relatório HTML é gerado em `target/dependency-check-report.html` e salvo como artefato no GitHub por 30 dias.

### Dependabot

Atualiza dependências automaticamente toda segunda, com PRs separados por ecossistema:
- Maven (`/backend`)
- npm (`/frontend`)
- npm (Cypress e Playwright — mensal)
- GitHub Actions

---

## 📖 Documentação da API

| Recurso | URL |
|---|---|
| Swagger UI | http://localhost:8080/swagger-ui.html |
| OpenAPI JSON | http://localhost:8080/v3/api-docs |

> O Swagger é desabilitado no perfil `docker` (produção). Para acessar a documentação, rode o backend localmente com o perfil padrão ou sem `SPRING_PROFILES_ACTIVE=docker`.

Todos os endpoints estão documentados com descrições, parâmetros, exemplos de request/response e códigos de erro.

---

## 🎯 Objetivo do Projeto

Este projeto foi construído com dois objetivos principais:

1. **Simular uma arquitetura backend real de nível enterprise** — separação de camadas, controle de acesso por perfil, rastreabilidade financeira e pipeline de qualidade completo com cobertura, mutation testing, análise estática, segurança de dependências e observabilidade.

2. **Servir como base para prática de automação de testes** — a estrutura já inclui Rest Assured, Cucumber/BDD e Testcontainers no backend, Cypress e Playwright com BDD no frontend, e testes de carga com k6.

Qualquer pessoa pode clonar, fazer fork e utilizar este projeto para fins de aprendizado.

---

## 📜 Licença

Projeto aberto para fins de aprendizado. Sinta-se à vontade para utilizar, fazer fork e adaptar.
