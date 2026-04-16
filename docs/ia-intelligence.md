# 🤖 Guia de IA Intelligence

## Visão Geral

O sistema de IA Intelligence é um microsserviço independente que fornece análises inteligentes para diferentes contextos do Patrimônio 360. Ele opera como um sidecar do backend Spring Boot, acessível através do endpoint `/api/ai`.

O sistema utiliza múltiplos modelos de IA (GPT-4o, GPT-4 Turbo, o1-preview) e escolhe automaticamente o melhor modelo com base no tipo de análise, tamanho do contexto e criticidade da operação.

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

**Exemplo:**
```
Entrada: Métricas de latência dos últimos 7 dias
Saída: Tendências, padrões sazonais, recomendações
```

**Modelo:** GPT-4o (balanceado entre custo e qualidade)

---

### 2. **TEST INTELLIGENCE** (Inteligência de Testes)
Análise de testes e cobertura de código.

**Quando usar:**
- Gerar casos de teste automáticos
- Analisar cobertura de testes
- Identificar pontos de falha em testes
- Sugerir cenários de teste não cobertos

**Exemplo:**
```
Entrada: Código de uma função e seus testes atuais
Saída: Novos casos de teste, análise de gaps
```

**Modelo:** GPT-4 Turbo (melhor para código)

---

### 3. **CI/CD** (Integração e Deploy)
Análise de pipelines, builds e deployments.

**Quando usar:**
- Investigar falhas de build
- Otimizar tempo de deployment
- Analisar histórico de releases
- Sugerir melhorias no pipeline

**Exemplo:**
```
Entrada: Logs de erro de build, histórico de deployments
Saída: Causa provável, passos para resolver
```

**Modelo:** GPT-4o-mini (otimizado para custo)

---

### 4. **INCIDENT** (Investigação de Incidentes)
Análise profunda de incidentes e problemas em produção.

**Quando usar:**
- Investigar outages ou falhas críticas
- Analisar correlações entre eventos
- Determinar impacto do incidente
- Planejar remediação

**Exemplo:**
```
Entrada: Métricas de erro, logs de erro, eventos de sistema
Saída: Causa raiz, impacto, plano de remedação
```

**Modelo:** o1-preview (melhor para raciocínio complexo)

---

### 5. **RISK** (Avaliação de Risco)
Análise de riscos de segurança e compliance.

**Quando usar:**
- Avaliar riscos de segurança
- Verificar compliance (LGPD, etc)
- Analisar vulnerabilidades potenciais
- Revisar configurações de segurança

**Exemplo:**
```
Entrada: Dados sensíveis em um contexto, políticas de acesso
Saída: Riscos identificados, recomendações de mitigação
```

**Modelo:** GPT-4 Turbo (importante para precisão)

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
curl -X POST http://localhost:8080/api/ai/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "type": "observability",
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
    "analysis": {
      "current_trend": "increasing",
      "root_causes": ["Aumento de tráfego", "Sem problemas aparentes no serviço"],
      "confidence": 0.85
    },
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

---

## 🔧 Funcionalidades Avançadas

### 1. **Roteamento Automático de Modelo**
O sistema escolhe automaticamente o melhor modelo:

- **Análises simples** (tipo: observability, contexto < 1000 tokens) → GPT-4o-mini (barato)
- **Análises normais** (contexto 1000-3000 tokens) → GPT-4o (balanceado)
- **Código complexo** (test-intelligence crítico) → GPT-4-turbo (melhor qualidade)
- **Análise crítica** (incident investigation) → o1-preview (raciocínio profundo)

### 2. **Avaliação de Qualidade**
Cada análise recebe uma nota em 3 dimensões:

- **Quality (50%)**: Precisão e completude da análise
- **Actionability (30%)**: Quão prática são as recomendações
- **Consistency (20%)**: Coerência interna da análise

Escore final: 0-1 (0.8+ é excelente)

### 3. **Caching Inteligente**
Consultas similares são cacheadas por 7 dias:
- Requisições idênticas retornam em <100ms
- Economia de 30-50% de tokens
- Sem qualidade perdida

### 4. **Segurança e Compliance**

#### Detecção de Dados Sensíveis
O sistema detecta automaticamente:
- CPF, CNPJ
- Emails, telefones
- Senhas e tokens
- Dados financeiros
- Informações de cartão de crédito

**Ações:**
- Dados sensíveis são mascarados
- Análises críticas usam modelo local (não sai do servidor)
- Auditoria completa é registrada

#### Conformidade LGPD
- Dados pessoais são tratados com segurança
- Retenção é limitada a 90 dias
- Você pode solicitar exclusão a qualquer momento
- Relatório de compliance disponível

### 5. **Otimização de Tokens**
O sistema reduz automaticamente o uso de tokens em 35%:

- **Compactação de Queries**: Prometheus queries são comprimidas
- **Sumarização**: Contextos grandes são resumidos inteligentemente
- **Chunking Dinâmico**: Dados são divididos otimamente por tipo

---

## 📊 Monitoramento e SLAs

### SLAs Garantidos

| Métrica | Target | Frequência de Verificação |
|---------|--------|---------------------------|
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

## 🚀 Performance e Custo

### Custo Esperado

Por padrão, análises custam muito menos:

| Tipo | Modelo Típico | Custo Típico |
|------|---------------|--------------|
| Observability | GPT-4o-mini | $0.005-0.01 |
| Test Intelligence | GPT-4-turbo | $0.03-0.05 |
| CI/CD | GPT-4o-mini | $0.01-0.02 |
| Incident | o1-preview | $0.08-0.15 |
| Risk | GPT-4-turbo | $0.02-0.04 |

**Resultado final:** Média $0.054 por análise (com caching incluído)

### Performance

| Cenário | Latência | Notas |
|---------|----------|-------|
| Cache hit (mesma consulta) | ~50ms | Instantâneo |
| Análise rápida | 1-2 seg | Modelo leve |
| Análise normal | 3-5 seg | Modelo balanceado |
| Análise complexa | 5-10 seg | Modelo powerful |

---

## 🔐 Segurança

### Autenticação

Todo acesso requer JWT válido. Solicite ao seu admin:

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

### Auditoria

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

---

## ⚡ Dicas de Uso

### 1. **Prepare o Contexto Bem**
- Inclua informações relevantes apenas
- Forneça histórico quando possível
- Especifique o que quer saber

**Ruim:**
```
"Algo está errado com latência"
```

**Bom:**
```
"Latência passou de 4500ms para 5800ms nas últimas 2 horas.
Histórico: geralmente 4000-4500ms. Sem mudanças conhecidas no código.
Tráfego: aumentou 30% nos últimos 30 minutos."
```

### 2. **Use Criticidade Corretamente**

- **LOW**: Tendências, análises exploratórias
- **NORMAL**: Investigações padrão
- **HIGH**: Problemas que afetam usuários
- **CRITICAL**: Outages em produção

---

### 3. **Verifique Confiança**
Resultados com confiança < 0.75 podem precisar investigação manual.

```json
{
  "result": "...",
  "confidence": 0.68,
  "confidence_reasons": [
    "Dados limitados (menos de 50 pontos históricos)",
    "Anomalia nunca vista antes"
  ]
}
```

### 4. **Reutilize Contexto Aprendido**
Se já recebeu uma análise, reutilize o `analysisId`:

```bash
curl -X GET http://localhost:8080/api/ai/analysis/analysis-123
```

Retorna resultado cacheado (grátis).

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

Contacte seu admin se persistir.

---

## 📞 Contato e Suporte

Para dúvidas ou problemas:

1. **Dashboard de Status**: http://localhost:3000/status
2. **Logs de Requisição**: `/api/ai/logs?analysisId=XXX`
3. **Admin do Sistema**: Contactar gerente de TI

---

## 📚 Referências Rápidas

### Endpoints Principais

```
POST   /api/ai/analyze                 Criar análise
GET    /api/ai/analysis/:id            Obter resultado
GET    /api/ai/audit                   Auditoria
GET    /api/ai/status                  Status do sistema
GET    /api/ai/predictions             Previsões (próximas 4h)
GET    /api/ai/cost-report             Relatório de custo
POST   /api/ai/analysis/:id/feedback   Enviar feedback
```

### Tipos de Análise (enum)

```typescript
'observability'     // Métricas e performance
'test-intelligence' // Testes e cobertura
'cicd'             // Builds e deploys
'incident'         // Incidentes críticos
'risk'             // Segurança e compliance
```

### Niveis de Criticidade (enum)

```typescript
'low'      // Investigação exploratória
'normal'   // Investigação padrão
'high'     // Afeta usuários
'critical' // Outage em produção
```

---

## ✅ Checklist de Boas Práticas

- [ ] Incluir contexto histórico nas requisições
- [ ] Especificar criticidade corretamente
- [ ] Verificar confiança do resultado (> 0.75)
- [ ] Guardar `analysisId` para reutilização
- [ ] Revisar recomendações antes de agir
- [ ] Fornecer feedback via `/feedback` endpoint
- [ ] Monitorar custo mensal
- [ ] Configurar alertas para métricas críticas

---

**Versão:** 1.0  
**Última atualização:** 2026-04-16  
**Suporte:** contato.layanne.batista@gmail.com
