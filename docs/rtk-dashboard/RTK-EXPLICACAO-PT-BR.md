# RTK — O que é e Como Funciona

> **RTK = Rust Token Killer**  
> Sistema local de otimização de tokens. Sem dependência de IA paga. Sem APIs externas.

---

## ❓ Por Que "ia-intelligence"?

O nome `ai-intelligence` é histórico — o projeto começou como um sidecar de IA Intelligence. Mas a evolução foi:

1. **Antes:** Sidecar com múltiplas análises (Observability, Test, CI/CD, Incident, Risk)
2. **Problema:** Dependia de IA paga, resultados inúteis, complexo
3. **Solução:** Focar em RTK — otimização de tokens local
4. **Hoje:** Dashboard RTK, dados 100% locais

**O nome `ai-intelligence` permanece por compatibilidade, mas o sistema é 100% RTK.**

---

## 🎯 O Que RTK Faz

### Antes de RTK
```
Você executa uma análise
  ↓
LLM processa TODOS os tokens
  ↓
Custo alto, muitos tokens desperdiçados
```

### Com RTK
```
Você executa uma análise
  ↓
RTK reduz tokens desnecessários
  ↓
LLM processa apenas tokens importantes
  ↓
Custo baixo, qualidade mantida
```

---

## 💡 Exemplo Prático

### Análise de Observabilidade

**Sem RTK:**
```
Entrada: Métricas de sistema (10MB de dados)
Tokens necessários: 2.500.000
Custo: R$ 12,50
Resultado: ✅ Excelente qualidade
```

**Com RTK:**
```
Entrada: Métricas de sistema (10MB de dados)
RTK remove 62% de dados redundantes
Tokens necessários: 950.000
Custo: R$ 4,75
Resultado: ✅ Mesma qualidade, 62% mais barato
```

**Economia: R$ 7,75 (62% de economia)**

---

## 📊 Dashboard RTK

O dashboard mostra 4 métricas principais:

### 1. **Resumo Executivo**
- Tokens economizados em número absoluto
- Custo em reais economizado
- % de redução de tokens
- Qualidade mantida (acurácia)
- Quantidade de análises

### 2. **Economia de Tokens**
- Tokens sem otimização vs com RTK
- Custos em reais
- Diferença visual

### 3. **Eficiência de Modelos**
- Qual modelo (Claude, GPT, etc) economiza mais
- Qual oferece melhor custo-benefício
- Recomendações automáticas

### 4. **ROI Por Análise**
- Qual tipo de análise economiza mais (Observability > Test > CI/CD)
- Prioridades de foco
- Total economizado em 30 dias

---

## 🔢 Valores em Reais

Todas as conversões usam:
```
1 USD = 5.00 BRL (câmbio 23/04/2026)
1 token = 0.0005 USD = 0.0025 BRL
```

### Exemplos

| Tokens | USD | BRL |
|--------|-----|-----|
| 1.000 | $0.50 | R$ 2,50 |
| 10.000 | $5.00 | R$ 25,00 |
| 1.000.000 | $500 | R$ 2.500 |

---

## 🎯 Caso de Uso

### Você é um Gestor
**Pergunta:** "Vale a pena usar RTK?"

**Dashboard mostra:**
- 1.550.000 tokens economizados (62%)
- R$ 3.875,00 economizados
- 94.5% de qualidade mantida
- Recomendação: ✅ SIM, manter em produção

**Conclusão:** RTK economiza dinheiro sem degradar qualidade.

---

### Você é um Dev
**Pergunta:** "Qual modelo devo usar?"

**Dashboard mostra:**
- Claude: R$ 0,0030 por análise (95% qualidade)
- GPT-4o: R$ 0,0040 por análise (93% qualidade)
- GPT-4o-mini: R$ 0,0020 por análise (89% qualidade)

**Conclusão:** Se quer qualidade, use Claude. Se quer economizar, use GPT-4o-mini.

---

### Você é um CFO
**Pergunta:** "Quanto economizamos?"

**Dashboard mostra:**
- Total: R$ 3.875,00 economizados em 30 dias
- Por análise: ~R$ 3,10 economizados
- ROI: 7.75x (se RTK custa R$ 500/mês)

**Conclusão:** RTK é investimento que se paga em 3 dias.

---

## 📱 Acessar Dashboard

```
http://localhost:3100
```

**Dados mostrados automaticamente:**
- Últimos 30 dias
- De: token_savings_log (PostgreSQL)
- Atualizado a cada refresh

**Chave (se pedir):**
```
test_key_123456
```

---

## ⚙️ Técnico

### Como RTK Economiza Tokens

**Passo 1: Coleta**
```
Entrada: Logs, métricas, eventos
Tamanho: 10MB de dados brutos
```

**Passo 2: Análise**
```
RTK analisa cada chunk de dados
Remove duplicatas
Remove dados irrelevantes
Rank por importância (score de relevância)
```

**Passo 3: Seleção**
```
Budget total: 2.000 tokens (configurável)
RTK seleciona os 2.000 tokens mais importantes
Descarta o resto
```

**Passo 4: Resultado**
```
Tokens selecionados: 950.000 (37,5% do original)
Tokens economizados: 1.550.000 (62,5%)
Qualidade: 94,5% (mantida)
```

---

## 🔄 Fluxo de Dados

```
┌──────────────────────────────┐
│     PostgreSQL               │
│   token_savings_log          │
│ (raw_tokens, final_tokens)   │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│   Insights API               │
│  /api/v1/insights/*          │
│ (4 endpoints)                │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│     RTK Dashboard            │
│   localhost:3100             │
│ (4 seções com 20+ cards)     │
└──────────────────────────────┘
```

---

## 📈 Dados Coletados

Cada análise automaticamente registra:
```sql
INSERT INTO token_savings_log (
  timestamp,              -- Quando
  analysis_type,          -- Tipo (ainda existem para compatibilidade)
  model,                  -- Qual LLM
  raw_tokens,             -- Tokens sem RTK
  final_tokens,           -- Tokens com RTK
  total_reduction_pct,    -- % economizado
  context_accuracy_pct    -- Qualidade
) VALUES (...)
```

**Frequência:** A cada análise executada

---

## 🔍 Interpretando Dados

### Tokens Economizados: 1.550.000
- Grande = bom
- Significa: RTK economizou 1,55M tokens em 30 dias
- Se não tivesse RTK: teria gasto 2,5M tokens

### Redução: 62%
- 62% de economia
- 38% do original era necessário
- 62% era redundante/desnecessário

### Qualidade: 94.5%
- 94,5% de acurácia mantida
- RTK removeu 62% de tokens MAS manteve 94,5% de qualidade
- Trade-off excelente

### ROI %: 78.5%
- Retorno sobre investimento
- Se Observabilidade custasse $100, economiza $78,5
- Análises com ROI > 70% são prioritárias

---

## ✅ O que Falta

- [ ] Gráficos com histórico (últimos 3 meses)
- [ ] Alertas quando ROI cai
- [ ] Recomendações automáticas
- [ ] Export em PDF
- [ ] Comparação período a período

**Status:** MVP funcional. Roadmap aberto.

---

**Última atualização:** 23/04/2026  
**Câmbio usado:** 1 USD = 5.00 BRL  
**Versão:** 2.0 — RTK Focus
