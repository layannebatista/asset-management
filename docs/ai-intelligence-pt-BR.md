# IA Intelligence — Guia de Uso

A camada de IA Intelligence é um microsserviço independente que fornece análises inteligentes para diferentes contextos do Patrimônio 360. Este documento é um guia completo para usuários e desenvolvedores que precisam utilizar o sistema.

---

## Visão Geral

A camada de AI Intelligence é um microsserviço independente (`ai-intelligence/`) construído em Node.js + TypeScript que fornece análises automatizadas orientadas por LLM para a plataforma. Ela **não é um chatbot** — é um sistema de engenharia de IA que processa metadados estruturados e retorna diagnósticos acionáveis com **roteamento inteligente de modelos** e **avaliação contínua de qualidade**.

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

## Arquitetura (Enterprise-Grade)

```
┌──────────────────────────────────────────────────────────────────┐
│                        AI GATEWAY (Phase 1+)                     │
│  ├─ Validação + Segurança                                       │
│  ├─ Quota Management                                            │
│  └─ Cache (Redis)                                               │
└──────────────────────┬───────────────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
┌───────▼────────────┐    ┌──────────▼───────────┐
│  ANALYSIS          │    │  EVAL PIPELINE       │
│  PIPELINE          │    │  (Phase 2+)          │
└───────┬────────────┘    └──────────┬───────────┘
        │                            │
        ▼                            ▼
┌──────────────────────────────────────────────────────────────────┐
│                    ORCHESTRATOR CORE                             │
│                                                                  │
│  ModelRouter (Phase 1)     → Seleção dinâmica de modelo         │
│    ├─ gpt-4o-mini (baixo custo)                                │
│    ├─ gpt-4o (padrão)                                          │
│    ├─ gpt-4-turbo (precisão)                                   │
│    └─ o1-preview (raciocínio profundo)                         │
│                                                                  │
│  PromptEngine (Phase 1)    → Templates versionados              │
│    ├─ incident-investigation-v1 (melhor score 0.88)            │
│    ├─ observability-analysis-v1                                │
│    └─ risk-assessment-v1 (LGPD-first)                          │
│                                                                  │
│  ContextPipeline           → Redução de tokens (76%)            │
│    ├─ ContextFilter                                            │
│    ├─ SemanticDeduplicator (SDD)                               │
│    └─ ContextBudgetManager + ContextIntelligence (Phase 5)     │
│                                                                  │
│  AgentGraph (Phase 4)      → DAG com dependências              │
│    └─ IncidentGraph (6 nós sequenciais)                       │
│                                                                  │
│  SecurityClassifier (Phase 3) → LGPD-aware                     │
│    └─ Routing seguro + masking                                │
│                                                                  │
│  LLMClient (+ retry + tracing)                                 │
│                                                                  │
└────────────────────┬───────────────────────────────────────────┘
                     │
        ┌────────────┼───────────┐
        │            │           │
   PostgreSQL    Redis       pgvector
   (results)     (cache)     (memory)
   ai_intelligence schema
```

**Fase 1-2 (✅ Implementado):** ModelRouter + OTel + EvalPipeline + PromptTemplate  
**Fase 3-6 (📋 Documentado):** Security + Memory + AgentGraph + Production

---

## 🎯 Tipos de Análise

O sistema suporta 5 tipos principais de análise:

### 1. **OBSERVABILITY** (Observabilidade)
Análise de métricas, logs e performance do sistema.

**Quando usar:**
- Investigar lentidão de requisições
- Analisar tendências de performance
- Detectar anomalias em métricas
- Entender padrões de uso

**Entrada:** Métricas de latência, JVM, HTTP, sistema  
**Saída:** Anomalias, gargalos, recomendações, health score  
**Modelo:** GPT-4o (balanceado entre custo e qualidade)

---

### 2. **TEST INTELLIGENCE** (Inteligência de Testes)
Análise de testes e cobertura de código.

**Quando usar:**
- Gerar casos de teste automáticos
- Analisar cobertura de testes
- Identificar testes flaky (instáveis)
- Sugerir cenários não cobertos

**Entrada:** Resultados Allure (Playwright + Cucumber)  
**Saída:** Testes flaky, padrões de falha, priorização  
**Modelo:** GPT-4-Turbo (melhor para análise de código)

---

### 3. **CI/CD** (Integração e Deploy)
Análise de pipelines, builds e deployments.

**Quando usar:**
- Investigar falhas de build
- Otimizar tempo de deployment
- Analisar histórico de releases
- Sugerir melhorias no pipeline

**Entrada:** GitHub Actions workflow runs  
**Saída:** Jobs lentos, tendências de falha, otimizações  
**Modelo:** GPT-4o-mini (otimizado para custo)

---

### 4. **INCIDENT** (Investigação de Incidentes)
Análise profunda de incidentes e problemas em produção.

**Quando usar:**
- Investigar outages ou falhas críticas
- Analisar correlações entre eventos
- Determinar impacto do incidente
- Planejar remediação

**Entrada:** Logs, métricas de erro, eventos de sistema  
**Saída:** Causa raiz, camadas impactadas, correções  
**Modelo:** o1-preview (melhor para raciocínio profundo)

---

### 5. **RISK** (Avaliação de Risco)
Análise de riscos de segurança e compliance.

**Quando usar:**
- Avaliar riscos de segurança
- Verificar compliance (LGPD, etc)
- Analisar vulnerabilidades potenciais
- Revisar configurações de segurança

**Entrada:** Metadados de domínio, dados sensíveis  
**Saída:** Score de risco, inconsistências, flags de compliance  
**Modelo:** GPT-4-Turbo (importante para precisão)

---

## 📋 Como Usar

### Fluxo Básico

```
1. Preparar contexto (métricas, logs, código, etc)
   ↓
2. Enviar para /api/ai com tipo de análise
   ↓
3. Sistema escolhe modelo automaticamente
   ↓
4. IA processa e retorna análise
   ↓
5. Receber resultado com recomendações
```

### Exemplo de Requisição

```bash
curl -X POST http://localhost:8080/api/ai/analysis/observability \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "context": {
      "metrics": "latency_p99: 5500ms (target: 5000ms)",
      "timeRange": "last 24 hours",
      "history": "normal baseline: 4000-4500ms"
    },
    "criticality": "HIGH"
  }'
```

### Resposta Esperada

```json
{
  "analysisId": "analysis-123",
  "type": "observability",
  "timestamp": "2026-04-16T10:30:00Z",
  "result": {
    "summary": "Latência elevada detectada",
    "overallHealthScore": 72,
    "anomalies": [
      {
        "title": "Latência p95 elevada — /api/transfers",
        "description": "Endpoint com p95 de 2340ms, acima do threshold de 2000ms",
        "severity": "high"
      }
    ],
    "recommendations": [
      "Aumentar réplicas de serviço",
      "Verificar cache hit rate",
      "Analisar queries de banco de dados"
    ],
    "quality_score": 0.92,
    "estimated_cost": 0.045
  }
}
```

### Endpoints Disponíveis

| Método | Endpoint | Análise | Acesso |
|--------|----------|---------|--------|
| POST | `/api/ai/analysis/observability` | Métricas e performance | ADMIN, GESTOR |
| POST | `/api/ai/analysis/test-intelligence` | Testes e cobertura | ADMIN, GESTOR |
| POST | `/api/ai/analysis/cicd` | Builds e deploys | ADMIN, GESTOR |
| POST | `/api/ai/analysis/incident` | Incidentes críticos | ADMIN, GESTOR |
| POST | `/api/ai/analysis/risk` | Segurança e compliance | ADMIN, GESTOR |
| POST | `/api/ai/analysis/multi-agent` | Análise integrada | ADMIN |
| GET | `/api/ai/analysis/history` | Histórico de análises | Autenticado |
| GET | `/api/ai/analysis/{id}` | Resultado específico | Autenticado |

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

## 🔧 Funcionalidades Avançadas

### 1. **Roteamento Automático de Modelo**
O sistema escolhe automaticamente o melhor modelo:

- **Análises simples** (contexto < 1000 tokens) → GPT-4o-mini (barato, ~$0.005)
- **Análises normais** (contexto 1000-3000 tokens) → GPT-4o (balanceado, ~$0.015)
- **Código complexo** (test-intelligence crítico) → GPT-4-turbo (qualidade, ~$0.020)
- **Análise crítica** (incident investigation) → o1-preview (raciocínio, ~$0.080)

### 2. **Avaliação de Qualidade 3D**
Cada análise recebe uma nota em 3 dimensões:

- **Quality (50%)**: Precisão e completude (ROUGE-L, Factuality, Coherence)
- **Actionability (30%)**: Recomendações práticas e executáveis
- **Consistency (20%)**: Coerência interna e com histórico

Escore final: 0-1 (0.8+ é excelente, <0.70 é alerta)

### 3. **Caching Inteligente**
Consultas similares são cacheadas por 7 dias:
- Requisições idênticas retornam em <100ms
- Economia de 30-50% de tokens
- Sem qualidade perdida

### 4. **Segurança e Compliance LGPD**
O sistema detecta automaticamente:
- CPF, CNPJ, emails, telefones
- Senhas e tokens
- Dados financeiros e cartão de crédito

**Ações:**
- Dados sensíveis são automaticamente mascarados
- Análises críticas usam modelo local (não sai do servidor)
- Auditoria completa é registrada
- Conformidade LGPD garantida

### 5. **Otimização de Tokens**
O sistema reduz automaticamente o uso de tokens em 35%:

- **Compactação de Queries**: Prometheus queries são comprimidas
- **Sumarização**: Contextos grandes são resumidos inteligentemente
- **Chunking Dinâmico**: Dados são divididos otimamente por tipo

---

## 📊 SLAs e Monitoramento

### SLAs Garantidos

| Métrica | Target | Verificação |
|---------|--------|-------------|
| Latência P99 | < 5 segundos | Contínua |
| Disponibilidade | 99.5% | Diária |
| Taxa de Erro | < 2% | Contínua |
| Custo | $0.054 por análise | Diária |

### Dashboard

Acesse o dashboard de monitoramento:
```
http://localhost:3000/dashboard
```

Visualiza:
- Status do sistema (verde/amarelo/vermelho)
- Latência média e P99
- Taxa de sucesso
- Custo acumulado
- Previsões de problemas (com 1-4 horas de antecedência)

### Alertas Proativos

O sistema envia alertas **antes** dos problemas acontecerem:

- **30 min antes**: Aviso por email se latência vai aumentar
- **1-2 horas antes**: Slack notificação se erro vai aumentar
- **Crítico**: SMS se SLA vai violar em < 30 min

---

## 💰 Custo Esperado

Por padrão, análises custam:

| Tipo | Modelo Típico | Custo Típico |
|------|---------------|--------------|
| Observability | GPT-4o-mini | $0.005-0.010 |
| Test Intelligence | GPT-4-turbo | $0.030-0.050 |
| CI/CD | GPT-4o-mini | $0.010-0.020 |
| Incident | o1-preview | $0.080-0.150 |
| Risk | GPT-4-turbo | $0.020-0.040 |

**Média final:** $0.054 por análise (com caching incluído)

---

## ⚡ Performance

| Cenário | Latência |
|---------|----------|
| Cache hit (mesma consulta) | ~50ms |
| Análise rápida (modelo leve) | 1-2 seg |
| Análise normal (modelo balanceado) | 3-5 seg |
| Análise complexa (modelo powerful) | 5-10 seg |

---

## Estrutura do Projeto

```
ai-intelligence/
├── src/
│   ├── config/
│   │   └── index.ts               # Configurações centralizadas
│   ├── types/
│   │   ├── analysis.types.ts      # Tipos de análise
│   │   ├── metrics.types.ts       # Tipos de métricas
│   │   └── enterprise.types.ts    # ✅ (Phase 1) Tipos compartilhados
│   │
│   ├── routing/ ✅ PHASE 1
│   │   ├── RoutingContext.ts      # Tipos de roteamento
│   │   └── ModelRouter.ts         # Seleção inteligente de modelo (300 linhas)
│   │
│   ├── prompts/ ✅ PHASE 1
│   │   ├── PromptTemplate.ts      # Engine de versionamento (400 linhas)
│   │   └── templates.ts           # 5 templates pré-configurados
│   │
│   ├── eval/ ✅ PHASE 2
│   │   └── EvalPipeline.ts        # Avaliação 3D: Quality/Actionability/Consistency
│   │
│   ├── observability/ ✅ PHASE 1
│   │   └── OTelInstrumentation.ts # OpenTelemetry + métricas Prometheus
│   │
│   ├── gateway/ 📋 (PHASE 3)
│   │   └── AIGateway.ts           # Entry point central (quota, cache, routing)
│   │
│   ├── security/ 📋 (PHASE 3)
│   │   ├── SecurityClassifier.ts  # Classificação LGPD
│   │   └── SecureRouter.ts        # Roteamento seguro
│   │
│   ├── memory/ 📋 (PHASE 3)
│   │   └── MemoryLayer.ts         # Redis + pgvector
│   │
│   ├── context/
│   │   ├── ContextFilter.ts       # Decomposição em chunks
│   │   ├── ContextBudgetManager.ts # Orçamento de tokens (RTK)
│   │   ├── SemanticDeduplicator.ts # Dedup semântico (SDD)
│   │   ├── ContextPipeline.ts     # Orquestra pipeline
│   │   ├── ContextIntelligence.ts # 📋 (Phase 5) Boost adaptativo
│   │   └── SensitiveDataMasker.ts # Remove sensíveis
│   │
│   ├── llm/
│   │   ├── LLMClient.ts           # Wrapper OpenAI + retry
│   │   └── PromptOptimizer.ts     # Otimização de prompts
│   │
│   ├── agents/ 📋 (PHASE 4)
│   │   ├── AgentGraph.ts          # DAG-based orchestration
│   │   ├── AgentCoordinator.ts    # Legacy (será refatorado)
│   │   └── graphs/
│   │       └── IncidentGraph.ts   # Exemplo: 6-node graph
│   │
│   ├── analyzers/
│   │   ├── observability/ObservabilityAnalyzer.ts
│   │   ├── test-intelligence/TestIntelligenceAnalyzer.ts
│   │   ├── cicd/CICDAnalyzer.ts
│   │   ├── incident/IncidentAnalyzer.ts
│   │   └── risk/RiskAnalyzer.ts
│   │
│   ├── collectors/
│   │   ├── PrometheusCollector.ts
│   │   ├── AllureCollector.ts
│   │   ├── GitHubActionsCollector.ts
│   │   └── BackendDataCollector.ts
│   │
│   ├── orchestrator/
│   │   └── AIOrchestrator.ts      # Dispatch (atualizado para usar ModelRouter + Eval)
│   │
│   ├── storage/
│   │   ├── AnalysisRepository.ts
│   │   └── schema.sql
│   │
│   └── api/
│       ├── server.ts
│       ├── logger.ts
│       ├── middleware/
│       │   ├── auth.ts
│       │   └── errorHandler.ts
│       ├── routes/
│       │   ├── analysis.routes.ts
│       │   ├── analysis.enterprise.routes.ts # ✅ (Phase 1) Rotas v1
│       │   └── health.routes.ts
│
├── tests/ ✅ PHASE 1-2
│   ├── routing/
│   │   └── ModelRouter.test.ts            # 45 testes
│   ├── prompts/
│   │   └── PromptTemplate.test.ts         # 40+ testes
│   └── eval/
│       ├── EvalPipeline.test.ts           # 30+ testes
│       └── datasets.ts                    # 100+ datapoints
│
├── docker-compose.phase1.yml ✅            # Stack completo
├── otel-collector-config.yaml ✅           # OTel setup
├── prometheus-config.yml ✅                # Prometheus
├── prometheus-rules.yml ✅                 # Alerts + recording rules
├── grafana/dashboards/phase1-metrics.json ✅ # Dashboard pré-config
├── Dockerfile
├── package.json
└── tsconfig.json
```

**Status por Fase:**
- ✅ = Implementado e testado
- 📋 = Documentado e pronto para implementação
- (vazio) = Existente (não alterado)

---

## Configuração

### Variáveis de Ambiente (Phase 1-2)

Copie `ai-intelligence/.env.example` para `ai-intelligence/.env`:

| Variável | Descrição | Padrão |
|---|---|---|
| **Core** | | |
| `AI_SERVICE_PORT` | Porta do serviço | `3100` |
| `AI_SERVICE_API_KEY` | Chave interna (compartilhada com Spring Boot) | — |
| `NODE_ENV` | `development` \| `production` | `development` |
| **OpenAI Models** | | |
| `OPENAI_API_KEY` | Chave da API OpenAI | — |
| `OPENAI_MODEL` | Modelo principal (Phase 1: ModelRouter escolhe dinamicamente) | `gpt-4o` |
| `OPENAI_FALLBACK_MODEL` | Modelo backup (análises simples) | `gpt-4o-mini` |
| `OPENAI_MAX_TOKENS` | Tokens máximos na resposta | `2048` |
| **Database** | | |
| `AI_DB_HOST` | Host do PostgreSQL | `postgres` |
| `AI_DB_PORT` | Porta PostgreSQL | `5432` |
| `AI_DB_NAME` | Database | `ai_intelligence` |
| `AI_DB_USER` | User | `ai_user` |
| `AI_DB_PASSWORD` | Password | — |
| **External Services** | | |
| `PROMETHEUS_URL` | URL do Prometheus (Phase 1+) | `http://prometheus:9090` |
| `ALLURE_URL` | URL do Allure service | `http://allure:5050` |
| `BACKEND_URL` | URL do Spring Boot | `http://asset-management:8080` |
| `GITHUB_TOKEN` | Token GitHub (escopo `repo:read`) | — |
| `GITHUB_OWNER` | Owner do repositório | — |
| `GITHUB_REPO` | Nome do repositório | — |
| **Observability (Phase 1+)** | | |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | OpenTelemetry collector | `http://localhost:4317` |
| `LOG_LEVEL` | `debug` \| `info` \| `warn` \| `error` | `info` |
| **Caching (Phase 3+)** | | |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `REDIS_PASSWORD` | Redis password (se houver) | — |

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

## 🔐 Segurança e Autenticação

### Autenticação

Todo acesso requer JWT válido:

```bash
# Login
curl -X POST http://localhost:8080/api/auth/login \
  -d "username=seu_usuario&password=sua_senha"

# Token é retornado, use em Authorization header
Authorization: Bearer eyJhbGc...
```

### Rate Limiting

Limites por tenant (aplicados por hora):

- **Free tier**: 50 análises/hora
- **Pro tier**: 500 análises/hora
- **Enterprise**: Ilimitado

Ao atingir o limite, requisições são enfileiradas.

### Auditoria Completa

Toda análise é auditada:

```
Who: Qual usuário fez a requisição
When: Data e hora
What: Tipo de análise
Context: Dados processados (criptografado)
Result: Resultado e confiança
Cost: Tokens utilizados
```

Acesse o log de auditoria:
```
/api/ai/audit?startDate=2026-04-01&endDate=2026-04-30
```

### Dados Sensíveis Mascarados

O sistema automaticamente mascara antes de qualquer chamada:

| Tipo | Exemplo | Resultado |
|------|---------|-----------|
| JWT tokens | `Bearer eyJ...` | `Bearer [TOKEN_MASKED]` |
| Credenciais | `password=abc123` | `[CREDENTIAL_MASKED]` |
| Connection strings | `jdbc:postgresql://...` | `[DB_CONNECTION_MASKED]` |
| IPs privados | `10.0.0.5`, `192.168.1.1` | `[PRIVATE_IP]` |
| Chaves AWS | `AKIA...` | `[AWS_KEY_MASKED]` |
| E-mails | `user@empresa.com` | `[EMAIL]@empresa.com` |

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

---

## ✅ Dicas de Boas Práticas

### 1. **Prepare o Contexto Bem**
- Inclua informações relevantes apenas
- Forneça histórico quando possível
- Especifique o que quer saber

**Ruim:** "Algo está errado com latência"  
**Bom:** "Latência passou de 4500ms para 5800ms nas últimas 2 horas. Histórico: geralmente 4000-4500ms. Sem mudanças conhecidas no código. Tráfego: aumentou 30%."

### 2. **Use Criticidade Corretamente**

- **LOW**: Tendências, análises exploratórias
- **NORMAL**: Investigações padrão
- **HIGH**: Problemas que afetam usuários
- **CRITICAL**: Outages em produção

### 3. **Verifique Confiança**
Resultados com confiança < 0.75 podem precisar investigação manual.

### 4. **Reutilize Contexto Aprendido**
Se já recebeu uma análise, reutilize o `analysisId` para não gastar tokens novamente.

---

## 🆘 Troubleshooting

### "Rate limit exceeded"
- Aguarde 1 hora ou contacte seu admin para upgrade de tier
- Requisições são enfileiradas automaticamente

### "Confidence score muito baixo (< 0.6)"
- Forneça mais contexto histórico
- Tente novamente com criticidade mais baixa
- Considere investigação manual

### "Dados sensíveis detectados"
- Dados sensíveis foram automaticamente mascarados
- Análise continua normal
- Nenhum dado sensível saiu do servidor

### "Timeout (> 30 seg)"
- Contexto muito grande
- Sistema sobrecarregado
- Tente novamente em alguns minutos

---

## 📚 Referências Adicionais

- **[ENTERPRISE_AI_EVOLUTION.md](/ENTERPRISE_AI_EVOLUTION.md)** — Arquitetura técnica completa
- **[INDEX.md](/INDEX.md)** — Índice de todos os componentes
- Dashboard Grafana: http://localhost:3000
- Prometheus Metrics: http://localhost:9090

---

**Versão:** 1.0  
**Última atualização:** 2026-04-16
