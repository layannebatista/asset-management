# IA Intelligence — Guia de Uso

> **⚠️ Versão Simplificada:** Foco em RTK (Rust Token Killer) sem dependência de IA paga.

---

## 🎯 O Que É IA Intelligence

Sistema de análise local que otimiza custos de tokens com RTK, sem depender de APIs externas pagas.

### Principal Funcionalidade
**RTK Dashboard** — Mostra economia real de tokens, eficiência de modelos e ROI.

📊 **Dashboard:** http://localhost:3100

---

## 📊 RTK Dashboard

### O Dashboard Mostra

#### 1. **Resumo Executivo** (5 KPIs Principais)
- **Tokens Economizados:** Total de tokens reduzidos com RTK
- **USD Economizados:** Quanto dinheiro foi poupado
- **% Redução:** Eficiência de otimização
- **Qualidade:** Acurácia mantida durante otimização
- **Análises:** Quantas análises foram executadas

#### 2. **Economia de Tokens**
Comparação visual: com/sem RTK
- Gráfico de barras mostrando tokens antes e depois
- Economia em USD calculada automaticamente

#### 3. **Eficiência de Modelos**
Ranking de modelos LLM:
- Qual oferece melhor custo-benefício
- Tokens finais e acurácia por modelo
- Recomendações automáticas

#### 4. **ROI por Análise**
Qual tipo de análise economiza mais:
- Observabilidade, Testes, CI/CD, Incidentes
- USD economizado por tipo
- Prioridades de foco

### Dados Coletados Localmente
```
Banco de Dados PostgreSQL
    ↓
token_savings_log (tabela)
    ↓
Dashboard (4 endpoints /api/v1/insights/*)
    ↓
Gráficos + Cards + Tabelas
```

**100% local. Sem APIs externas. Sem IA paga.**

---

## 🔧 Endpoints RTK

### GET /api/v1/insights/token-economy
Economia geral de tokens

```bash
curl -H "X-AI-Service-Key: test_key_123456" \
  http://localhost:3100/api/v1/insights/token-economy?days=30
```

**Retorna:**
```json
{
  "period": { "days": 30 },
  "tokenEconomy": {
    "totalAnalyses": 1250,
    "tokensWithoutRTK": 2500000,
    "tokensWithRTK": 950000,
    "totalTokensSaved": 1550000,
    "savingsPercentage": 62.0
  },
  "financialImpact": {
    "costWithoutOptimization": 1250.00,
    "costWithOptimization": 475.00,
    "usdSaved": 775.00
  },
  "quality": {
    "avgReductionPercentage": 62.0,
    "avgContextAccuracy": 94.5
  }
}
```

---

### GET /api/v1/insights/model-efficiency
Eficiência por modelo LLM

```bash
curl -H "X-AI-Service-Key: test_key_123456" \
  http://localhost:3100/api/v1/insights/model-efficiency?days=30
```

**Retorna:** Lista de modelos com scores de eficiência

---

### GET /api/v1/insights/analysis-roi
ROI por tipo de análise

```bash
curl -H "X-AI-Service-Key: test_key_123456" \
  http://localhost:3100/api/v1/insights/analysis-roi?days=30
```

**Retorna:** Análises ordenadas por ROI%

---

### GET /api/v1/insights/executive-summary
Resumo de uma página para executivos

```bash
curl -H "X-AI-Service-Key: test_key_123456" \
  http://localhost:3100/api/v1/insights/executive-summary?days=30
```

**Retorna:** Summary com insights principais e recomendação

---

## ⚙️ Configuração

### API Key
Definida em `.env`:
```
AI_SERVICE_API_KEY=test_key_123456
```

Use em requisições:
```
X-AI-Service-Key: test_key_123456
```

### Período de Dados
Todo endpoint aceita `?days=X`:
```
?days=7    # Últimos 7 dias
?days=30   # Últimos 30 dias (padrão)
?days=90   # Últimos 90 dias
```

### Banco de Dados
Dados vêm de `token_savings_log`:
```sql
SELECT * FROM token_savings_log
WHERE timestamp >= NOW() - INTERVAL '30 days'
```

---

## 📈 Exemplos Práticos

### Cenário 1: Executivo Quer Saber ROI
```bash
curl -H "X-AI-Service-Key: test_key_123456" \
  http://localhost:3100/api/v1/insights/executive-summary?days=30

# Response mostra:
# - Total salvo: $775
# - Recomendação: Manter RTK em produção ✅
```

### Cenário 2: Qual Modelo Escolher
```bash
curl -H "X-AI-Service-Key: test_key_123456" \
  http://localhost:3100/api/v1/insights/model-efficiency?days=30

# Mostra todos os modelos
# Claude: 95% qualidade, $0.0006/análise ← MELHOR
# GPT-4o: 93% qualidade, $0.0008/análise
# GPT-4o-mini: 89% qualidade, $0.0004/análise
```

### Cenário 3: Qual Análise Focussar
```bash
curl -H "X-AI-Service-Key: test_key_123456" \
  http://localhost:3100/api/v1/insights/analysis-roi?days=30

# Mostra ROI por tipo
# Observabilidade: 78.5% ROI ← PRIORIDADE
# Testes: 72.3% ROI
# CI/CD: 65.8% ROI ← REVISAR
```

---

## 🗂️ Analisadores Opcionais

> ⚠️ **Opcional:** Estes recursos podem ser ativados se você tiver serviços externos configurados.

### Se Tiver Prometheus
Ativar análise de observabilidade real de métricas.

**Requisito:** `PROMETHEUS_URL=http://prometheus:9090`

### Se Tiver GitHub Actions
Ativar análise de CI/CD com dados de workflows.

**Requisito:** `GITHUB_TOKEN`, `GITHUB_OWNER`, `GITHUB_REPO`

### Se Precisar de IA
Ativar análises automáticas com LLM.

**Requisito:** `OPENAI_API_KEY` ou `ANTHROPIC_API_KEY`

> **Recomendação:** Use apenas se realmente necessário. RTK Dashboard funciona 100% sem isso.

---

## 🔍 Dados Coletados

### Cada Análise Registra
```
timestamp          → Quando foi executada
analysis_type      → Tipo (observability, test, etc)
model              → LLM usado (claude, gpt-4, etc)
raw_tokens         → Tokens SEM RTK
final_tokens       → Tokens COM RTK
total_reduction_pct → % de economia
context_accuracy_pct → Qualidade mantida
```

### Query Básica
```sql
SELECT
  DATE(timestamp) as data,
  COUNT(*) as execucoes,
  SUM(raw_tokens) as tokens_totais,
  SUM(final_tokens) as tokens_otimizados,
  ROUND(100 * (1 - SUM(final_tokens)::float / SUM(raw_tokens)), 2) as economia_pct
FROM token_savings_log
GROUP BY DATE(timestamp)
ORDER BY data DESC
LIMIT 30;
```

---

## 🎓 Interpretando Dados

### Exemplo: Economia 62%
```
Sem RTK:  2,500,000 tokens × $0.0005 = $1.250
Com RTK:    950,000 tokens × $0.0005 = $  475
Economizado:                             $  775 (62%)
```

### Exemplo: Qualidade 94.5%
```
Redução de tokens: 62%
Acurácia mantida: 94.5%

✅ RTK reduziu tokens MAS não degradou qualidade
```

### Exemplo: ROI 78.5%
```
Tipo: Observabilidade
Execuções: 450
USD Economizado: $285.75
ROI: 78.5% ← ALTA PRIORIDADE

Compare com CI/CD:
ROI: 65.8% ← REVISAR USO
```

---

## 🚀 Como Iniciar

### 1. Acessar Dashboard
```
http://localhost:3100
```

### 2. Se Pedir Chave
```
test_key_123456
```

### 3. Ver Dados
- Resumo executivo carrega automaticamente
- Gráficos aparecem com dados dos últimos 30 dias

### 4. Atualizar
Clique em **🔄 Atualizar Dados**

### 5. Exportar
Clique em **📥 Exportar Relatório**

---

## 📚 Recursos

| Documento | Descrição |
|-----------|-----------|
| [RTK Dashboard](./rtk-dashboard-pt-br.md) | Guia completo do dashboard |
| [RTK Unificado](../rtk/rtk-guia-unificado-pt-br.md) | Tudo sobre RTK |
| [Database Schema](../architecture/database-schema-pt-br.md) | Estrutura de dados |

---

## ⚠️ Limitações

- **Sem IA Paga:** Dashboard não depende de APIs externas
- **Local Only:** Todos os dados em PostgreSQL
- **30 Dias:** Dashboard mostra últimos 30 dias por padrão
- **Analisadores Opcionais:** Outras análises requerem serviços externos

---

## 🔄 Atualizações

- **Dashboard:** Atualiza a cada refresh (~2 segundos)
- **Dados:** Novos registros aparecem automaticamente na próxima query
- **Gráficos:** Regenerados com dados mais recentes

---

**Versão:** 2.0 - Simplificada para RTK  
**Última atualização:** Abril 2026  
**Status:** ✅ Produção  
**Foco:** Economia de tokens sem IA paga
