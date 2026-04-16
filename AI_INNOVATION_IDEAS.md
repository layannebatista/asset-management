# 💡 INNOVATION IDEAS — AI Intelligence Layer

**Objetivo:** Explorar novas funcionalidades e otimizações que a IA pode trazer ao projeto  
**Contexto:** Sistema de análise de patrimônio + infra, teste, CI/CD com LLM  
**Foco:** Tokens, predição, inteligência adaptativa, knowledge corporativo

---

## 1️⃣ TOKEN OPTIMIZATION AVANÇADA

### Problema Atual
- Contexto bruto = 8,400 tokens → final = 1,980 tokens (76% redução)
- Ainda há desperdício: dados repetitivos, contexto de baixa relevância, redundância entre chunks

### Ideia 1.1: Query Rewriting (Compressão de Queries)

**Conceito:** Usar um modelo pequeno (gpt-4o-mini) para reescrever queries estruturadas de forma mais compacta antes do contexto pipeline.

```typescript
// src/optimization/QueryRewriter.ts

export class QueryRewriter {
  /**
   * Reescreve queries PromQL para versão mais compacta
   * Exemplo:
   *   IN:  "rate(http_request_duration_seconds_bucket[5m])"
   *   OUT: "http.p99.5m" (referência para interpolação)
   */
  async rewriteQuery(query: string, domain: 'prometheus' | 'logs' | 'events'): Promise<string> {
    // Usa cache de queries já reescritas
    const cached = await this.cache.get(`rewrite:${query}`);
    if (cached) return cached;

    // Chamada a LLM só se não estiver em cache
    const rewritten = await this.llm.call({
      systemPrompt: `Reescreva esta query em formato mais compacto (máx 50 caracteres).
Mantenha semântica. Use abreviações padrão.
Domain: ${domain}`,
      userPrompt: query,
    });

    // Salva no cache por 7 dias
    await this.cache.set(`rewrite:${query}`, rewritten, { EX: 604800 });
    return rewritten;
  }
}
```

**Benefício:** -20-30% em token de contexto metadata  
**Custo:** 1 chamada LLM extra (mini model = $0.0001) vs economia em tokens  
**ROI:** Positivo após ~50 análises

---

### Ideia 1.2: Contextual Summarization (Resumos Inteligentes)

**Conceito:** Para contextos grandes (> 5000 tokens), gerar resumo executivo primeiro, depois decidir se precisa de detalhes.

```typescript
// src/optimization/ContextualSummarizer.ts

export class ContextualSummarizer {
  /**
   * Estratégia adaptativa:
   * - Se contextSize < 1000: sem resumo
   * - Se 1000 < contextSize < 3000: resumo de 30%
   * - Se contextSize > 3000: resumo de 50%
   */
  async summarizeIfNeeded(
    chunks: ContextChunk[],
    analysisType: AnalysisType,
  ): Promise<ContextChunk[]> {
    const totalTokens = chunks.reduce((s, c) => s + estimate(c.data), 0);

    // Decisão: precisa resumo?
    const summaryRatio = this._decideSummaryRatio(totalTokens);
    if (summaryRatio === 0) return chunks; // Sem resumo

    // Aplicar resumo por categoria
    const summarized = await Promise.all(
      chunks.map(async (chunk) => {
        const chunkTokens = estimate(chunk.data);
        const targetTokens = Math.floor(chunkTokens * (1 - summaryRatio));

        if (targetTokens < 50) return chunk; // Não resume dados pequenos

        const summary = await this._summarizeChunk(chunk, targetTokens);
        return {
          ...chunk,
          data: summary,
          metadata: {
            ...chunk.metadata,
            summarized: true,
            originalTokens: chunkTokens,
            summaryTokens: estimate(summary),
          },
        };
      }),
    );

    return summarized;
  }

  private async _summarizeChunk(chunk: ContextChunk, targetTokens: number): Promise<any> {
    const prompt = `Resuma este dados técnicos em máximo ${targetTokens} tokens.
Priorize: métricas, anomalias, conclusões.
Ignore: metadata redundante, timestamps exatos.

Dados:
${JSON.stringify(chunk.data)}

Responda apenas com o resumo (JSON válido):`;

    const response = await this.llm.call({
      systemPrompt: 'Você é um resumidor técnico para sistemas de IA.',
      userPrompt: prompt,
      useFallback: true, // Usa modelo mais barato
    });

    return JSON.parse(response.content);
  }

  private _decideSummaryRatio(totalTokens: number): number {
    if (totalTokens < 1000) return 0; // Sem resumo
    if (totalTokens < 3000) return 0.3; // Resume 30%
    return 0.5; // Resume 50%
  }
}
```

**Benefício:** -30-50% em tokens para contextos grandes  
**Tradeoff:** Perda mínima de detalhes, compensada por relevância  
**Quando usar:** Incident investigation com muitos logs

---

### Ideia 1.3: Dynamic Chunking Strategy

**Conceito:** Tamanho e estratégia de chunk varia por tipo de análise e contexto.

```typescript
// src/optimization/DynamicChunking.ts

export class DynamicChunkingStrategy {
  /**
   * Diferentes estratégias por análise type
   */
  getStrategy(analysisType: AnalysisType, contextSize: number): ChunkingConfig {
    switch (analysisType) {
      case AnalysisType.OBSERVABILITY:
        // Métricas são altamente estruturadas → chunks maiores, menor sobreposição
        return {
          chunkSize: 500, // tokens
          overlap: 50,
          prioritizeFields: ['anomalyFlags', 'metrics', 'thresholds'],
          compressNumbers: true, // "1234567" → "1.2M"
          timeSampling: 'every_5_mins', // Reduz séries temporais
        };

      case AnalysisType.INCIDENT:
        // Logs precisam contexto sequencial → chunks menores, maior overlap
        return {
          chunkSize: 300,
          overlap: 150,
          prioritizeFields: ['errors', 'timestamps', 'stack_traces'],
          compressNumbers: false, // Manter exatidão
          timeSampling: 'every_1_min',
        };

      case AnalysisType.RISK:
        // Análise de código → chunks por função/componente
        return {
          chunkSize: 400,
          overlap: 100,
          prioritizeFields: ['violations', 'severity', 'pii_indicators'],
          compressNumbers: false,
          timeSampling: null, // Não aplica
        };

      default:
        return { chunkSize: 400, overlap: 100 };
    }
  }

  /**
   * Transformações por tipo de dados
   */
  transformChunk(chunk: any, config: ChunkingConfig): ContextChunk {
    let transformed = { ...chunk };

    // Compressão de números
    if (config.compressNumbers) {
      transformed = this._compressNumbers(transformed);
    }

    // Amostragem temporal
    if (config.timeSampling) {
      transformed = this._sampleTimeSeries(transformed, config.timeSampling);
    }

    // Priorização de campos
    transformed = this._reorderByPriority(transformed, config.prioritizeFields);

    return {
      data: transformed,
      score: this._scoreRelevance(transformed, config),
    };
  }

  private _compressNumbers(obj: any): any {
    // 1234567 → "1.2M", 0.000123 → "0.1m"
    const compress = (n: number): string => {
      const abs = Math.abs(n);
      if (abs >= 1e6) return (n / 1e6).toFixed(1) + 'M';
      if (abs >= 1e3) return (n / 1e3).toFixed(1) + 'K';
      if (abs < 0.001) return (n * 1e6).toFixed(1) + 'µ';
      return n.toString();
    };

    return JSON.parse(JSON.stringify(obj), (key, val) => {
      if (typeof val === 'number' && Math.abs(val) > 1000) {
        return compress(val);
      }
      return val;
    });
  }

  private _sampleTimeSeries(obj: any, sampling: string): any {
    // Se há array de dados temporais, amostra a cada N minutos
    // Reduz "1440 data points por dia" para "288 points" (5-min sampling)
    if (!Array.isArray(obj)) return obj;

    const interval = sampling === 'every_5_mins' ? 5 : 1;
    return obj.filter((_, i) => i % interval === 0);
  }

  private _reorderByPriority(obj: any, priority: string[]): any {
    const reordered = {};
    // Coloca campos prioritários primeiro
    for (const field of priority) {
      if (field in obj) {
        reordered[field] = obj[field];
      }
    }
    // Depois outros campos
    for (const [key, val] of Object.entries(obj)) {
      if (!(key in reordered)) {
        reordered[key] = val;
      }
    }
    return reordered;
  }
}
```

**Benefício:** -15-25% tokens com melhor precisão  
**Implementação:** Integra com ContextBudgetManager existente

---

## 2️⃣ ANÁLISE PREDITIVA

### Ideia 2.1: Degradation Forecasting (Previsão de Degradação)

**Conceito:** Analisar tendências históricas e prever degradação antes acontecer.

```typescript
// src/prediction/DegradationForecaster.ts

export class DegradationForecaster {
  /**
   * Analisa histórico e prevê se degradação vai ocorrer nos próximos 24h
   * Baseado em: latência, erros, recursos, padrões temporais
   */
  async forecastDegradation(
    historyMinutes: 60,
    forecastHours: 24,
  ): Promise<DegradationForecast> {
    // 1. Coletar histórico
    const history = await this.prometheus.queryRange({
      queries: [
        'http_requests_duration_ms_p95',
        'error_rate_pct',
        'jvm_heap_usage_pct',
        'gc_pause_ms',
      ],
      duration: `${historyMinutes}m`,
    });

    // 2. Análise de tendências
    const trends = this._analyzeTrends(history);
    // trends: { latency: 'increasing', errors: 'stable', heap: 'increasing' }

    // 3. Padrões sazonais
    const seasonality = await this._detectSeasonality(history);
    // seasonality: { peakHour: 14, peakDay: 'Thursday', multiplier: 1.5 }

    // 4. Chamar LLM com análise estruturada (não raw data)
    const forecast = await this.llm.call({
      systemPrompt: `Você é um forecaster de infraestrutura.
Baseado em histórico + tendências + sazonalidade, preveja se haverá degradação.
Retorne: { willDegradeIn24h: boolean, probability: 0-1, bottleneck: string, eta: "HHmm", recommendation: string }`,

      userPrompt: `
Histórico (último ${historyMinutes} minutos):
- Latência P95: ${trends.latency.value}ms, tendência: ${trends.latency.direction}
- Taxa de erro: ${trends.errors.value}%, tendência: ${trends.errors.direction}
- Heap JVM: ${trends.heap.value}%, tendência: ${trends.heap.direction}
- GC pause: ${trends.gc.value}ms, tendência: ${trends.gc.direction}

Sazonalidade:
- Hora de pico: ${seasonality.peakHour}h
- Dia de pico: ${seasonality.peakDay}
- Multiplicador: ${seasonality.multiplier}x

Baseado nisso, qual é o risco de degradação nos próximos ${forecastHours}h?`,
    });

    return JSON.parse(forecast.content);
  }

  private _analyzeTrends(history: Record<string, number[]>): TrendAnalysis {
    const trends: TrendAnalysis = {};

    for (const [metric, values] of Object.entries(history)) {
      const last10 = values.slice(-10);
      const avg = last10.reduce((a, b) => a + b) / last10.length;
      const trend = last10[last10.length - 1] > avg ? 'increasing' : 'decreasing';

      trends[metric] = {
        value: last10[last10.length - 1],
        direction: trend,
        trend30m: this._calculateTrendSlope(last10),
      };
    }

    return trends;
  }

  private async _detectSeasonality(history: any): Promise<any> {
    // Análise de padrões diários e horários
    // Retorna: { peakHour, peakDay, multiplier }
    const results = await this.repository.query(`
      SELECT 
        EXTRACT(HOUR FROM created_at) as hour,
        EXTRACT(DOW FROM created_at) as day,
        AVG(eval_score) as avg_score
      FROM ai_intelligence.analyses
      WHERE created_at > NOW() - INTERVAL '30 days'
      GROUP BY hour, day
      ORDER BY avg_score DESC
    `);

    return {
      peakHour: results[0].hour,
      peakDay: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][results[0].day],
      multiplier: results[0].avg_score / (results.reduce((s, r) => s + r.avg_score, 0) / results.length),
    };
  }

  private _calculateTrendSlope(values: number[]): number {
    // Regressão linear simples
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const sumX = x.reduce((a, b) => a + b);
    const sumY = values.reduce((a, b) => a + b);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * values[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return slope;
  }
}
```

**Benefício:** Prevenir outages antes acontecerem  
**Implementação:** Integra com observability analyzer  
**ROI:** Alto (1 outage evitado = economia de horas)

---

### Ideia 2.2: Anomaly Detection com Explanations

**Conceito:** Detectar anomalias E explicar por que são anomalias (não só sinalizar).

```typescript
// src/prediction/AnomalyExplainer.ts

export class AnomalyExplainer {
  /**
   * Detecta anomalia e gera explicação em linguagem natural
   */
  async detectAndExplain(metric: string, timeSeries: TimeSeries): Promise<AnomalyExplanation> {
    // 1. Detect (estatístico)
    const anomalies = this._detectStatistical(timeSeries);
    if (anomalies.length === 0) {
      return { isAnomaly: false, confidence: 1.0, explanation: 'Comportamento normal' };
    }

    // 2. Contextualize (histórico)
    const context = await this._getHistoricalContext(metric, anomalies[0].timestamp);

    // 3. Correlate (outras métricas)
    const correlations = await this._findCorrelations(metric, anomalies[0]);

    // 4. Explain (LLM)
    const explanation = await this.llm.call({
      systemPrompt: `Você é um diagnosticador de infraestrutura.
Explique em linguagem clara por que essa métrica é anômala.
Seja específico: cite valores, comparações, correlações.`,

      userPrompt: `
Métrica: ${metric}
Valor anômalo: ${anomalies[0].value}
Timestamp: ${anomalies[0].timestamp}

Contexto histórico:
- Média dos últimos 7 dias: ${context.avg7d}
- Pior valor anterior: ${context.max7d}
- Desvio padrão: ${context.std}

Correlações encontradas:
${correlations.map((c) => `- ${c.metric}: ${c.correlation}`).join('\n')}

Por que essa é uma anomalia?`,
    });

    return {
      isAnomaly: true,
      confidence: anomalies[0].score,
      explanation: explanation.content,
      relatedMetrics: correlations.map((c) => c.metric),
      recommendedAction: await this._suggestAction(metric, anomalies[0], explanation.content),
    };
  }

  private _detectStatistical(ts: TimeSeries): AnomalyPoint[] {
    // Isolated Forest ou Z-score
    const mean = ts.values.reduce((a, b) => a + b) / ts.values.length;
    const std = Math.sqrt(ts.values.reduce((s, v) => s + (v - mean) ** 2, 0) / ts.values.length);

    return ts.values
      .map((val, i) => ({
        value: val,
        timestamp: ts.timestamps[i],
        zScore: Math.abs((val - mean) / std),
        score: Math.min(1, Math.abs((val - mean) / std) / 3), // Z-score > 3 = anomalia
      }))
      .filter((a) => a.score > 0.7);
  }

  private async _findCorrelations(metric: string, anomaly: AnomalyPoint): Promise<CorrelatedMetric[]> {
    // Busca correlação de Pearson com outras métricas no mesmo período
    const results = await this.prometheus.queryRange({
      queries: ['http.*', 'jvm.*', 'db.*'], // Padrão: buscar correladas
      duration: '7d',
      timestamp: anomaly.timestamp,
    });

    const correlations = [];
    for (const [otherMetric, otherValues] of Object.entries(results)) {
      const correlation = this._pearsonCorrelation(
        [anomaly.value],
        [otherValues[otherValues.length - 1]],
      );

      if (Math.abs(correlation) > 0.5) {
        correlations.push({ metric: otherMetric, correlation });
      }
    }

    return correlations;
  }

  private async _suggestAction(metric: string, anomaly: AnomalyPoint, explanation: string): Promise<string> {
    // Baseado na métrica e explicação, sugerir ação
    const prompt = `Baseado nessa explicação, qual ação imediata tomar?
${explanation}

Responda com 1 ação específica (máx 50 palavras).`;

    const response = await this.llm.call({
      systemPrompt: 'Recomende ação imediata.',
      userPrompt: prompt,
      useFallback: true,
    });

    return response.content;
  }

  private _pearsonCorrelation(x: number[], y: number[]): number {
    const n = x.length;
    const meanX = x.reduce((a, b) => a + b) / n;
    const meanY = y.reduce((a, b) => a + b) / n;

    const numerator = x.reduce((sum, xi, i) => sum + (xi - meanX) * (y[i] - meanY), 0);
    const denomX = x.reduce((sum, xi) => sum + (xi - meanX) ** 2, 0);
    const denomY = y.reduce((sum, yi) => sum + (yi - meanY) ** 2, 0);

    return numerator / Math.sqrt(denomX * denomY);
  }
}
```

**Benefício:** Anomalias não só detectadas mas explicadas  
**Impacto:** Reduz tempo para resolução (investigation → ação)

---

## 3️⃣ MULTI-LLM STRATEGY

### Ideia 3.1: Specialist Models por Domain

**Conceito:** Cada tipo de análise usa modelo mais apropriado, não sempre gpt-4o.

```typescript
// src/llm/SpecialistModelRouter.ts

export class SpecialistModelRouter {
  /**
   * Roteamento ultra-específico por análise type + contexto
   */
  routeSpecialist(context: RoutingContext): ModelDecision {
    switch (context.type) {
      case AnalysisType.OBSERVABILITY:
        return this._routeObservabilitySpecialist(context);

      case AnalysisType.TEST_INTELLIGENCE:
        return this._routeTestSpecialist(context);

      case AnalysisType.INCIDENT:
        return this._routeIncidentSpecialist(context);

      case AnalysisType.RISK:
        return this._routeRiskSpecialist(context);

      case AnalysisType.CICD:
        return this._routeCICDSpecialist(context);
    }
  }

  private _routeObservabilitySpecialist(ctx: RoutingContext): ModelDecision {
    // Observability = pattern matching em métricas
    // Não precisa raciocínio profundo
    if (ctx.contextSize < 500) {
      return {
        modelName: 'gpt-4o-mini',
        temperature: 0.4, // Determinístico
        maxTokens: 800,
        costEstimate: 0.001,
        reason: 'Pattern matching simples → mini model suficiente',
      };
    }

    // Contexto grande pode ter padrões complexos
    if (ctx.contextSize > 2000) {
      return {
        modelName: 'gpt-4-turbo',
        temperature: 0.5,
        maxTokens: 1500,
        costEstimate: 0.015,
        reason: 'Patterns complexos → turbo model',
      };
    }

    return {
      modelName: 'gpt-4o',
      temperature: 0.45,
      maxTokens: 1200,
      costEstimate: 0.008,
      reason: 'Observability padrão',
    };
  }

  private _routeTestSpecialist(ctx: RoutingContext): ModelDecision {
    // Test = análise de código + geração de testes
    // Precisa compreender semanticamente mas não reasoning profundo

    if (ctx.criticality === 'CRITICAL') {
      return {
        modelName: 'gpt-4-turbo',
        temperature: 0.3, // Mais conservador para testes
        maxTokens: 2000,
        costEstimate: 0.015,
        reason: 'Testes críticos → precisão alta',
      };
    }

    return {
      modelName: 'gpt-4o',
      temperature: 0.5,
      maxTokens: 1500,
      costEstimate: 0.008,
      reason: 'Test intelligence padrão',
    };
  }

  private _routeIncidentSpecialist(ctx: RoutingContext): ModelDecision {
    // Incident = PRECISA de raciocínio profundo
    // Root cause análise é complexa

    if (ctx.contextSize > 3000 && ctx.criticality === 'CRITICAL') {
      return {
        modelName: 'o1-preview',
        temperature: 0.2,
        maxTokens: 3000,
        costEstimate: 0.08,
        reason: 'Incident crítica com contexto grande → o1 reasoning',
      };
    }

    if (ctx.criticality === 'CRITICAL') {
      return {
        modelName: 'gpt-4-turbo',
        temperature: 0.3,
        maxTokens: 2500,
        costEstimate: 0.015,
        reason: 'Incident crítica → turbo reasoning',
      };
    }

    return {
      modelName: 'gpt-4o',
      temperature: 0.5,
      maxTokens: 2000,
      costEstimate: 0.008,
      reason: 'Incident padrão',
    };
  }

  private _routeRiskSpecialist(ctx: RoutingContext): ModelDecision {
    // Risk = precisão máxima, baixa tolerância a erro
    // Sempre usar modelo bom

    return {
      modelName: 'gpt-4-turbo',
      temperature: 0.2, // Muito conservador
      maxTokens: 2500,
      costEstimate: 0.015,
      reason: 'Risk assessment → precisa alta precisão',
    };
  }

  private _routeCICDSpecialist(ctx: RoutingContext): ModelDecision {
    // CI/CD = otimização, automação
    // Pode ser mais criativo

    if (ctx.criticality === 'HIGH' || ctx.userTier === 'enterprise') {
      return {
        modelName: 'gpt-4o',
        temperature: 0.6,
        maxTokens: 1500,
        costEstimate: 0.008,
        reason: 'CI/CD enterprise → qualidade + criatividade',
      };
    }

    return {
      modelName: 'gpt-4o-mini',
      temperature: 0.7,
      maxTokens: 1200,
      costEstimate: 0.003,
      reason: 'CI/CD otimizado por custo',
    };
  }
}
```

**Benefício:** -30% custo com mesmo nível de qualidade  
**Implementação:** Substitui/estende ModelRouter existente

---

### Ideia 3.2: Preprocessing with Smaller Model

**Conceito:** Use gpt-4o-mini para pre-processing (filtrar, resumir, estruturar) antes de chamar modelo principal.

```typescript
// src/llm/PipelinedLLM.ts

export class PipelinedLLMStrategy {
  /**
   * 2-stage pipeline:
   * Stage 1: gpt-4o-mini (fast, cheap) → filtrar + estruturar
   * Stage 2: gpt-4o/turbo (powerful) → análise final
   */
  async analyzePipelined(
    context: ContextChunk[],
    query: string,
    analysisType: AnalysisType,
  ): Promise<AnalysisResult> {
    // STAGE 1: Preprocessing com mini model
    const preprocessed = await this.llm.call({
      systemPrompt: `Você é um préprocessador de dados.
Tarefa: Filtrar dados irrelevantes, estruturar JSON, remover ruído.
Retorne estrutura clara para análise posterior.`,

      userPrompt: `
Analysis type: ${analysisType}
Query: ${query}

Dados brutos:
${context.map((c) => JSON.stringify(c.data)).join('\n---\n')}

Retorne estrutura JSON limpa com campos relevantes apenas:`,

      useFallback: true, // Usa mini model
    });

    const cleaned = JSON.parse(preprocessed.content);

    // STAGE 2: Análise principal com modelo mais poderoso
    const analysis = await this.llm.call({
      systemPrompt: this._getSystemPromptForType(analysisType),

      userPrompt: `
Query: ${query}

Dados estruturados (preprocessados):
${JSON.stringify(cleaned, null, 2)}

Análise completa:`,

      useFallback: false, // Usa modelo principal (escolhido por ModelRouter)
    });

    return this._parseAnalysis(analysis.content, analysisType);
  }

  /**
   * ROI Estimado:
   * - STAGE 1: ~200 tokens, $0.0001
   * - STAGE 2: ~1500 tokens, $0.01 (vs $0.02 sem preprocessing)
   * - Economia: 50% de tokens na Stage 2, -$0.01 por análise
   * - Break-even: ~2000 análises (considerando overhead Stage 1)
   * - ROI: Positivo após warm-up
   */
}
```

**Benefício:** -20-40% custo em análises complexas  
**Tradeoff:** +100ms latência (2 chamadas LLM)  
**Quando usar:** Contexto > 3000 tokens

---

## 4️⃣ FEEDBACK LOOP AVANÇADO

### Ideia 4.1: Implicit User Feedback Integration

**Conceito:** Capturar feedback implícito (clicks, actions tomadas) e integrar no modelo de avaliação.

```typescript
// src/feedback/ImplicitFeedbackCollector.ts

export class ImplicitFeedbackCollector {
  /**
   * Coleta feedback implícito:
   * - Qual recomendação foi executada?
   * - Quanto tempo levou para resolver?
   * - Problema voltou a ocorrer?
   */
  async recordAction(
    analysisId: string,
    action: {
      timestamp: Date;
      userAction: 'viewed' | 'shared' | 'executed' | 'bookmarked' | 'dismissed';
      executedRecommendation?: string;
      timeToResolution?: number; // minutos
    },
  ): Promise<void> {
    await this.db.insert('ai_intelligence.user_actions', {
      analysis_id: analysisId,
      action_type: action.userAction,
      executed_recommendation: action.executedRecommendation,
      time_to_resolution: action.timeToResolution,
      timestamp: action.timestamp,
    });

    // Atualizar feedback score
    if (action.timeToResolution !== null) {
      const analysis = await this.db.query(
        'SELECT * FROM ai_intelligence.analyses WHERE id = $1',
        [analysisId],
      );

      const implicitScore = this._computeImplicitScore(action.timeToResolution);

      await this.db.update('ai_intelligence.analyses', {
        id: analysisId,
        implicit_score: implicitScore,
      });
    }
  }

  /**
   * Treinar modelo com feedback implícito
   * Exemplo: recomendações executadas que resolvem problema em < 30min recebem score alto
   */
  async improveModelWithImplicitFeedback(): Promise<void> {
    const successfulActions = await this.db.query(`
      SELECT 
        aa.analysis_id,
        a.type,
        a.data,
        aa.action_type,
        aa.time_to_resolution,
        CASE 
          WHEN aa.time_to_resolution < 30 THEN 0.95
          WHEN aa.time_to_resolution < 120 THEN 0.80
          WHEN aa.time_to_resolution < 480 THEN 0.70
          ELSE 0.50
        END as implicit_quality_score
      FROM ai_intelligence.user_actions aa
      JOIN ai_intelligence.analyses a ON aa.analysis_id = a.id
      WHERE aa.action_type = 'executed'
      AND aa.time_to_resolution IS NOT NULL
      AND a.created_at > NOW() - INTERVAL '30 days'
    `);

    // Calcular quais templates funcionam melhor para cada tipo
    const templatePerformance = {};
    for (const action of successfulActions) {
      const key = `${action.type}:${action.template_id}`;
      if (!templatePerformance[key]) {
        templatePerformance[key] = { score: 0, count: 0 };
      }

      templatePerformance[key].score += action.implicit_quality_score;
      templatePerformance[key].count += 1;
    }

    // Atualizar scores dos templates
    for (const [key, data] of Object.entries(templatePerformance)) {
      const avgScore = data.score / data.count;
      // Guardar para usar em Phase 5 (ContextIntelligence boosting)
      await this.cache.set(`template_performance:${key}`, avgScore, { EX: 2592000 }); // 30 dias
    }
  }

  private _computeImplicitScore(timeToResolution: number): number {
    // Quanto mais rápido resolveu, melhor a recomendação
    // 0-30 min: excelente (0.95)
    // 30-2h: bom (0.80)
    // 2h-8h: aceitável (0.70)
    // > 8h: questionável (0.50)

    if (timeToResolution < 30) return 0.95;
    if (timeToResolution < 120) return 0.80;
    if (timeToResolution < 480) return 0.70;
    return 0.50;
  }
}
```

**Benefício:** Feedback real incorporado no sistema  
**Implementação:** Backend integra com AI service

---

### Ideia 4.2: Automated A/B Testing de Templates

**Conceito:** Testar novos templates automaticamente contra versão anterior.

```typescript
// src/optimization/AutomaticTemplateABTesting.ts

export class AutomaticTemplateABTesting {
  /**
   * A/B test: Se novo template melhora eval score em >5%, promover
   */
  async conductABTest(
    type: AnalysisType,
    templateV1: string, // versão atual
    templateV2: string, // candidato
    testSize: number = 100, // análises por grupo
  ): Promise<ABTestResult> {
    const results = {
      v1: { scores: [], totalCost: 0 },
      v2: { scores: [], totalCost: 0 },
    };

    // Coletar dados históricos para teste
    const testCases = await this.db.query(`
      SELECT context, query FROM ai_intelligence.analyses
      WHERE type = $1
      AND created_at > NOW() - INTERVAL '7 days'
      ORDER BY RANDOM()
      LIMIT $2
    `, [type, testSize * 2]);

    // Split A/B
    const groupA = testCases.slice(0, testSize);
    const groupB = testCases.slice(testSize);

    // Run A
    for (const testCase of groupA) {
      const result = await this.orchestrator.analyze({
        type,
        context: testCase.context,
        query: testCase.query,
        templateOverride: templateV1,
      });

      results.v1.scores.push(result.qualityScore);
      results.v1.totalCost += result.costUsd;
    }

    // Run B
    for (const testCase of groupB) {
      const result = await this.orchestrator.analyze({
        type,
        context: testCase.context,
        query: testCase.query,
        templateOverride: templateV2,
      });

      results.v2.scores.push(result.qualityScore);
      results.v2.totalCost += result.costUsd;
    }

    // Análise estatística
    const v1Avg = results.v1.scores.reduce((a, b) => a + b) / results.v1.scores.length;
    const v2Avg = results.v2.scores.reduce((a, b) => a + b) / results.v2.scores.length;
    const improvement = ((v2Avg - v1Avg) / v1Avg) * 100;

    const statsigResult = this._conductTTest(results.v1.scores, results.v2.scores);

    return {
      winner: improvement > 5 && statsigResult.pValue < 0.05 ? 'v2' : 'v1',
      improvement: improvement.toFixed(2),
      v1AvgScore: v1Avg.toFixed(3),
      v2AvgScore: v2Avg.toFixed(3),
      pValue: statsigResult.pValue,
      recommendation: improvement > 5 ? 'Promover v2' : 'Manter v1',
      totalTestCost: (results.v1.totalCost + results.v2.totalCost).toFixed(4),
    };
  }

  /**
   * Rodar automaticamente a cada 1000 análises para detectar degradação
   */
  async startContinuousABTesting(analysisTypeList: AnalysisType[]): Promise<void> {
    const checkInterval = setInterval(async () => {
      for (const type of analysisTypeList) {
        const latestTemplate = await this.getLatestTemplate(type);
        const previousTemplate = await this.getTemplateByVersion(type, latestTemplate.version - 1);

        if (!previousTemplate) continue;

        const result = await this.conductABTest(type, previousTemplate.id, latestTemplate.id, 50);

        if (result.winner === 'v1') {
          // Nova template piora, alertar
          await this.alerting.send({
            severity: 'warning',
            title: `Template ${type} v${latestTemplate.version} degradou`,
            message: `Improvement: ${result.improvement}% (target: >5%)`,
            action: 'Rollback automático em 1h se não corrigir',
          });

          // Schedule rollback automático
          setTimeout(
            () => this.rollbackTemplate(type, previousTemplate.id),
            3600000,
          );
        }
      }
    }, 1000 * 3600); // A cada 1h
  }

  private _conductTTest(v1: number[], v2: number[]): { pValue: number } {
    // T-test simplificado
    const n1 = v1.length;
    const n2 = v2.length;

    const mean1 = v1.reduce((a, b) => a + b) / n1;
    const mean2 = v2.reduce((a, b) => a + b) / n2;

    const var1 = v1.reduce((s, x) => s + (x - mean1) ** 2, 0) / (n1 - 1);
    const var2 = v2.reduce((s, x) => s + (x - mean2) ** 2, 0) / (n2 - 1);

    const pooledVar = ((n1 - 1) * var1 + (n2 - 1) * var2) / (n1 + n2 - 2);
    const tStat = (mean1 - mean2) / Math.sqrt(pooledVar * (1 / n1 + 1 / n2));

    // Aproximação simples: t-stat > 1.96 ≈ p < 0.05
    const pValue = tStat > 1.96 ? 0.01 : 0.5;

    return { pValue };
  }
}
```

**Benefício:** Garantir que novas templates só são promovidas se melhoram qualidade  
**Implementação:** Contínua, automation-first

---

## 5️⃣ KNOWLEDGE BASE DINÂMICA

### Ideia 5.1: Learning from Successful Analyses

**Conceito:** Construir knowledge base a partir de análises bem-sucedidas (score > 0.85).

```typescript
// src/knowledge/DynamicKnowledgeBase.ts

export class DynamicKnowledgeBase {
  /**
   * Extrai insights de análises bem-sucedidas
   * Armazena em format reutilizável
   */
  async learnFromAnalysis(analysis: AnalysisResult): Promise<void> {
    if (analysis.qualityScore < 0.85) return; // Só aprende de boas análises

    // 1. Extrair padrões
    const patterns = await this._extractPatterns(analysis);

    // 2. Armazenar em knowledge base
    for (const pattern of patterns) {
      await this.db.insert('ai_intelligence.knowledge_base', {
        type: analysis.type,
        pattern_category: pattern.category,
        pattern_data: JSON.stringify(pattern),
        quality_score: analysis.qualityScore,
        frequency: 1,
        last_seen: new Date(),
      });
    }

    // 3. Gerar resumo executivo para próximas análises
    const summary = await this._generateSummary(analysis);
    await this.cache.set(`knowledge:${analysis.type}:${summary.hash}`, summary, { EX: 2592000 });
  }

  /**
   * Usar knowledge base para melhorar análises futuras
   */
  async enrichContextWithKnowledge(type: AnalysisType, query: string): Promise<string> {
    // Buscar padrões semelhantes
    const similarPatterns = await this.db.query(`
      SELECT pattern_data, quality_score, frequency
      FROM ai_intelligence.knowledge_base
      WHERE type = $1
      AND quality_score > 0.85
      ORDER BY frequency DESC
      LIMIT 3
    `, [type]);

    if (similarPatterns.length === 0) return '';

    // Construir contexto de "aprendizados anteriores"
    const knowledgeContext = `
Padrões históricos de sucesso (análises com score > 0.85):
${similarPatterns
  .map(
    (p, i) => `
Padrão ${i + 1} (frequência: ${p.frequency}, score: ${p.quality_score}):
${JSON.stringify(JSON.parse(p.pattern_data), null, 2)}
`,
  )
  .join('\n')}

Use esses padrões como referência para estruturar sua análise.`;

    return knowledgeContext;
  }

  private async _extractPatterns(analysis: AnalysisResult): Promise<Pattern[]> {
    // Usar LLM para extrair padrões generalizáveis
    const response = await this.llm.call({
      systemPrompt: `Extraia padrões reusáveis dessa análise bem-sucedida.
Padrões são estruturas que podem ser aplicadas a casos similares.
Retorne como JSON array: [{ category, description, structure, applicableWhen }]`,

      userPrompt: `
Analysis type: ${analysis.type}
Quality score: ${analysis.qualityScore}

Resultado:
${JSON.stringify(analysis, null, 2)}

Extraia padrões generalizáveis:`,

      useFallback: true,
    });

    return JSON.parse(response.content);
  }

  private async _generateSummary(analysis: AnalysisResult): Promise<any> {
    // Summarize para próximos usuários
    const summary = {
      type: analysis.type,
      keyFindings: analysis.summary,
      recommendations: analysis.recommendations,
      commonMistakes: await this._findCommonMistakes(analysis),
      hash: this._hash(analysis.id),
    };

    return summary;
  }

  private _hash(str: string): string {
    return require('crypto').createHash('sha256').update(str).digest('hex').slice(0, 8);
  }
}
```

**Benefício:** Knowledge base corporativo construído automaticamente  
**ROI:** Alta (análises futuras + rápidas + melhores)

---

### Ideia 5.2: Dependency Graph de Assets

**Conceito:** Mapear dependências entre assets e usar para análises mais inteligentes.

```typescript
// src/knowledge/AssetDependencyGraph.ts

export class AssetDependencyGraph {
  /**
   * Constrói grafo de dependências:
   * - Asset A depende de Service B
   * - Service B depende de Database C
   * - etc.
   */
  async buildDependencyGraph(): Promise<void> {
    // Coletar dados de domínio
    const assets = await this.backend.getAllAssets();
    const dependencies = await this.backend.getDependencies();

    // Construir grafo
    const graph = new Map<string, Set<string>>();

    for (const asset of assets) {
      graph.set(asset.id, new Set());
    }

    for (const dep of dependencies) {
      graph.get(dep.fromId).add(dep.toId);
    }

    // Armazenar
    await this.cache.set('asset:dependency:graph', JSON.stringify([...graph.entries()]), {
      EX: 86400, // Atualizar 1x/dia
    });
  }

  /**
   * Quando uma análise detecta problema em Asset A,
   * Encontrar todos os assets impactados
   */
  async findImpactedAssets(assetId: string): Promise<string[]> {
    const graph = new Map(JSON.parse(await this.cache.get('asset:dependency:graph')));

    const impacted = new Set<string>();
    const queue = [assetId];

    while (queue.length > 0) {
      const current = queue.shift();

      // Encontrar quem depende de current
      for (const [asset, deps] of graph.entries()) {
        if (deps.has(current) && !impacted.has(asset)) {
          impacted.add(asset);
          queue.push(asset);
        }
      }
    }

    return Array.from(impacted);
  }

  /**
   * Uso na análise
   */
  async enhanceAnalysisWithDependencies(
    analysisResult: AnalysisResult,
    assetId: string,
  ): Promise<EnhancedAnalysis> {
    const impactedAssets = await this.findImpactedAssets(assetId);

    const enhanced = {
      ...analysisResult,
      impactedAssets,
      cascadeRisk: impactedAssets.length > 5 ? 'HIGH' : 'MEDIUM',
      recommendation: `Além de resolver este asset, considere o impacto em ${impactedAssets.length} assets dependentes.`,
    };

    return enhanced;
  }
}
```

**Benefício:** Visão holística do impacto de mudanças  
**Implementação:** Integra com backend existente

---

## 6️⃣ CROSS-CUTTING ANALYSIS (Análise Holística)

### Ideia 6.1: Multi-Domain Correlation Analysis

**Conceito:** Correlacionar problemas entre domínios (ex: latência HTTP correlacionada com GC pauses).

```typescript
// src/analysis/CrossDomainAnalyzer.ts

export class CrossDomainAnalyzer {
  /**
   * Quando uma análise de observability detecta latência,
   * Correlacionar com test-intelligence (testes falhando?) + cicd (deploy?)
   */
  async correlateAcrossDomains(symptom: AnalysisResult): Promise<CrossDomainInsight> {
    const timeWindow = 30; // minutos

    // 1. Coletar evidências de outros domínios no mesmo período
    const [observabilityData, testData, cicdData] = await Promise.all([
      this._getObservabilityMetrics(symptom.timestamp, timeWindow),
      this._getTestResults(symptom.timestamp, timeWindow),
      this._getCICDRuns(symptom.timestamp, timeWindow),
    ]);

    // 2. Análise de correlação
    const correlations = await this.llm.call({
      systemPrompt: `Você analisa correlações entre domínios.
Dada evidência de múltiplos domínios no mesmo período, identifique correlações.`,

      userPrompt: `
Symptom primário (${symptom.type}):
${JSON.stringify(symptom, null, 2)}

Observability data no período:
${JSON.stringify(observabilityData, null, 2)}

Test results:
${JSON.stringify(testData, null, 2)}

CI/CD runs:
${JSON.stringify(cicdData, null, 2)}

Quais correlações você identifica? O que causou o quê?`,
    });

    return JSON.parse(correlations.content);
  }

  private async _getObservabilityMetrics(timestamp: Date, windowMinutes: number): Promise<any> {
    // Query Prometheus para período
    return await this.prometheus.queryRange({
      start: new Date(timestamp.getTime() - windowMinutes * 60000),
      end: new Date(timestamp.getTime() + windowMinutes * 60000),
      step: '1m',
      queries: ['http_latency_p95', 'jvm_gc_pause_ms', 'error_rate_pct'],
    });
  }

  private async _getTestResults(timestamp: Date, windowMinutes: number): Promise<any> {
    // Query Allure para período
    return await this.allure.queryRange({
      start: new Date(timestamp.getTime() - windowMinutes * 60000),
      end: new Date(timestamp.getTime() + windowMinutes * 60000),
      filters: { status: 'FAILED' },
    });
  }

  private async _getCICDRuns(timestamp: Date, windowMinutes: number): Promise<any> {
    // Query GitHub Actions para período
    return await this.github.queryWorkflowRuns({
      start: new Date(timestamp.getTime() - windowMinutes * 60000),
      end: new Date(timestamp.getTime() + windowMinutes * 60000),
      filters: { status: 'completed' },
    });
  }
}
```

**Benefício:** Identificar raiz genuína (ex: deploy causou latência, que causou testes falharem)  
**Impacto:** Resolução mais rápida

---

## 7️⃣ ADVANCED COST OPTIMIZATION

### Ideia 7.1: Predictive Cost Budgeting

**Conceito:** Antes de chamar LLM, prever custo e decidir se vale a pena.

```typescript
// src/cost/PredictiveCostBudgeting.ts

export class PredictiveCostBudgeting {
  /**
   * Estimar custo ANTES de fazer análise
   * Se custo > benefício esperado, fazer versão simplificada
   */
  async estimateCostBeforeAnalysis(
    context: ContextChunk[],
    analysisType: AnalysisType,
    userTier: string,
  ): Promise<CostEstimate> {
    // 1. Estimar tokens (sem chamar LLM)
    const estimatedTokens = this._estimateTokens(context);

    // 2. Estimar modelo que seria usado
    const modelRouter = new ModelRouter();
    const routingContext = {
      type: analysisType,
      contextSize: estimatedTokens,
      criticality: 'NORMAL',
      userTier,
    };
    const modelDecision = modelRouter.route(routingContext);

    // 3. Calcular custo
    const estimatedCost = (modelDecision.costEstimate * estimatedTokens) / 1000;

    // 4. Estimar valor (benefit)
    const estimatedBenefit = this._estimateBenefit(analysisType, estimatedTokens);

    // 5. Decisão
    const roi = estimatedBenefit / estimatedCost;

    return {
      estimatedCost,
      estimatedBenefit,
      roi,
      recommendation:
        roi > 2.0
          ? 'FULL_ANALYSIS'
          : roi > 1.0
            ? 'LIGHTWEIGHT_ANALYSIS'
            : 'SKIP_OR_CACHE', // Use cache se disponível
      fallbackStrategy:
        roi < 1.0
          ? {
              type: 'LIGHTWEIGHT',
              description: 'Use gpt-4o-mini com contexto reduzido',
            }
          : null,
    };
  }

  /**
   * Se ROI baixo, usar estratégia alternativa
   */
  async executeLightweightAnalysis(context: ContextChunk[], analysisType: AnalysisType): Promise<AnalysisResult> {
    // 1. Resumir contexto em <500 tokens
    const summarized = context.slice(0, 2); // Top 2 chunks

    // 2. Usar template específico para lightweight
    const lightweightTemplate = await this.prompts.getTemplate(analysisType, 'lightweight-v1');

    // 3. Chamar com mini model
    return await this.orchestrator.analyze({
      context: summarized,
      template: lightweightTemplate,
      modelOverride: 'gpt-4o-mini',
    });
  }

  private _estimateTokens(context: ContextChunk[]): number {
    // Heurística: ~4 caracteres = 1 token
    return context.reduce((sum, c) => sum + JSON.stringify(c.data).length / 4, 0);
  }

  private _estimateBenefit(analysisType: AnalysisType, tokenCount: number): number {
    // Estimativa simplista:
    // - Incident analysis: alta prioridade, sempre vale
    // - Observability: média prioridade, varia por tamanho
    // - CI/CD: baixa prioridade se contexto pequeno

    switch (analysisType) {
      case AnalysisType.INCIDENT:
        return 50; // Valor alto

      case AnalysisType.OBSERVABILITY:
        return Math.min(30, tokenCount / 100); // Varia com contexto

      case AnalysisType.CICD:
        return tokenCount > 1000 ? 20 : 5; // Só vale se contexto grande

      default:
        return 10;
    }
  }
}
```

**Benefício:** -40% custo em análises de baixo valor  
**Trade-off:** Qualidade reduzida para análises triviais (aceitável)

---

## RESUMO DE IDEIAS & IMPACTO

| Ideia | Categoria | Impacto | Esforço | ROI |
|-------|-----------|---------|--------|-----|
| Query Rewriting | Otimização | -20-30% tokens | Médio | Alto |
| Contextual Summarization | Otimização | -30-50% tokens | Médio | Alto |
| Dynamic Chunking | Otimização | -15-25% tokens | Médio | Alto |
| Degradation Forecasting | Predição | -50% outages | Alto | Muito Alto |
| Anomaly Explanation | Predição | 2x mais rápido resolução | Médio | Alto |
| Specialist Models | Multi-LLM | -30% custo | Baixo | Muito Alto |
| Preprocessing Pipeline | Multi-LLM | -20-40% custo | Médio | Alto |
| Implicit Feedback | Feedback | Melhoria contínua | Médio | Médio |
| A/B Testing Templates | Feedback | Validação científica | Médio | Médio |
| Knowledge Base Learning | Knowledge | Base corporativo | Alto | Muito Alto |
| Dependency Graph | Knowledge | Análise holística | Alto | Alto |
| Cross-Domain Analysis | Cross-Cutting | Root cause genuína | Alto | Muito Alto |
| Cost Budgeting | Cost Opt | -40% custo baixo-valor | Médio | Alto |

---

## IMPLEMENTAÇÃO RECOMENDADA

### Phase 7 (Weeks 13-14) — Token Optimization
1. Query Rewriting
2. Contextual Summarization
3. Dynamic Chunking
**Impacto:** -35% tokens, -15% custo

### Phase 8 (Weeks 15-16) — Predictive Intelligence
1. Degradation Forecasting
2. Anomaly Explanation
3. Specialist Models
**Impacto:** -50% outages, -30% custo

### Phase 9 (Weeks 17-18) — Learning & Knowledge
1. Implicit Feedback Collection
2. A/B Testing Templates
3. Knowledge Base Building
**Impacto:** Melhoria contínua, base corporativa

### Phase 10 (Weeks 19-20) — Holistic Analysis
1. Dependency Graphing
2. Cross-Domain Correlation
3. Cost Budgeting
**Impacto:** Root cause real, análise integrada

---

## PRÓXIMOS PASSOS

1. Escolher Top 3 ideias para implementar first
2. Estimar esforço por tipo
3. Priorizar por ROI
4. Integrar com Phases 1-6 existentes

**Sugestão:** Começar com **Query Rewriting** (baixo risco, alto ROI) + **Degradation Forecasting** (alto impacto).

---

**Documento:** Innovation Ideas v1.0  
**Atualizado:** 2026-04-16  
**Status:** Pronto para discussão + prototipagem
