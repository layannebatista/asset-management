# AI Intelligence — Camada de Inteligência Artificial

## Visão Geral

A camada de AI Intelligence é um microsserviço independente (`ai-intelligence/`) construído em Node.js + TypeScript que fornece análises automatizadas orientadas por LLM para a plataforma. Ela **não é um chatbot** — é um sistema de engenharia de IA que processa metadados estruturados e retorna diagnósticos acionáveis.

### O que ela faz

| Analyzer | Entrada | Saída |
|---|---|---|
| **Observability** | Métricas Prometheus (JVM, HTTP, sistema) | Anomalias, gargalos, recomendações, health score |
| **Test Intelligence** | Resultados Allure (Playwright + Cucumber) | Testes flaky, padrões de falha, priorização |
| **CI/CD** | GitHub Actions workflow runs | Jobs lentos, tendências de falha, otimizações |
| **Incident** | Logs e mensagens de erro | Hipótese de causa raiz, camadas impactadas, correções |
| **Risk** | Metadados de domínio do backend | Score de risco, inconsistências, flags de compliance |
| **Multi-Agent** | Todos os acima combinados | Relatório executivo unificado com síntese |

---

## Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                    AI Intelligence  :3100                        │
│                                                                  │
│  POST /api/v1/analysis/{type}                                    │
│         │                                                        │
│         ▼                                                        │
│  ContextPipeline                                                 │
│    ├── ContextFilter       (decompõe dados em chunks pontuados)  │
│    ├── SemanticDeduplicator (SDD: remove redundâncias semânticas) │
│    └── ContextBudgetManager (RTK: seleciona por relevância       │
│                              dentro do orçamento de tokens)      │
│         │                                                        │
│         ▼                                                        │
│  PromptOptimizer  →  LLMClient (OpenAI JSON mode)               │
│         │                                                        │
│         ▼                                                        │
│  AnalysisRepository  (PostgreSQL — schema ai_intelligence)       │
└─────────────────────────────────────────────────────────────────┘
         ▲                ▲                   ▲
   Prometheus:9090   Allure:5050       GitHub Actions API
   Backend:8080      InfluxDB:8086
```

### Pipeline de contexto

O problema central de sistemas LLM é o desperdício de tokens. O pipeline resolve isso em três etapas antes de qualquer chamada ao modelo:

```
dados brutos (Prometheus, Allure, GitHub, Backend)
  │
  ▼
ContextFilter          → decompõe em ContextChunks pontuados por relevância
  │
  ▼
SemanticDeduplicator   → remove chunks redundantes (Jaccard similarity)
  │                       demove chunks numéricos já cobertos por flags
  ▼
ContextBudgetManager   → seleciona chunks por score × boost[focus]
                         garante que o contexto caiba em ≤ 2000 tokens
  │
  ▼
PromptOptimizer        → monta system prompt + user prompt estruturado
  │
  ▼
LLMClient              → chama OpenAI com JSON mode, retry em rate limit
```

Resultado típico: **75–80% de redução** de tokens em relação ao envio direto dos dados brutos.

---

## Integração com o Sistema Existente

O serviço AI **não é exposto diretamente** ao browser. O Spring Boot atua como proxy autenticado:

```
Browser
  └─► React  →  POST /api/ai/analysis/observability  (JWT + RBAC)
                   └─► Spring Boot (AiInsightController)
                           └─► AI Service (X-AI-Service-Key)
                                   └─► OpenAI API
```

Isso garante que:
- Apenas usuários com papel ADMIN ou GESTOR podem acionar análises
- A chave OpenAI nunca é exposta ao frontend
- O serviço AI fica inacessível externamente

### Endpoints do Spring Boot

| Método | Endpoint | Acesso |
|---|---|---|
| POST | `/api/ai/analysis/observability` | ADMIN, GESTOR |
| POST | `/api/ai/analysis/test-intelligence` | ADMIN, GESTOR |
| POST | `/api/ai/analysis/cicd` | ADMIN, GESTOR |
| POST | `/api/ai/analysis/incident` | ADMIN, GESTOR |
| POST | `/api/ai/analysis/risk` | ADMIN, GESTOR |
| POST | `/api/ai/analysis/multi-agent` | ADMIN |
| GET | `/api/ai/analysis/history` | autenticado |
| GET | `/api/ai/analysis/{id}` | autenticado |

---

## Estrutura do Projeto

```
ai-intelligence/
├── src/
│   ├── config/
│   │   └── index.ts               # Configurações centralizadas (env vars)
│   ├── types/
│   │   ├── analysis.types.ts      # Tipos de resultado de cada analyzer
│   │   └── metrics.types.ts       # Tipos de métricas (Prometheus, Allure, GitHub)
│   ├── context/
│   │   ├── ContextFilter.ts       # Decomposição em ContextChunks pontuados
│   │   ├── ContextBudgetManager.ts # RTK-like: orçamento de tokens por relevância
│   │   ├── SemanticDeduplicator.ts # SDD: deduplicação semântica de chunks
│   │   ├── ContextPipeline.ts     # Orquestra Filter → SDD → Budget
│   │   └── SensitiveDataMasker.ts  # Remove tokens, credenciais, IPs privados
│   ├── llm/
│   │   ├── LLMClient.ts           # Wrapper OpenAI com JSON mode e retry
│   │   └── PromptOptimizer.ts     # System prompts por tipo de análise
│   ├── collectors/
│   │   ├── PrometheusCollector.ts  # Queries PromQL para JVM, HTTP, sistema
│   │   ├── AllureCollector.ts      # Resultados de teste via Allure REST API
│   │   ├── GitHubActionsCollector.ts # Workflow runs via GitHub API
│   │   └── BackendDataCollector.ts  # Metadados de domínio do Spring Boot
│   ├── analyzers/
│   │   ├── observability/ObservabilityAnalyzer.ts
│   │   ├── test-intelligence/TestIntelligenceAnalyzer.ts
│   │   ├── cicd/CICDAnalyzer.ts
│   │   ├── incident/IncidentAnalyzer.ts
│   │   └── risk/RiskAnalyzer.ts
│   ├── agents/
│   │   └── AgentCoordinator.ts    # 4 agentes em paralelo + síntese
│   ├── orchestrator/
│   │   └── AIOrchestrator.ts      # Entry point central de dispatch
│   ├── storage/
│   │   ├── AnalysisRepository.ts  # Persistência no PostgreSQL
│   │   └── schema.sql             # Schema ai_intelligence (auto-aplicado)
│   └── api/
│       ├── server.ts              # Express + Helmet + rate limit
│       ├── logger.ts              # Winston estruturado
│       ├── middleware/
│       │   ├── auth.ts            # Validação do X-AI-Service-Key
│       │   └── errorHandler.ts    # Handler global de erros
│       └── routes/
│           ├── analysis.routes.ts  # Rotas protegidas + validação Zod
│           └── health.routes.ts    # GET /health (público)
├── Dockerfile                     # Multi-stage: build → runner não-root
├── package.json
└── tsconfig.json
```

---

## Configuração

### Variáveis de Ambiente

Copie `ai-intelligence/.env.example` para `ai-intelligence/.env`:

| Variável | Descrição | Padrão |
|---|---|---|
| `AI_SERVICE_PORT` | Porta do serviço | `3100` |
| `AI_SERVICE_API_KEY` | Chave interna (compartilhada com Spring Boot) | — |
| `OPENAI_API_KEY` | Chave da API OpenAI | — |
| `OPENAI_MODEL` | Modelo principal | `gpt-4o` |
| `OPENAI_FALLBACK_MODEL` | Modelo para análises simples | `gpt-4o-mini` |
| `OPENAI_MAX_TOKENS` | Tokens máximos na resposta | `2048` |
| `AI_DB_HOST` | Host do PostgreSQL | `postgres` |
| `PROMETHEUS_URL` | URL do Prometheus | `http://prometheus:9090` |
| `ALLURE_URL` | URL do Allure service | `http://allure:5050` |
| `BACKEND_URL` | URL do Spring Boot | `http://asset-management:8080` |
| `GITHUB_TOKEN` | Token GitHub (escopo `repo:read`) | — |
| `GITHUB_OWNER` | Owner do repositório | — |
| `GITHUB_REPO` | Nome do repositório | — |

### No Spring Boot (`application.yml`)

```yaml
ai:
  service:
    url: ${AI_SERVICE_URL:http://ai-intelligence:3100}
    api-key: ${AI_SERVICE_API_KEY:}
```

### No `.env` raiz

```bash
AI_SERVICE_API_KEY=<gere com: openssl rand -hex 32>
OPENAI_API_KEY=sk-...
GITHUB_TOKEN=ghp_...
GITHUB_OWNER=seu-usuario
GITHUB_REPO=asset-management
```

---

## Segurança e Privacidade de Dados

### O que é mascarado antes de qualquer chamada LLM

O `SensitiveDataMasker` aplica 12 padrões antes de qualquer dado chegar ao OpenAI:

| Tipo | Exemplo | Resultado |
|---|---|---|
| JWT tokens | `Bearer eyJ...` | `Bearer [TOKEN_MASKED]` |
| Credenciais | `password=abc123` | `[CREDENTIAL_MASKED]` |
| Connection strings | `jdbc:postgresql://...` | `[DB_CONNECTION_MASKED]` |
| IPs privados | `10.0.0.5`, `192.168.1.1` | `[PRIVATE_IP]` |
| Chaves AWS | `AKIA...` | `[AWS_KEY_MASKED]` |
| Hashes longos | `a3f4b2...` (32+ chars) | `[HEX_SECRET_MASKED]` |
| E-mails | `user@empresa.com` | `[EMAIL]@empresa.com` |

### Princípios

- Metadados estruturados são preferidos a logs brutos
- Logs brutos são truncados em 300 caracteres por linha
- O serviço AI nunca recebe código-fonte
- A chave OpenAI permanece no servidor (nunca exposta ao frontend)

---

## Redução de Tokens — SDD + RTK

### Semantic Data Deduplication (SDD)

Remove informação redundante antes do budget manager:

1. **Exact key dedup** — se dois chunks têm a mesma chave, mantém o de maior score
2. **Flag-to-field demotion** — se `anomalyFlags` já contém `HIGH_LATENCY`, o chunk `http.p95LatencyMs` tem sua relevância reduzida em 30% (não removido, apenas rebaixado)
3. **Array dedup por Jaccard** — mensagens de erro com similaridade > 0.6 são fundidas; duplicatas exatas por `name`/`id`/`uri` são removidas

### Context Budget Manager (RTK-like)

Seleciona chunks dentro de um orçamento de tokens por relevância:

```
score_final = baseRelevance × boost[focus]
```

Exemplo de boosts para `observability`:

| Chunk | baseRelevance | boost | score final |
|---|---|---|---|
| `anomalyFlags` | 0.95 | 2.0 | **1.90** |
| `jvm` | 0.85 | 1.8 | **1.53** |
| `http` | 0.85 | 1.8 | **1.53** |
| `failedTests` | 0.95 | 0.3 | 0.29 |
| `flakyTestNames` | 0.88 | 0.2 | 0.18 |

Os chunks são ordenados por score e incluídos até o orçamento de 2000 tokens ser preenchido.

### Resultado típico (log de debug)

```json
{
  "tokens": {
    "rawEstimate": 8400,
    "afterSdd": 5100,
    "sddReductionPct": "39.3%",
    "finalBudget": 1980,
    "totalReductionPct": "76.4%"
  },
  "includedChunks": ["anomalyFlags", "jvm", "http", "system"],
  "droppedChunks": ["failedTests", "flakyTestNames", "collectionMeta"]
}
```

---

## Sistema Multi-Agent

O endpoint `/api/ai/analysis/multi-agent` executa 4 agentes especializados em paralelo e depois sintetiza os resultados:

```
┌──────────────────┐  ┌──────────────────┐
│  DevOps Agent    │  │  QA Agent        │
│  CI/CD + infra   │  │  Playwright +    │
│  GitHub Actions  │  │  Cucumber tests  │
└────────┬─────────┘  └────────┬─────────┘
         │                     │
         └──────────┬──────────┘
                    │
┌──────────────────┐│ ┌──────────────────┐
│  Backend Agent   ││ │  Architecture    │
│  JVM + HTTP +    ││ │  Agent           │
│  Spring Boot     ││ │  DDD + domínio   │
└────────┬─────────┘│ └────────┬─────────┘
         │           │          │
         └─────────────────────┘
                    │
                    ▼
            Synthesis Agent
         (cross-cutting concerns
          + prioritized actions)
```

Cada agente usa o `ContextPipeline` com budget de **1200 tokens** (mais restrito para evitar saturar a cota da API com 4 chamadas simultâneas) e o modelo fallback (`gpt-4o-mini`).

---

## Executar em Desenvolvimento Local

```bash
cd ai-intelligence
npm install

# Copie e configure as variáveis
cp .env.example .env
# Edite: OPENAI_API_KEY, AI_SERVICE_API_KEY

# Modo dev (hot reload)
npm run dev

# Build de produção
npm run build

# Typecheck
npx tsc --noEmit
```

Com Docker Compose:

```bash
docker compose up ai-intelligence --build
```

Health check: `curl http://localhost:3100/health`

---

## Exemplo de Resposta — Observability

```json
{
  "metadata": {
    "analysisId": "550e8400-e29b-41d4-a716-446655440000",
    "type": "observability",
    "status": "completed",
    "model": "gpt-4o",
    "tokensUsed": 1847,
    "durationMs": 4230,
    "createdAt": "2025-10-15T14:32:00Z",
    "dataWindowMinutes": 30
  },
  "summary": "Sistema operando com pressão moderada no heap JVM (71%) e pico de latência detectado no endpoint de transferências. Não há degradação crítica imediata.",
  "overallHealthScore": 72,
  "anomalies": [
    {
      "id": "a1",
      "severity": "high",
      "title": "Latência p95 elevada — /api/transfers",
      "description": "Endpoint de transferências com p95 de 2340ms, acima do threshold de 2000ms.",
      "affectedComponent": "TransferController",
      "evidence": "http.topSlowEndpoints[0].p95LatencyMs: 2340"
    }
  ],
  "recommendations": [
    {
      "priority": "immediate",
      "action": "Adicionar índice composto em transfer_requests(status, unit_id, created_at)",
      "rationale": "Query de listagem de transferências pendentes realiza full scan na tabela.",
      "estimatedImpact": "Redução de 60-80% na latência do endpoint /api/transfers"
    }
  ],
  "jvmInsights": {
    "heapUsageTrend": "crescente nos últimos 30 minutos",
    "gcPressure": "medium",
    "threadPoolStatus": "saudável — 45 threads ativas de 200 máximo"
  },
  "httpInsights": {
    "p95LatencyMs": 2340,
    "errorRatePct": 0.8,
    "slowestEndpoints": ["/api/transfers", "/api/assets/depreciation", "/api/reports"]
  }
}
```

---

## Banco de Dados

Resultados são persistidos no schema `ai_intelligence` do mesmo PostgreSQL:

```sql
-- Criado automaticamente na inicialização do serviço
CREATE SCHEMA IF NOT EXISTS ai_intelligence;

CREATE TABLE ai_intelligence.analyses (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id   VARCHAR(36)  NOT NULL UNIQUE,
    type          VARCHAR(30)  NOT NULL,  -- observability | test-intelligence | cicd | incident | risk | multi-agent
    status        VARCHAR(20)  NOT NULL DEFAULT 'completed',
    model         VARCHAR(50),
    tokens_used   INTEGER,
    duration_ms   INTEGER,
    data          JSONB        NOT NULL,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
```

Índices em `type`, `created_at` e `status` para queries de histórico eficientes.
