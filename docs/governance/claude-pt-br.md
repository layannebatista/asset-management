# asset-management

**Status:** ✅ Desenvolvimento Ativo | 🧠 Rule Engine + Otimização de Tokens RTK

---

## 📌 Visão Geral do Projeto

**Tipo:** Monorepo  
**Arquitetura:** Microserviços + IA Sidecar  
**Propósito:** Sistema de Gerenciamento de Ativos com análise e suporte a decisões alimentados por IA

### Stack
- **Backend:** Spring Boot (Java 17, Maven)
- **Frontend:** React 18 + Vite + TypeScript
- **Serviço de IA:** Node.js/Express + Rule Engine
- **Relatórios:** Node.js (Sprint Reporter)
- **Infraestrutura:** Docker Compose, k6 load testing, Prometheus + Grafana

---

## 📁 Sub-Projetos

### 1. `backend/` — API Spring Boot
- **Porta:** 8080
- **Build:** `./mvnw clean verify`
- **Teste:** `./mvnw test`
- **Lint:** Spotless formatter, PMD analysis
- **Relatórios:** JaCoCo coverage, Allure BDD

**Tech:** Java 17, Spring Boot 3, Maven, JUnit 5, Cucumber BDD

### 2. `frontend/` — Dashboard React
- **Porta:** 5173 (dev), 3000 (prod)
- **Build:** `npm ci && npm run build`
- **Dev:** `npm run dev`
- **Teste:** `npx playwright test`
- **Lint:** `npm run lint` (ESLint v9)

**Tech:** React 18, Vite v8, TypeScript 5, Tailwind CSS 4, Playwright E2E

### 3. `ai-intelligence/` — Serviço IA Sidecar
- **Porta:** 3100
- **Build:** `npm ci && npm run build`
- **Dev:** `npm run dev`
- **Teste:** `npm run test` (Jest 29)
- **Recursos:** 5 analisadores, Rule Engine, Coordenação multi-agente

**Tech:** Node 20+, Express, TypeScript, Jest, Integração OpenAI/Claude API

### 4. `sprint-reporter/` — Serviço de Relatórios
- **Propósito:** Gerar métricas e relatórios de sprint
- **Build:** `npm ci && npm run build`
- **Início:** `npm run start`

**Tech:** Node 18+, TypeScript, ESLint

---

## 🚀 Início Rápido

### Instalar Dependências
```bash
# Todos os sub-projetos de uma vez
npm ci --workspace=frontend --workspace=ai-intelligence --workspace=sprint-reporter

# Ou por sub-projeto
cd frontend && npm ci
cd ../ai-intelligence && npm ci
cd ../sprint-reporter && npm ci
```

### Desenvolvimento Local
```bash
# Terminal 1: Backend
./mvnw spring-boot:run

# Terminal 2: Frontend
cd frontend && npm run dev

# Terminal 3: Serviço de IA
cd ai-intelligence && npm run dev

# Terminal 4: Stack (todos os serviços)
docker compose up -d
```

### Executar Testes
```bash
# Frontend E2E
cd frontend && npx playwright test

# Testes unitários IA Intelligence
cd ai-intelligence && npm run test

# Backend (com JaCoCo + PMD)
./mvnw clean verify

# Todos os testes via Docker
./scripts/run-all-tests-docker.ps1
```

### Build
```bash
# Todos
npm run build --workspace=frontend --workspace=ai-intelligence
./mvnw clean package

# Ou por projeto
cd frontend && npm run build
cd ai-intelligence && npm run build
```

---

## 🧠 Camada de Inteligência Artificial

### Rule Engine (Análise QA Offline)
**Localização:** `ai-intelligence/public/dashboard.js`

- ✅ 100% determinístico
- ✅ 0 dependências externas
- ✅ 6 métricas configuráveis
- ✅ 7 presets prontos para usar

**Métricas Geradas:**
```
📊 Dashboard de Eficiência (diretas do JSON)
  ├─ Qualidade Média
  ├─ Confiança Média
  ├─ Confiança da Decisão
  ├─ Quantidade de Decisões
  ├─ Quantidade de Achados
  └─ Volume de Análise

🧠 QA Intelligence (Rule Engine)
  ├─ Qualidade Ajustada
  ├─ Risco (score + level)
  ├─ Estabilidade
  ├─ Volume de Problemas
  └─ Taxa de Ação
```

**Documentação:**
- [`Rule Engine consolidado`](../ia-intelligence/rule-engine-pt-br.md)

---

## 🔌 Integração RTK

**RTK (Rust Token Killer)** reduz consumo de tokens LLM em 60-90% filtrando outputs de comandos.

### Instalação
```bash
# Script de instalação automatizado (Windows/Linux/macOS)
./scripts/install-rtk.sh

# Verificar
rtk --version
```

### Guia de Setup por IA
Suportamos as principais IAs com documentação consolidada:
- [RTK - Guia Unificado](../rtk/rtk-guia-unificado-pt-br.md)

### Comandos Otimizados
- ✅ `npm ci` → Filtra dependências
- ✅ `npm run build` → Comprime output
- ✅ `npm run test` → Resume falhas
- ✅ `npm run lint` → Agrupa erros
- ✅ `npx tsc` → Mostra apenas diagnósticos
- ✅ `jest` → Deduplica resultados de teste
- ✅ `./mvnw` → Comprime output Maven
- ✅ `git status`, `git diff`, `git log`
- ✅ `docker compose logs`

### Como Funciona
1. Hook RTK intercepta cada comando Bash executado por Claude Code
2. Filtra output (remove ruído)
3. Agrupa itens similares
4. Trunca para contexto relevante
5. Deduplica entradas repetidas

→ Resultado: Mesmas informações, **60-90% menos tokens**

---

## 📊 Pipelines CI/CD

### `.github/workflows/ci.yml`
**Triggers:** push para `main`, PRs, manual

**Jobs:**
1. Backend — Maven verify + JaCoCo + PMD + Spotless
2. Frontend — ESLint + Vite build
3. AI Intelligence — TypeScript check + Jest + build
4. Playwright E2E — Teste full stack com relatórios Allure
5. Docker — Build de imagens + Trivy vulnerability scan

### `.github/workflows/security.yml`
**Triggers:** Semanal (seg 06h UTC), manual

**Jobs:**
1. OWASP Dependency Check — Dependências Maven

---

## 🛠️ Comandos Úteis

### Desenvolvimento
```bash
# Watch e rebuild
cd frontend && npm run dev
cd ai-intelligence && npm run dev

# Verificação de tipo
npm run tsc --workspace=ai-intelligence

# Formatar código
npm run lint:fix --workspace=frontend
npm run lint:fix --workspace=ai-intelligence
```

### Testes e Qualidade
```bash
# Executar todos os testes no Docker
./scripts/run-all-tests-docker.ps1

# Gerar relatórios de cobertura
./mvnw clean verify
npm run test:coverage --workspace=ai-intelligence

# Lint em tudo
npm run lint --workspace=frontend --workspace=ai-intelligence
```

### Docker
```bash
# Iniciar stack
docker compose up -d

# Ver logs
docker compose logs -f

# Parar
docker compose down

# Reconstruir imagens
docker compose build --no-cache
```

### Performance
```bash
# Teste de carga (k6)
k6 run k6/basic-load-test.js

# Monitoramento (Grafana)
http://localhost:3000  # (se ativado no docker-compose.yml)
```

---

## 🔐 Variáveis de Ambiente

Copie `.env.example` para `.env` e configure:

```bash
# Database
DB_URL=postgresql://localhost:5432/asset_management
DB_USERNAME=postgres
DB_PASSWORD=...

# Serviços de IA
OPENAI_API_KEY=sk-...
AI_SERVICE_URL=http://localhost:3100
AI_SERVICE_API_KEY=...

# Frontend
VITE_API_URL=http://localhost:8080

# GitHub (para actions)
GITHUB_TOKEN=...
GITHUB_OWNER=...
GITHUB_REPO=...
```

---

## 📚 Arquivos de Documentação

| Arquivo | Propósito |
|---------|-----------|
| [`rule-engine-pt-br.md`](../ia-intelligence/rule-engine-pt-br.md) | Rule engine consolidado |
| [`ia-operacao-e-dashboard-pt-br.md`](../ia-intelligence/ia-operacao-e-dashboard-pt-br.md) | Operação e dashboard IA |

---

## 📖 Documentação RTK em Português BR

Toda a documentação de integração RTK está em `docs/` com o padrão de nomenclatura do projeto:

### Guia Principal
- [rtk-guia-unificado-pt-br.md](../rtk/rtk-guia-unificado-pt-br.md) — Setup consolidado para múltiplas IAs

---

## 🎯 Foco Atual

- ✅ Rule Engine (análise QA offline)
- ✅ Integração RTK (otimização de tokens)
- 🚧 Orquestração multi-analisador
- 🚧 Suporte a decisão em tempo real
- 🚧 Análise de tendências históricas

---

## 👥 Contribuidores

- **layanne** (@contato.layanne.batista@gmail.com)

---

## 📝 Notas

- **Versão Node:** v20.20.2 (ai-intelligence requer >=20)
- **Java:** 17 (Spring Boot 3)
- **Gerenciador de Pacotes:** npm (com workspaces)
- **Shell:** bash (Git Bash no Windows)
- **CI/CD:** GitHub Actions

---

**Última Atualização:** 2026-04-23

Para dúvidas ou atualizações, consulte os READMEs dos sub-projetos e arquivos de documentação listados acima.
