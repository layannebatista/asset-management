# IA Intelligence — Guia de Uso

O sistema de IA Intelligence fornece análises inteligentes automatizadas para diferentes contextos do Patrimônio 360. Ele escolhe automaticamente o melhor modelo de IA e avalia a qualidade de cada resultado.

---

## 🎯 5 Tipos de Análise

### 1. **Observability** — Métricas e Performance
- **Quando usar:** Investigar lentidão, detectar anomalias, analisar tendências
- **Entrada:** Métricas Prometheus (JVM, HTTP, sistema)
- **Saída:** Anomalias, gargalos, recomendações
- **Modelo:** GPT-4o

### 2. **Test Intelligence** — Testes e Cobertura
- **Quando usar:** Gerar testes, analisar cobertura, identificar testes instáveis
- **Entrada:** Resultados Allure (Playwright + Cucumber)
- **Saída:** Testes flaky, padrões de falha, priorização
- **Modelo:** GPT-4-Turbo

### 3. **CI/CD** — Builds e Deployments
- **Quando usar:** Investigar falhas, otimizar pipeline, analisar releases
- **Entrada:** GitHub Actions workflow runs
- **Saída:** Jobs lentos, tendências de falha, otimizações
- **Modelo:** GPT-4o-mini

### 4. **Incident** — Investigação de Problemas
- **Quando usar:** Investigar outages, analisar causa raiz, planejar remediação
- **Entrada:** Logs, métricas de erro, eventos de sistema
- **Saída:** Causa raiz, impacto, correções
- **Modelo:** o1-preview

### 5. **Risk** — Segurança e Compliance
- **Quando usar:** Avaliar riscos, verificar LGPD, analisar vulnerabilidades
- **Entrada:** Metadados de domínio, dados sensíveis
- **Saída:** Score de risco, flags de compliance
- **Modelo:** GPT-4-Turbo

---

## 📋 Como Usar

### 1. Obter Token
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -d "username=seu_usuario&password=sua_senha"
# Resposta: { "token": "eyJhbGc..." }
```

### 2. Enviar Análise
```bash
curl -X POST http://localhost:8080/api/ai/analysis/observability \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "context": {
      "metrics": "latency_p99: 5500ms (target: 5000ms)",
      "timeRange": "last 24 hours"
    },
    "criticality": "HIGH"
  }'
```

### 3. Criticidade
- **LOW:** Exploração, tendências
- **NORMAL:** Investigação padrão
- **HIGH:** Problema que afeta usuários
- **CRITICAL:** Outage em produção

### 4. Resposta
```json
{
  "analysisId": "analysis-123",
  "type": "observability",
  "result": {
    "summary": "Latência elevada detectada",
    "overallHealthScore": 72,
    "anomalies": [
      {
        "title": "Latência p95 elevada",
        "description": "Endpoint com p95 de 2340ms",
        "severity": "high"
      }
    ],
    "recommendations": [
      "Aumentar réplicas de serviço",
      "Verificar cache hit rate"
    ],
    "quality_score": 0.92
  }
}
```

### Endpoints
| Tipo | Endpoint | Acesso |
|------|----------|--------|
| Observability | `/api/ai/analysis/observability` | ADMIN, GESTOR |
| Test Intelligence | `/api/ai/analysis/test-intelligence` | ADMIN, GESTOR |
| CI/CD | `/api/ai/analysis/cicd` | ADMIN, GESTOR |
| Incident | `/api/ai/analysis/incident` | ADMIN, GESTOR |
| Risk | `/api/ai/analysis/risk` | ADMIN, GESTOR |
| Histórico | `/api/ai/analysis/history` | Autenticado |

---

## 🔧 Funcionalidades

**Roteamento Automático:** Sistema escolhe o melhor modelo baseado no contexto

**Qualidade 3D:** Cada análise é avaliada em Quality (50%), Actionability (30%), Consistency (20%)

**Caching:** Consultas similares cacheadas por 7 dias (~50% economia de tokens)

**Segurança LGPD:** Dados sensíveis mascarados automaticamente, análises críticas em modelos locais

---

## 📊 SLAs e Custo

| Métrica | Target |
|---------|--------|
| Latência P99 | < 5s |
| Disponibilidade | 99.5% |
| Taxa de Erro | < 2% |

| Tipo | Custo |
|------|-------|
| Observability | $0.005-0.010 |
| Test Intelligence | $0.030-0.050 |
| CI/CD | $0.010-0.020 |
| Incident | $0.080-0.150 |
| Risk | $0.020-0.040 |
