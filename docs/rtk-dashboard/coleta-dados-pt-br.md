# Como o RTK Dashboard Coleta Dados

## 📊 Visão Geral

O RTK Dashboard coleta dados **reais** de economia de tokens de um banco de dados PostgreSQL, sem depender de APIs pagas de IA.

```
[Sistema gera dados] → [PostgreSQL] → [API RTK] → [Dashboard Visual]
```

---

## 🔄 Fluxo de Coleta de Dados

### 1. **Geração dos Dados** (Fora do RTK Dashboard)

Os dados originam de **qualquer sistema que use RTK** (Rust Token Killer):

- Quando uma análise é executada com RTK ativo
- Sistema calcula:
  - **raw_tokens**: Tokens ANTES da otimização
  - **final_tokens**: Tokens APÓS a otimização RTK
  - **total_reduction_pct**: Percentual de redução
  - **context_accuracy_pct**: Qualidade mantida (0-100%)

### 2. **Armazenamento** (PostgreSQL)

Dados são inseridos na tabela `token_savings_log`:

```sql
CREATE TABLE token_savings_log (
  id SERIAL PRIMARY KEY,
  analysis_id UUID NOT NULL,
  analysis_type VARCHAR(50) NOT NULL,  -- Ex: "Observabilidade", "Teste"
  model VARCHAR(100) NOT NULL,          -- Ex: "claude-3-5-sonnet"
  raw_tokens INT NOT NULL,              -- Tokens sem RTK
  final_tokens INT NOT NULL,            -- Tokens com RTK
  context_accuracy_pct FLOAT NOT NULL,  -- Qualidade mantida
  timestamp TIMESTAMP DEFAULT NOW()
);
```

**Quando ocorre a inserção?**
- ✅ Imediatamente após cada análise completar
- ✅ Dados reais (não simulados)
- ✅ Sem delay ou cache intermediário

### 3. **Consumo dos Dados** (APIs RTK)

O RTK Dashboard oferece 5 endpoints que **consultam PostgreSQL em tempo real**:

| Endpoint | O que faz | Frequência |
|----------|-----------|-----------|
| `/api/v1/insights/token-economy` | Soma tokens economizados | A cada chamada da API |
| `/api/v1/insights/model-efficiency` | Agrupa por modelo | A cada chamada da API |
| `/api/v1/insights/analysis-roi` | Agrupa por tipo de análise | A cada chamada da API |
| `/api/v1/insights/executive-summary` | Resumo com KPIs | A cada chamada da API |
| `/api/v1/insights/history` | Agregação semanal | A cada chamada da API |

**Cada chamada:**
- 🔍 Consulta PostgreSQL ao vivo
- 📊 Calcula agregações em tempo real
- 🚀 Retorna no máximo em 100-200ms (query otimizada com índices)

### 4. **Exibição no Dashboard** (Frontend)

Frontend JavaScript chama as APIs:

```javascript
// dashboard.js - linha 55-60
const [tokenEconomyRes, modelEfficiencyRes, ...] = await Promise.all([
  fetch('/api/v1/insights/token-economy?days=30'),
  fetch('/api/v1/insights/model-efficiency?days=30'),
  fetch('/api/v1/insights/analysis-roi?days=30'),
  fetch('/api/v1/insights/executive-summary?days=30'),
]);
```

**Se PostgreSQL estiver indisponível:**
- ⚠️ Usa **dados de exemplo** (demo data)
- 📋 Mostra alertas na sidebar
- ✅ Permite visualizar o dashboard mesmo sem dados reais

---

## 🔍 Dados Reais vs Dados de Exemplo

### Dados Reais
- **Fonte**: Tabela `token_savings_log` no PostgreSQL
- **Frequência**: Inserido em tempo real (cada análise)
- **Escopo**: Últimos N dias (padrão: 30)
- **Qualidade**: 100% autêntico

**Exemplo de Query Real:**
```sql
-- Consulta executada para "Token Economy"
SELECT
  COUNT(*) as total_analyses,
  SUM(raw_tokens) as tokens_without_rtk,
  SUM(final_tokens) as tokens_with_rtk,
  SUM(raw_tokens) - SUM(final_tokens) as total_tokens_saved,
  ROUND(100 * (1 - SUM(final_tokens)::float / SUM(raw_tokens)), 2) as savings_percentage
FROM token_savings_log
WHERE timestamp >= NOW() - INTERVAL '30 days'
```

### Dados de Exemplo (Fallback)
- **Quando aparece**: Se PostgreSQL não estiver disponível
- **Fonte**: Hardcoded em `dashboard.js` (função `getDemoData()`)
- **Finalidade**: Demonstração e testes
- **Indicador**: Sidebar mostra "🔴 Banco de Dados: Offline"

**Valores de exemplo:**
```javascript
{
  totalAnalyses: 1250,
  tokensWithoutRTK: 2500000,
  tokensWithRTK: 950000,
  totalTokensSaved: 1550000,
  savingsPercentage: 62.0
}
```

---

## ⏱️ Frequência de Atualização

### Inserção de Dados
- **Quando**: Após cada análise completar
- **Latência**: < 100ms
- **Automático**: Sim (sistema externo registra)

### Consulta do Dashboard
- **Quando**: User clica em "Atualizar Dados" ou carrega a página
- **Padrão**: 30 últimos dias
- **Customizável**: Sim (parâmetro `?days=N`)

### Período de Análise
```javascript
// dashboard.js - linha 51
const days = 30;  // Padrão: últimos 30 dias

// Na URL:
GET /api/v1/insights/token-economy?days=90  // Customizar para 90 dias
```

---

## 📈 Agregações e Cálculos

### Token Economy
```
Economia = raw_tokens - final_tokens
Redução% = (Economia / raw_tokens) × 100
USD Economizado = Economia × $0.0005
```

### Model Efficiency
```
Agrupado por: model
Ordenado por: efficiency_ratio (qualidade / custo)
```

### Analysis ROI
```
ROI% = AVG(total_reduction_pct) por tipo de análise
Recomendação: ALTA (ROI > 70%) ou REVISAR (ROI < 70%)
```

### Executive Summary
```
Agregações de todas as acima em um resumo executivo
Recomendação estratégica baseada em trending
```

---

## 🔐 Autenticação e Acesso

### APIs Protegidas
- Requerem `X-AI-Service-Key` header (opcional para testes)
- Middleware: `requireApiKey` (suporta fallback se key inválida)

### Dashboard Público
- `GET /` — Dashboard visual (sem autenticação)
- `GET /swagger-ui.html` — OpenAPI docs (sem autenticação)

---

## 💾 Retenção de Dados

### PostgreSQL
- **Tabela**: `token_savings_log`
- **Retenção**: Indefinida (sem limpeza automática)
- **Crescimento**: ~1KB por análise registrada
- **Índices**: 4 índices para otimizar queries (analysis_id, timestamp, type+timestamp, model+timestamp)

### Frontend Cache
- **Cache**: Nenhum (sempre dados fresh)
- **Armazenamento**: LocalStorage (apenas API key do usuário)

---

## ⚙️ Configuração Necessária

Para que o RTK Dashboard funcione com dados reais, precisa de:

### PostgreSQL
```env
DB_HOST=localhost
DB_PORT=5433
DB_NAME=asset_management
DB_USER=asset_user
DB_PASSWORD=asset123
```

### Dados
- Sistema externo inserindo em `token_savings_log`
- Nenhum script de inicialização de dados (dados vêm de fora)

### Verificar Saúde
```bash
# Health check
curl http://localhost:3100/health

# Token Economy (real)
curl http://localhost:3100/api/v1/insights/token-economy?days=30

# Se retornar "tokensWithRTK": 0, significa sem dados ainda
```

---

## 📝 Resumo

| Aspecto | Detalhes |
|---------|----------|
| **Origem dos dados** | PostgreSQL (tabela `token_savings_log`) |
| **Como chegam lá** | Sistema externo insere após cada análise |
| **Tempo real?** | Sim — <100ms entre análise e armazenamento |
| **Dados reais ou demo?** | Reais (demo apenas se BD estiver offline) |
| **Frequência da API** | A cada chamada (sem cache) |
| **Período padrão** | 30 últimos dias |
| **Retenção** | Indefinida |
| **Atualização manual** | Sim — botão "🔄 Atualizar Dados" no sidebar |

---

**Conclusão**: O RTK Dashboard é um **visualizador de dados reais** do PostgreSQL, não um processador de IA. Todos os dados vêm de análises que já completaram com RTK ativo. Zero dependência de APIs pagas.

