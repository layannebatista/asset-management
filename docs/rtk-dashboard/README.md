# RTK Dashboard — Documentação

> RTK = **Rust Token Killer** — Sistema local de otimização de tokens

## 📚 Documentos

### 🆕 [Guia Completo](guia-completo-pt-br.md)
Tudo que você precisa saber sobre o RTK Dashboard:
- O que o dashboard mostra
- Endpoints da API
- Exemplos práticos
- Interpretação de dados
- Como começar

### 🔄 [Migração para RTK](MIGRACAO-RTK-PT-BR.md)
O que mudou da versão anterior:
- Mudanças estruturais
- Remoção de analisadores complexos
- Foco em economia de tokens
- Dados antes vs. depois

### 📖 [Explicação RTK](RTK-EXPLICACAO-PT-BR.md)
Entenda o conceito:
- O que é RTK e como funciona
- Casos de uso reais
- Cálculos de economia
- Exemplos práticos com números

## 🚀 Acesso Rápido

**Dashboard:** http://localhost:3100

**API Base:** `http://localhost:3100/api/v1/insights/`

**Endpoints:**
- `/token-economy` — Economia geral de tokens
- `/model-efficiency` — Eficiência dos modelos
- `/analysis-roi` — ROI por tipo de análise
- `/executive-summary` — Resumo executivo
- `/history` — Histórico dos últimos 3 meses

## ⚙️ Configuração

**Variáveis de Ambiente:**
```
AI_SERVICE_PORT=3100
AI_SERVICE_API_KEY=test_key_123456
LOCAL_ONLY_MODE=true
```

## 💡 Conceitos-Chave

- **RTK:** Reduz tokens desnecessários antes de enviar ao LLM
- **Economia:** Mantém qualidade enquanto reduz custos
- **Local:** 100% local, sem APIs externas pagas
- **Dashboard:** Interface visual com métricas de negócio

---

**Versão:** 2.0  
**Status:** ✅ Produção  
**Última atualização:** Abril 2026
