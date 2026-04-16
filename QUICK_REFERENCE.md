# ⚡ QUICK REFERENCE — Enterprise AI Evolution

## 📋 Arquivos Principais

| Arquivo | Propósito | Ler em | Ação |
|---------|----------|--------|------|
| `ENTERPRISE_AI_EVOLUTION.md` | Design técnico completo | 45 min | Entender proposta |
| `IMPLEMENTATION_CHECKLIST.md` | Plano de execução detalhado | 20 min | Planejar desenvolvimento |
| `AI_ENTERPRISE_EVOLUTION_README.md` | Síntese executiva | 10 min | Quick overview |
| `enterprise.types.ts` | Tipos TypeScript | Copy-paste | Implementar |
| `AIGateway.ts` | Gateway central | Copy-paste | Integrar |
| `analysis.enterprise.routes.ts` | Rotas HTTP | Copy-paste | Servir APIs |

---

## 🏗️ Arquitetura em 30 Segundos

```
REQUEST
  ↓
[AI GATEWAY]
  ├─ Validate (segurança)
  ├─ Check Quota (rate limit)
  ├─ Lookup Cache (Redis)
  ├─ Enhance Context (Memory Layer)
  ├─ Classify Security (PII detection)
  ├─ Route Model (gpt-4o vs 4-turbo vs o1 vs local)
  ├─ Execute (AgentGraph → nodes sequenciais)
  ├─ Evaluate (Quality/Actionability/Consistency)
  ├─ Store Memory (pgvector)
  └─ Return Result
        ↓
      RESPONSE
```

---

## 🎯 Componentes Novos (6)

### 1. **ModelRouter** (Week 1-2)
- Decisão dinâmica: tipo → criticality → context size → modelo
- Exemplo: Incident CRITICAL + 3000 tokens → o1-preview
- Exemplo: Observability LOW + 500 tokens → gpt-4o-mini
- **Ganho:** ↓ 47% custo

### 2. **EvalPipeline** (Week 3-4)
- 3 dimensões: Quality (ROUGE-L) + Actionability + Consistency
- Score: 0-1, threshold mínimo 0.70
- Feedback loop para ajustar prompts
- **Ganho:** ↑ 22% qualidade

### 3. **SecurityClassifier** (Week 5-6)
- Detecta: PII, confidencial, LGPD
- Mascara antes de cloud LLM
- Roteia RESTRICTED → local LLM
- **Ganho:** ✅ LGPD compliance 100%

### 4. **MemoryLayer** (Week 5-6)
- Redis: LRU cache (1h TTL)
- pgvector: semantic search (similarity)
- Retrieves similar past analyses
- Enhances context
- **Ganho:** ↓ 35% cache hits, ↓ tokens

### 5. **AgentGraph** (Week 7-8)
- DAG: nodes com dependências
- Topological sort → execution
- Sequencial (melhor reasoning)
- Exemplo: Incident Graph (6 nodes)
- **Ganho:** ↓ 90% erro análise

### 6. **ContextIntelligence** (Week 9-10)
- Boost chunks baseado em:
  - Success history rate
  - Recency bias
  - Type affinity
  - Query similarity
- **Ganho:** ↑ 5-10% eval score

---

## 📊 Métricas Principais

| O QUÊ | ANTES | DEPOIS | RASTREADO EM |
|-------|-------|--------|-------------|
| Custo/análise | $0.15 | $0.08 | ModelRouter stats |
| Latência p99 | 8s | 4s | OpenTelemetry |
| Eval score | 0.72 | 0.88 | Prometheus |
| Cache hit rate | 0% | 35% | Redis metrics |
| Fallback rate | 12% | 3% | ModelRouter logs |
| LGPD compliance | 40% | 100% | SecurityClassifier |

---

## 🚀 Implementação (12 Semanas)

```
Week 1-2:  ModelRouter + OTel
Week 3-4:  EvalPipeline + Datasets
Week 5-6:  SecurityClassifier + MemoryLayer
Week 7-8:  AgentGraph (DAG)
Week 9-10: ContextIntelligence
Week 11-12: Production Hardening + Rollout
```

---

## 🔑 Decisões Críticas

| O QUÊ | POR QUÊ | IMPACTO |
|-------|---------|--------|
| o1-preview para Incident | Deep reasoning | +15% quality em root cause |
| gpt-4o-mini para Observability | Cost optimization | -60% cost, similar quality |
| Local LLM para RESTRICTED | LGPD | Zero PII exposure |
| Memory + semantic search | Context optimization | -40% tokens, +quality |
| DAG instead of parallel | Better reasoning | -90% erro |
| Eval em 3 dimensões | Comprehensive quality | Detecta issues early |

---

## 🛑 Go/No-Go Criteria (por fase)

### Fase 1 ✅
- [ ] ModelRouter routing accuracy > 95%
- [ ] OTel metrics emitting correctly
- [ ] Cost tracking aligned with actual LLM usage
- [ ] Fallback model working

### Fase 2 ✅
- [ ] Eval score consistency (±2% variance)
- [ ] Datasets covering all analysis types
- [ ] Alerts firing on low scores
- [ ] Model comparison dashboard ready

### Fase 3 ✅
- [ ] SecurityClassifier accuracy > 98% (PII detection)
- [ ] Zero PII in cloud LLM calls
- [ ] Local LLM latency < 3s
- [ ] Memory hit rate > 25%

### Fase 4 ✅
- [ ] AgentGraph execution order correct
- [ ] No cycles in DAG
- [ ] Critical node failure → abort works
- [ ] 6-node graph executes in < 10s

### Fase 5 ✅
- [ ] Boost factor correlation with success rate > 0.8
- [ ] A/B test shows > 5% improvement
- [ ] Type affinity scores converging
- [ ] No regression in eval scores

### Fase 6 ✅
- [ ] Load test: 50 concurrent users, p99 < 5s
- [ ] Error rate < 2% under load
- [ ] Cost per analysis stable
- [ ] Monitoring dashboards live
- [ ] Rollback procedure documented

---

## 📦 Dependencies

```bash
npm install redis pg pgvector
npm install @opentelemetry/sdk-node @opentelemetry/auto-instrumentations-node
npm install winston uuid

# Dev
npm install --save-dev @types/node jest k6
```

---

## 🐳 Infrastructure (docker-compose)

```bash
docker-compose up -d

# Verifica:
- PostgreSQL: localhost:5432
- Redis: localhost:6379
- Prometheus: localhost:9090
- Grafana: localhost:3000 (admin/admin)
- OTel: localhost:4317
```

---

## 🔗 Integração (Express Server)

```typescript
// 1. Criar componentes
const modelRouter = new ModelRouter(logger);
const gateway = await createAIGateway({
  orchestrator,
  modelRouter,
  secureRouter,
  memory,
  redis,
  logger,
});

// 2. Registrar rotas
app.use('/api/v1', createEnterpriseAnalysisRoutes(gateway, logger));

// 3. Pronto!
app.listen(3100);
```

---

## 🧪 Testing (Essential)

```typescript
// Fase 1: routing decision correctness
test('incident CRITICAL → o1-preview', () => {
  const decision = modelRouter.route({ type: 'incident', criticality: 'CRITICAL' });
  expect(decision.modelName).toBe('o1-preview');
});

// Fase 2: eval consistency
test('same input → ±2% score variance', () => {
  const scores = [];
  for (let i = 0; i < 10; i++) {
    scores.push(await eval.evaluate(datapoint));
  }
  expect(variance(scores)).toBeLessThan(0.02);
});

// Fase 3: PII detection
test('PII masked before LLM', () => {
  const classified = await classifier.classify('CPF: 123.456.789-00');
  expect(classified).toBe('RESTRICTED');
});

// Fase 4: DAG execution
test('topological sort correct', () => {
  const graph = createTestGraph();
  const order = graph._topologicalSort();
  expect(order).toEqual(['metrics', 'patterns', 'root_cause', 'mitigation']);
});
```

---

## 📈 Monitoring Checklist

- [ ] Prometheus scraping metrics
- [ ] Grafana dashboards configured
- [ ] Alert rules for:
  - [ ] High latency (p99 > 5s)
  - [ ] Low eval score (< 0.70)
  - [ ] High fallback rate (> 20%)
  - [ ] Budget overage (> 80%)
  - [ ] LLM unavailable

---

## 🚨 Common Issues & Fixes

| Problema | Causa | Fix |
|----------|-------|-----|
| **High latency** | Memory/embedding slow | Cache embeddings (1h TTL) |
| **Low eval scores** | Bad prompt | Review template, A/B test new version |
| **Memory hit miss** | Cache expiry | Increase TTL to 24h, check similarity |
| **DAG cycle** | Wrong dependency | Review graph construction |
| **PII leaked** | Classifier missed pattern | Add pattern, retrain LLM classifier |
| **Quota exceeded** | User spike | Implement back-pressure, throttle |

---

## 📞 Team Alignment

### Responsabilidades
- **Architecture:** Senior AI Architect (você)
- **Backend:** Node.js/TypeScript team
- **DevOps:** PostgreSQL, Redis, Prometheus
- **QA:** Eval datasets, test automation
- **Security:** LGPD audit, penetration testing

### Weekly Sync Topics
1. Phase progress (checklist %)
2. Blockers + how to unblock
3. Metrics trending (cost, latency, quality)
4. Upcoming phase planning

---

## 📝 Prompts Pré-Configurados (Vem com PromptEngine)

```typescript
INCIDENT_INVESTIGATION_V1
├─ System: decision framework (5 questions)
├─ Context: metrics/logs
├─ Rules: CRITICAL mitigation < 30min
└─ Examples: 2 incident cases

OBSERVABILITY_ANALYSIS_V1
├─ System: pattern detection
├─ Context: time series
├─ Rules: confidence > 0.8
└─ Examples: 3 anomaly cases

RISK_ASSESSMENT_V1
├─ System: compliance framework
├─ Context: code/infra
├─ Rules: LGPD-first
└─ Examples: 2 risk cases
```

---

## 🎬 Getting Started (Today)

1. **30 min:** Ler `AI_ENTERPRISE_EVOLUTION_README.md`
2. **30 min:** Ler `ENTERPRISE_AI_EVOLUTION.md` seções 1-2
3. **1h:** Setup docker-compose locally
4. **2h:** Implementar `enterprise.types.ts` + `ModelRouter.ts`
5. **Plan:** Team kickoff meeting

**Total: 5h → você tem uma MVP de ModelRouter rodando localmente**

---

## 🏁 Success = Production Deployment

```
Manual Testing
    ↓
Staging (5% traffic)  [Phase 1-5]
    ↓
Canary (5% prod)      [Day 1-3]
    ↓
Gradual Rollout       [Week 1-2]
    ├─ 5% → 25% → 50% → 100%
    └─ Monitor alerts at each step
    ↓
Full Production       [Week 2-3]
    └─ All users on new system
```

---

## 📚 Learn More

- **OpenTelemetry:** otel.io/docs
- **pgvector:** github.com/pgvector/pgvector
- **LGPD Compliance:** gov.br/cidadania/lgpd
- **LLM Evals:** https://github.com/langchain-ai/langchain/tree/master/libs/evaluation

---

**Last Updated:** 2026-04-16  
**Owner:** Senior AI Architect  
**Status:** Ready for Implementation
