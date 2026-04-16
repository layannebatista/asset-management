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

### Requisição
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

### Endpoints
| Tipo | Endpoint | Acesso |
|------|----------|--------|
| Observability | `/api/ai/analysis/observability` | ADMIN, GESTOR |
| Test Intelligence | `/api/ai/analysis/test-intelligence` | ADMIN, GESTOR |
| CI/CD | `/api/ai/analysis/cicd` | ADMIN, GESTOR |
| Incident | `/api/ai/analysis/incident` | ADMIN, GESTOR |
| Risk | `/api/ai/analysis/risk` | ADMIN, GESTOR |
| Histórico | `/api/ai/analysis/history` | Autenticado |
| Resultado | `/api/ai/analysis/{id}` | Autenticado |

---

## 🔧 Funcionalidades

### Roteamento Automático
O sistema escolhe automaticamente o melhor modelo:
- Contexto pequeno → GPT-4o-mini (barato)
- Contexto médio → GPT-4o (balanceado)
- Código complexo → GPT-4-Turbo (qualidade)
- Análise crítica → o1-preview (raciocínio profundo)

### Qualidade 3D
Cada análise é avaliada em:
- **Quality (50%):** Precisão e completude
- **Actionability (30%):** Recomendações práticas
- **Consistency (20%):** Coerência interna

Escore: 0-1 (0.8+ é excelente)

### Caching
Consultas similares são cacheadas por 7 dias (~50% economia de tokens)

### Segurança LGPD
- Dados sensíveis (CPF, CNPJ, senhas) são automaticamente mascarados
- Análises críticas usam modelos locais
- Auditoria completa de todas as requisições

---

## 📊 SLAs

| Métrica | Target |
|---------|--------|
| Latência P99 | < 5 segundos |
| Disponibilidade | 99.5% |
| Taxa de Erro | < 2% |
| Custo Médio | $0.054/análise |

---

## 💰 Custo por Tipo

| Tipo | Custo Típico |
|------|--------------|
| Observability | $0.005-0.010 |
| Test Intelligence | $0.030-0.050 |
| CI/CD | $0.010-0.020 |
| Incident | $0.080-0.150 |
| Risk | $0.020-0.040 |

---

## 🔐 Autenticação e Rate Limit

**Autenticação:** JWT via `/api/auth/login`

**Limites por hora:**
- Free: 50 análises
- Pro: 500 análises
- Enterprise: Ilimitado

---

## ✅ Boas Práticas

1. **Contexto claro:** Inclua histórico e especifique o que quer saber
2. **Criticidade correta:**
   - LOW: Exploração
   - NORMAL: Investigação padrão
   - HIGH: Afeta usuários
   - CRITICAL: Outage

3. **Confira a confiança:** Resultados < 0.75 podem precisar revisão manual
4. **Reutilize resultados:** Guarde o `analysisId` para não gastar tokens novamente

---

## 🆘 Problemas Comuns

**Rate limit atingido?** Aguarde 1 hora ou contate admin para upgrade

**Confiança baixa?** Forneça mais contexto histórico

**Dados sensíveis detectados?** Foram automaticamente mascarados — análise continua normal

**Timeout?** Contexto muito grande — tente novamente depois

---

## 📞 Suporte

- Dashboard: http://localhost:3000
- Prometheus: http://localhost:9090
- Admin: contato.layanne.batista@gmail.com

---

**Última atualização:** 2026-04-16
