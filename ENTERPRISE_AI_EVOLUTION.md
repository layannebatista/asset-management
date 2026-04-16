# 🏗️ EVOLUÇÃO ENTERPRISE-GRADE DO SISTEMA DE IA
## Design Document Técnico | Patrimônio 360

**Data:** 2026-04-16  
**Status:** Proposta para Implementação Incremental  
**Escopo:** Robustez, Governança, Eficiência, Segurança, Inteligência Adaptativa  

---

## 📋 ÍNDICE

1. [Visão Geral Arquitetural](#1-visão-geral-arquitetural)
2. [Model Router Inteligente](#2-model-router-inteligente)
3. [Eval Pipeline](#3-eval-pipeline)
4. [Observabilidade de IA](#4-observabilidade-de-ia)
5. [Evolução Multi-Agent → Agent Graph](#5-evolução-multi-agent--agent-graph)
6. [Prompt Engine](#6-prompt-engine)
7. [Context Intelligence Adaptativo](#7-context-intelligence-adaptativo)
8. [Segurança Avançada](#8-segurança-avançada)
9. [Memory Layer](#9-memory-layer)
10. [Implementação Incremental](#10-implementação-incremental)

---

## 1. VISÃO GERAL ARQUITETURAL

### 1.1 Arquitetura Atual → Evoluída

```
┌─────────────────────────────────────────────────────────────────────┐
│                     BACKEND SPRING BOOT (Proxy)                    │
└─────────────────────┬───────────────────────────────────────────────┘
                      │ (autenticação + rate limit)
                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        AI GATEWAY (NOVO)                           │
│  - Validação de entrada (sensibilidade)                            │
│  - Roteamento dinâmico (Model Router)                              │
│  - Cache distribuído (Redis)                                        │
│  - Quota management                                                 │
└────────┬────────────────────────┬───────────────────────┬──────────┘
         │                        │                       │
    ┌────▼────┐            ┌──────▼────┐          ┌─────▼──────┐
    │ANALYSIS │            │EVALUATION │          │  MEMORY    │
    │PIPELINE │            │ PIPELINE  │          │   LAYER    │
    └────┬────┘            └──────┬────┘          └─────┬──────┘
         │                        │                     │
    ┌────▼────────────────────────▼──────────────────────▼────┐
    │                                                          │
    │  ORCHESTRATOR CORE                                      │
    │  ├─ AgentGraph (DAG-based multi-agent)                 │
    │  ├─ Model Router (decision tree)                       │
    │  ├─ Prompt Engine (versioned templates)                │
    │  ├─ Context Intelligence (adaptive boost)              │
    │  └─ Security Layer (masking + classification)          │
    │                                                          │
    └────┬─────────────────────┬──────────────────────────────┘
         │                     │
    ┌────▼────┐         ┌──────▼─────┐
    │LLM POOL │         │  POSTGRES  │
    │(GPT/o1) │         │  + REDIS   │
    └─────────┘         └────────────┘
```

### 1.2 Componentes Principais

| Componente | Responsabilidade | Nova? |
|-----------|------------------|-------|
| AI Gateway | Entrada, roteamento, quota | ✅ |
| Model Router | Decisão dinâmica modelo/tamanho | ✅ |
| Eval Pipeline | Avaliação qualidade/ação | ✅ |
| AgentGraph | DAG com dependências entre agentes | ✅ |
| Prompt Engine | Versioning + templates compostos | ✅ |
| Memory Layer | Cache semântico + histórico | ✅ |
| Context Intelligence | Boost adaptativo de relevância | ✅ |
| Security Classifier | Pré-classificação sensibilidade | ✅ |

---

## 2. MODEL ROUTER INTELIGENTE

### 2.1 Estratégia de Roteamento

**Decisão = f(tipo, tamanho contexto, criticidade, histórico)**

```typescript
// ai-intelligence/src/routing/ModelRouter.ts

import { Logger } from 'winston';

export enum AnalysisType {
  OBSERVABILITY = 'observability',
  TEST_INTELLIGENCE = 'test-intelligence',
  CICD = 'cicd',
  INCIDENT = 'incident',
  RISK = 'risk',
}

export enum Criticality {
  LOW = 'low',        // observability trends
  NORMAL = 'normal',  // most analyses
  HIGH = 'high',      // incident investigation
  CRITICAL = 'critical', // security/compliance risk
}

export interface RoutingContext {
  type: AnalysisType;
  contextSize: number;     // token estimate
  criticality: Criticality;
  requiresLocalModel?: boolean; // security classified
  userTier: 'free' | 'pro' | 'enterprise'; // billing
  recentCacheMissRate?: number; // 0-1
}

export interface ModelDecision {
  modelId: string;
  modelName: 'gpt-4o' | 'gpt-4-turbo' | 'gpt-4o-mini' | 'local-llama2' | 'o1-preview';
  temperature: number;
  maxTokens: number;
  costEstimate: number;
  reason: string;
}

export class ModelRouter {
  private readonly logger: Logger;
  private costCache: Map<string, number> = new Map();
  private routingHistory: Array<{ context: RoutingContext; decision: ModelDecision; success: boolean }> = [];

  constructor(logger: Logger) {
    this.logger = logger;
    this._initCostMatrix();
  }

  /**
   * Core routing decision tree.
   * Order matters: check constraints first, then optimize for cost/quality.
   */
  route(context: RoutingContext): ModelDecision {
    // ── Constraint 1: Security Classification
    if (context.requiresLocalModel) {
      return {
        modelId: 'llama2-13b-local',
        modelName: 'local-llama2',
        temperature: 0.3,
        maxTokens: 2000,
        costEstimate: 0.001,
        reason: 'Security classified: requires local/on-prem model',
      };
    }

    // ── Constraint 2: Billing Tier
    if (context.userTier === 'free' && context.criticality === 'CRITICAL') {
      return {
        modelId: 'gpt-4o-mini',
        modelName: 'gpt-4o-mini',
        temperature: 0.5,
        maxTokens: 1500,
        costEstimate: 0.005,
        reason: 'Free tier: critical analyses use cost-optimized path',
      };
    }

    // ── Decision Tree: Type → Criticality → Context Size
    switch (context.type) {
      case AnalysisType.OBSERVABILITY:
        return this._routeObservability(context);

      case AnalysisType.TEST_INTELLIGENCE:
        return this._routeTestIntelligence(context);

      case AnalysisType.CICD:
        return this._routeCICD(context);

      case AnalysisType.INCIDENT:
        return this._routeIncident(context);

      case AnalysisType.RISK:
        return this._routeRisk(context);

      default:
        throw new Error(`Unknown analysis type: ${context.type}`);
    }
  }

  private _routeObservability(ctx: RoutingContext): ModelDecision {
    // Observability = trend detection + pattern matching
    // Lighter model OK since patterns are relatively stable
    if (ctx.contextSize < 1000) {
      return this._decision('gpt-4o-mini', 0.4, 1000, 'Observability: small context');
    }
    return this._decision('gpt-4o', 0.5, 2000, 'Observability: medium/large context');
  }

  private _routeTestIntelligence(ctx: RoutingContext): ModelDecision {
    // Test intelligence needs code understanding + recommendations
    // Benefit from stronger model for test generation
    if (ctx.criticality === 'CRITICAL') {
      return this._decision('gpt-4-turbo', 0.3, 2000, 'Test intelligence: critical');
    }
    if (ctx.contextSize > 3000 && ctx.criticality === 'HIGH') {
      return this._decision('gpt-4-turbo', 0.4, 2500, 'Test intelligence: large critical');
    }
    return this._decision('gpt-4o', 0.5, 2000, 'Test intelligence: standard');
  }

  private _routeIncident(ctx: RoutingContext): ModelDecision {
    // Incident investigation = highest priority, needs strong reasoning
    // Use o1-preview for complex root cause analysis
    if (ctx.criticality === 'CRITICAL' && ctx.contextSize > 2000) {
      return this._decision('o1-preview', 0.2, 3000, 'Incident: o1 for deep reasoning');
    }
    return this._decision('gpt-4-turbo', 0.3, 2500, 'Incident: turbo for reasoning');
  }

  private _routeRisk(ctx: RoutingContext): ModelDecision {
    // Risk assessment = high precision required, compliance critical
    if (ctx.criticality === 'CRITICAL') {
      return this._decision('gpt-4-turbo', 0.2, 2500, 'Risk: compliance-grade');
    }
    return this._decision('gpt-4o', 0.4, 2000, 'Risk: standard');
  }

  private _routeCICD(ctx: RoutingContext): ModelDecision {
    // CI/CD = automation heavy, cost sensitive
    if (ctx.criticality === 'HIGH' || ctx.userTier === 'enterprise') {
      return this._decision('gpt-4o', 0.5, 2000, 'CI/CD: high priority');
    }
    return this._decision('gpt-4o-mini', 0.6, 1500, 'CI/CD: cost optimized');
  }

  private _decision(
    modelName: any,
    temperature: number,
    maxTokens: number,
    reason: string,
  ): ModelDecision {
    const cost = this.costCache.get(modelName) || 0.02;
    return {
      modelId: `openai-${modelName}`,
      modelName,
      temperature,
      maxTokens,
      costEstimate: (cost * maxTokens) / 1000,
      reason,
    };
  }

  private _initCostMatrix() {
    // Cost per 1K tokens (input/output avg)
    this.costCache.set('gpt-4o-mini', 0.005);
    this.costCache.set('gpt-4o', 0.015);
    this.costCache.set('gpt-4-turbo', 0.02);
    this.costCache.set('o1-preview', 0.08);
    this.costCache.set('local-llama2', 0.001);
  }

  /**
   * Learning: track success rates by routing decision
   * Use to adjust thresholds over time
   */
  recordOutcome(context: RoutingContext, decision: ModelDecision, evalScore: number) {
    this.routingHistory.push({
      context,
      decision,
      success: evalScore >= 0.8,
    });

    // Prune history > 1000 entries
    if (this.routingHistory.length > 1000) {
      this.routingHistory = this.routingHistory.slice(-800);
    }

    // Log anomalies
    if (evalScore < 0.6) {
      this.logger.warn('Router decision led to low eval score', {
        context,
        decision,
        evalScore,
      });
    }
  }

  /**
   * Return routing statistics for monitoring
   */
  getStats() {
    const success = this.routingHistory.filter((h) => h.success).length;
    return {
      totalDecisions: this.routingHistory.length,
      successRate: success / (this.routingHistory.length || 1),
      costAverage: this.routingHistory.reduce((sum, h) => sum + h.decision.costEstimate, 0)
        / (this.routingHistory.length || 1),
    };
  }
}
```

### 2.2 Integração com AIOrchestrator

```typescript
// ai-intelligence/src/orchestrator/AIOrchestrator.ts (modificado)

export class AIOrchestrator {
  private readonly router: ModelRouter;
  private readonly llm: LLMClient;
  // ... resto dos analyzers

  constructor(repository: AnalysisRepository, logger: Logger) {
    this.router = new ModelRouter(logger);
    this.llm = new LLMClient();
    // ...
  }

  async analyze(request: AnalysisRequest): Promise<AnalysisResult> {
    const routingContext: RoutingContext = {
      type: request.type as AnalysisType,
      contextSize: request.contextEstimate || 2000,
      criticality: this._mapToCriticality(request),
      requiresLocalModel: false,
      userTier: 'enterprise',
    };

    const modelDecision = this.router.route(routingContext);
    logger.info('Model decision', { decision: modelDecision });

    // Usa decisão para parametrizar LLMClient
    const result = await this._executeWithModel(request, modelDecision);

    // Feedback loop: registra sucesso/fracasso
    this.router.recordOutcome(routingContext, modelDecision, result.qualityScore);

    return result;
  }
}
```

---

## 3. EVAL PIPELINE

### 3.1 Estratégia de Avaliação

**Cada análise passa por 3 dimensões de qualidade:**

| Dimensão | Métrica | Exemplos |
|----------|---------|----------|
| **Quality** | ROUGE-L, Factuality, Coherence | Resposta cobre os pontos principais? |
| **Actionability** | Recomendação executável? | Tem passos claros? Tem confiança? |
| **Consistency** | Alinhamento com análises anteriores? | Contradiz alguma conclusão anterior? |

### 3.2 Código: Eval Framework

```typescript
// ai-intelligence/src/eval/EvalPipeline.ts

export interface EvalDatapoint {
  id: string;
  analysisType: AnalysisType;
  input: {
    contextChunks: string[];
    query: string;
  };
  expectedOutput: {
    keyPoints: string[]; // 3-5 pontos principais esperados
    recommendedActions: string[];
    riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  };
  generatedOutput: {
    keyPoints: string[];
    recommendedActions: string[];
    riskLevel?: string;
    confidence: number;
  };
}

export interface EvalScore {
  quality: number;        // 0-1
  actionability: number;  // 0-1
  consistency: number;    // 0-1
  overall: number;        // weighted average
  breakdown: {
    rougeL: number;
    factualityCheck: boolean;
    coherence: number;
  };
}

export class EvalPipeline {
  private readonly llm: LLMClient;
  private readonly repository: AnalysisRepository;
  private readonly logger: Logger;

  constructor(llm: LLMClient, repo: AnalysisRepository, logger: Logger) {
    this.llm = llm;
    this.repository = repo;
    this.logger = logger;
  }

  /**
   * Evaluate a single analysis against expected output
   */
  async evaluate(datapoint: EvalDatapoint): Promise<EvalScore> {
    const [qualityScore, actionabilityScore, consistencyScore] = await Promise.all([
      this._evalQuality(datapoint),
      this._evalActionability(datapoint),
      this._evalConsistency(datapoint),
    ]);

    const weights = { quality: 0.5, actionability: 0.3, consistency: 0.2 };
    const overall = 
      qualityScore * weights.quality +
      actionabilityScore * weights.actionability +
      consistencyScore * weights.consistency;

    return {
      quality: qualityScore,
      actionability: actionabilityScore,
      consistency: consistencyScore,
      overall,
      breakdown: {
        rougeL: this._computeRougeLScore(datapoint),
        factualityCheck: await this._checkFactuality(datapoint),
        coherence: await this._checkCoherence(datapoint),
      },
    };
  }

  private async _evalQuality(dp: EvalDatapoint): Promise<number> {
    // Check if generated output covers expected key points
    const prompt = `
You are an expert evaluator. Rate how well the generated output covers the expected key points.

Expected key points:
${dp.expectedOutput.keyPoints.map((k, i) => `${i + 1}. ${k}`).join('\n')}

Generated key points:
${dp.generatedOutput.keyPoints.map((k, i) => `${i + 1}. ${k}`).join('\n')}

Rate on 0-100 scale. Return JSON: { "score": <number> }
    `;

    const response = await this.llm.call({
      systemPrompt: 'You are a quality evaluator for AI-generated analysis.',
      userPrompt: prompt,
    });

    try {
      const parsed = JSON.parse(response.content);
      return Math.min(100, Math.max(0, parsed.score)) / 100;
    } catch {
      this.logger.error('Quality eval parse error', { response: response.content });
      return 0.5;
    }
  }

  private async _evalActionability(dp: EvalDatapoint): Promise<number> {
    // Check if recommendations are specific, executable
    const prompt = `
Evaluate if these recommendations are actionable (specific, executable, measurable):

${dp.generatedOutput.recommendedActions.map((a, i) => `${i + 1}. ${a}`).join('\n')}

Rate 0-100. Consider:
- Are they specific enough? (no vague statements)
- Can they be executed? (not just wishful thinking)
- Are there success metrics? (measurable)

Return JSON: { "score": <number>, "reason": "<brief reason>" }
    `;

    const response = await this.llm.call({
      systemPrompt: 'You are an actionability expert.',
      userPrompt: prompt,
    });

    try {
      const parsed = JSON.parse(response.content);
      return Math.min(100, Math.max(0, parsed.score)) / 100;
    } catch {
      return 0.5;
    }
  }

  private async _evalConsistency(dp: EvalDatapoint): Promise<number> {
    // Check against recent analyses of same type
    const recent = await this.repository.findRecent(dp.analysisType, 5);
    
    if (recent.length === 0) {
      return 1.0; // No history to check against
    }

    const prompt = `
Compare this new recommendation against recent similar analyses.

Recent conclusions:
${recent.map((r, i) => `${i + 1}. ${r.summary}`).join('\n')}

New recommendation:
${dp.generatedOutput.recommendedActions.join('\n')}

Do they align? (0 = contradictory, 50 = partially aligned, 100 = fully aligned)
Return JSON: { "score": <number>, "conflicts": [<list of contradictions if any>] }
    `;

    const response = await this.llm.call({
      systemPrompt: 'You are a consistency checker.',
      userPrompt: prompt,
    });

    try {
      const parsed = JSON.parse(response.content);
      if (parsed.conflicts && parsed.conflicts.length > 0) {
        this.logger.warn('Consistency issues detected', { conflicts: parsed.conflicts });
      }
      return Math.min(100, Math.max(0, parsed.score)) / 100;
    } catch {
      return 0.5;
    }
  }

  private _computeRougeLScore(dp: EvalDatapoint): number {
    // Simplified ROUGE-L: longest common subsequence ratio
    const expected = dp.expectedOutput.keyPoints.join(' ');
    const generated = dp.generatedOutput.keyPoints.join(' ');
    return this._lcs(expected, generated) / Math.max(expected.length, generated.length);
  }

  private async _checkFactuality(dp: EvalDatapoint): Promise<boolean> {
    // Check if recommendations don't contradict input context
    const contextStr = dp.input.contextChunks.join('\n');
    const prompt = `
Does the following recommendation align with the provided context? Return true/false.

Context:
${contextStr}

Recommendation:
${dp.generatedOutput.recommendedActions.join('\n')}

Return JSON: { "aligned": <boolean>, "issues": [<list if not aligned>] }
    `;

    try {
      const response = await this.llm.call({
        systemPrompt: 'You are a factuality checker.',
        userPrompt: prompt,
      });
      const parsed = JSON.parse(response.content);
      return parsed.aligned === true;
    } catch {
      return false;
    }
  }

  private async _checkCoherence(dp: EvalDatapoint): Promise<number> {
    // Check internal consistency: recommendations don't conflict
    const prompt = `
Rate the internal coherence of these recommendations (do they conflict? are they logically consistent?):

${dp.generatedOutput.recommendedActions.map((a, i) => `${i + 1}. ${a}`).join('\n')}

Rate 0-100. Return JSON: { "score": <number> }
    `;

    try {
      const response = await this.llm.call({
        systemPrompt: 'You rate coherence.',
        userPrompt: prompt,
      });
      const parsed = JSON.parse(response.content);
      return Math.min(100, Math.max(0, parsed.score)) / 100;
    } catch {
      return 0.5;
    }
  }

  private _lcs(s1: string, s2: string): number {
    const m = s1.length, n = s2.length;
    const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (s1[i - 1] === s2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }
    return dp[m][n];
  }
}
```

### 3.3 Datasets & Test Harness

```typescript
// ai-intelligence/tests/eval/datasets.ts

export const EVAL_DATASETS = {
  observability: [
    {
      id: 'obs_001',
      input: {
        contextChunks: [
          'P95 latency increased from 200ms to 500ms in last hour',
          'Error rate steady at 0.1%',
          'CPU usage normal (45%)',
        ],
        query: 'Identify the root cause',
      },
      expected: {
        keyPoints: [
          'P95 latency spike is the primary signal',
          'Consistent error rate suggests no cascading failures',
          'Root cause likely in backend service, not infrastructure',
        ],
        recommendedActions: [
          'Check database query logs for slow queries (sort by duration)',
          'Review deployment changes in last 90 minutes',
          'Profile the top 5 slowest endpoints',
        ],
        riskLevel: 'medium',
      },
    },
    // ... mais datapoints
  ],
  
  incident: [
    {
      id: 'inc_001',
      input: {
        contextChunks: [
          'Outage started 14:32 UTC',
          'All API endpoints returning 503',
          'Database connection pool exhausted',
          'Recent change: increased max connections from 100 to 150',
        ],
        query: 'Root cause and immediate mitigation',
      },
      expected: {
        keyPoints: [
          'Connection pool exhaustion is the immediate cause',
          'Increased max connections contradicts observed exhaustion',
          'Likely a connection leak introduced recently',
        ],
        recommendedActions: [
          'IMMEDIATE: Restart database service',
          'IMMEDIATE: Revert recent connection pool changes',
          'URGENT: Investigate connection leak in code (recent commits)',
          'POST: Add monitoring for connection pool usage',
        ],
        riskLevel: 'critical',
      },
    },
  ],

  // ... risk, test-intelligence, cicd datasets
};

// Test harness
describe('EvalPipeline', () => {
  let eval: EvalPipeline;
  let results: EvalScore[] = [];

  before(() => {
    eval = new EvalPipeline(
      new LLMClient(),
      new AnalysisRepository(),
      logger,
    );
  });

  it('should evaluate observability dataset', async () => {
    for (const datapoint of EVAL_DATASETS.observability) {
      const score = await eval.evaluate(datapoint);
      results.push(score);

      // Assert minimum thresholds
      expect(score.overall).toBeGreaterThan(0.75);
      expect(score.quality).toBeGreaterThan(0.70);
      expect(score.actionability).toBeGreaterThan(0.70);
    }

    // Log summary
    const avgScore = results.reduce((s, r) => s + r.overall, 0) / results.length;
    console.log(`Observability eval: ${(avgScore * 100).toFixed(1)}%`);
  });
});
```

---

## 4. OBSERVABILIDADE DE IA

### 4.1 Métricas Críticas

```typescript
// ai-intelligence/src/observability/AIMetrics.ts

export interface AIMetrics {
  // Latência
  'ai.analysis.duration_ms': number;
  'ai.llm_call.duration_ms': number;
  'ai.context_pipeline.duration_ms': number;

  // Custo
  'ai.llm.tokens_used': number;
  'ai.llm.estimated_cost_usd': number;
  'ai.llm.cost_per_analysis': number;

  // Qualidade
  'ai.analysis.eval_score': number; // 0-1
  'ai.analysis.quality_score': number;
  'ai.analysis.actionability_score': number;

  // Fallbacks
  'ai.llm.fallback_used': boolean;
  'ai.llm.retry_count': number;
  'ai.context.chunks_dropped': number;

  // Routing
  'ai.router.model_selected': string;
  'ai.router.decision_reason': string;

  // Memory/Cache
  'ai.memory.cache_hit': boolean;
  'ai.memory.cache_hit_rate': number;

  // Errors
  'ai.error.type': string | null;
  'ai.error.count': number;
}

export class AIMetricsCollector {
  private metrics: Partial<AIMetrics> = {};
  private startTimes: Map<string, number> = new Map();

  startTimer(key: string) {
    this.startTimes.set(key, Date.now());
  }

  endTimer(key: string, metricsKey: string) {
    const start = this.startTimes.get(key);
    if (!start) return;
    this.metrics[metricsKey as keyof AIMetrics] = (Date.now() - start) as any;
  }

  record(key: keyof AIMetrics, value: any) {
    this.metrics[key] = value;
  }

  getMetrics(): Partial<AIMetrics> {
    return { ...this.metrics };
  }
}
```

### 4.2 Instrumentação OpenTelemetry

```typescript
// ai-intelligence/src/observability/OTelInstrumentation.ts

import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-otlp-http';
import { PeriodicMetricReader } from '@opentelemetry/sdk-metrics';
import { OTLPMetricExporter } from '@opentelemetry/exporter-otlp-http';

export function initializeOTel(serviceName: string) {
  const sdk = new NodeSDK({
    serviceName,
    instrumentations: [getNodeAutoInstrumentations()],
    traceExporter: new OTLPTraceExporter({
      url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4317',
    }),
    metricReaders: [
      new PeriodicMetricReader({
        exporter: new OTLPMetricExporter({
          url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4317',
        }),
      }),
    ],
  });

  sdk.start();
  console.log('OpenTelemetry initialized');

  return sdk;
}

// Usage in LLMClient
import { trace, context, metrics } from '@opentelemetry/api';

const tracer = trace.getTracer('ai-intelligence/llm');
const meter = metrics.getMeter('ai-intelligence/llm');

export class LLMClientWithOTel extends LLMClient {
  async call(options: LLMCallOptions): Promise<LLMResponse> {
    const span = tracer.startSpan('llm.call', {
      attributes: {
        'llm.model': options.useFallback ? 'gpt-4o-mini' : 'gpt-4o',
        'llm.has_budget_stats': !!options.budgetStats,
      },
    });

    return context.with(trace.setSpan(context.active(), span), async () => {
      const tokenCounter = meter.createCounter('llm_tokens_total');
      const latencyHistogram = meter.createHistogram('llm_call_duration_ms');

      try {
        const startTime = Date.now();
        const response = await super.call(options);

        latencyHistogram.record(response.durationMs, {
          'llm.status': 'success',
          'llm.model': response.model,
        });

        tokenCounter.add(response.tokensUsed, {
          'llm.model': response.model,
        });

        span.addEvent('llm.call.success', {
          'llm.tokens': response.tokensUsed,
          'llm.duration_ms': response.durationMs,
        });

        return response;

      } catch (error) {
        span.recordException(error as Error);
        span.setStatus({ code: 2 }); // ERROR
        throw error;

      } finally {
        span.end();
      }
    });
  }
}
```

### 4.3 Dashboards Prometheus

```yaml
# prometheus/ai-metrics.yml
groups:
  - name: ai_intelligence
    interval: 30s
    rules:
      - alert: HighLLMLatency
        expr: histogram_quantile(0.99, llm_call_duration_ms) > 10000
        for: 5m
        annotations:
          summary: "LLM p99 latency > 10s"

      - alert: HighCostPerAnalysis
        expr: ai_cost_per_analysis_usd > 0.50
        for: 10m
        annotations:
          summary: "Analysis cost exceeding $0.50"

      - alert: LowEvalScore
        expr: ai_analysis_eval_score < 0.70
        for: 5m
        annotations:
          summary: "Analysis eval score < 70%"

      - alert: HighFallbackRate
        expr: rate(ai_llm_fallback_used[5m]) > 0.2
        annotations:
          summary: "LLM fallback rate > 20%"
```

---

## 5. EVOLUÇÃO MULTI-AGENT → AGENT GRAPH

### 5.1 Arquitetura DAG

**Atual:** Executam em paralelo, síntese manual  
**Novo:** Graph com dependências, encadeamento automático

```typescript
// ai-intelligence/src/agents/AgentGraph.ts

export interface AgentNode {
  id: string;
  name: string;
  type: 'analyzer' | 'filter' | 'synthesizer' | 'evaluator';
  dependencies: string[]; // IDs dos nodes que devem executar antes
  analyzer: IAnalyzer;
}

export interface AgentGraphState {
  nodeResults: Map<string, unknown>;
  errors: Map<string, Error>;
  metrics: Map<string, number>;
  executionOrder: string[];
}

export class AgentGraph {
  private nodes: Map<string, AgentNode> = new Map();
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  addNode(node: AgentNode) {
    // Validar que dependências existem
    for (const dep of node.dependencies) {
      if (!this.nodes.has(dep) && this.nodes.size > 0) {
        throw new Error(`Dependency ${dep} not found`);
      }
    }
    this.nodes.set(node.id, node);
  }

  /**
   * Topological sort + execution
   */
  async execute(input: AnalysisRequest): Promise<AgentGraphState> {
    const state: AgentGraphState = {
      nodeResults: new Map(),
      errors: new Map(),
      metrics: new Map(),
      executionOrder: [],
    };

    const order = this._topologicalSort();
    this.logger.info('Execution order', { order });

    for (const nodeId of order) {
      const node = this.nodes.get(nodeId)!;
      
      try {
        const startTime = Date.now();

        // Prepare input: merge results from dependencies
        const nodeInput = this._prepareNodeInput(input, node, state);

        // Execute
        const result = await node.analyzer.analyze(nodeInput);

        state.nodeResults.set(nodeId, result);
        state.executionOrder.push(nodeId);
        state.metrics.set(`${nodeId}.duration_ms`, Date.now() - startTime);

        this.logger.info(`Node ${nodeId} executed`, {
          durationMs: state.metrics.get(`${nodeId}.duration_ms`),
        });

      } catch (error) {
        state.errors.set(nodeId, error as Error);
        this.logger.error(`Node ${nodeId} failed`, { error });

        // Decision: fail-fast or continue?
        if (this._isCritical(node)) {
          throw error; // Critical node failure → abort
        }
        // Non-critical: continue
      }
    }

    return state;
  }

  private _topologicalSort(): string[] {
    const visited = new Set<string>();
    const stack: string[] = [];

    const visit = (nodeId: string) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);

      const node = this.nodes.get(nodeId)!;
      for (const dep of node.dependencies) {
        visit(dep);
      }

      stack.push(nodeId);
    };

    for (const nodeId of this.nodes.keys()) {
      visit(nodeId);
    }

    return stack;
  }

  private _prepareNodeInput(
    input: AnalysisRequest,
    node: AgentNode,
    state: AgentGraphState,
  ): unknown {
    // Merge input with results from dependencies
    return {
      ...input,
      context: {
        ...input,
        dependencies: Object.fromEntries(
          node.dependencies.map((dep) => [dep, state.nodeResults.get(dep)]),
        ),
      },
    };
  }

  private _isCritical(node: AgentNode): boolean {
    // Tipos críticos que devem abortar se falharem
    return ['analyzer', 'evaluator'].includes(node.type);
  }
}
```

### 5.2 Exemplo: Incident Graph

```typescript
// ai-intelligence/src/agents/graphs/IncidentGraph.ts

export class IncidentGraphBuilder {
  static build(llm: LLMClient, repo: AnalysisRepository): AgentGraph {
    const graph = new AgentGraph(logger);

    // Node 1: Data Collection (no dependencies)
    graph.addNode({
      id: 'collect_metrics',
      name: 'Collect Metrics',
      type: 'analyzer',
      dependencies: [],
      analyzer: new MetricsCollector(llm, repo),
    });

    // Node 2: Pattern Recognition (depends on metrics)
    graph.addNode({
      id: 'detect_patterns',
      name: 'Detect Patterns',
      type: 'analyzer',
      dependencies: ['collect_metrics'],
      analyzer: new PatternDetector(llm),
    });

    // Node 3: Root Cause Analysis (depends on patterns)
    graph.addNode({
      id: 'root_cause_analysis',
      name: 'Root Cause Analysis',
      type: 'analyzer',
      dependencies: ['detect_patterns'],
      analyzer: new RootCauseAnalyzer(llm),
    });

    // Node 4: Mitigation Strategies (depends on root cause)
    graph.addNode({
      id: 'mitigation',
      name: 'Mitigation Strategies',
      type: 'analyzer',
      dependencies: ['root_cause_analysis'],
      analyzer: new MitigationPlanner(llm),
    });

    // Node 5: Validation (depends on mitigation)
    graph.addNode({
      id: 'validate',
      name: 'Validate Recommendations',
      type: 'evaluator',
      dependencies: ['mitigation'],
      analyzer: new RecommendationValidator(llm),
    });

    // Node 6: Synthesize (final)
    graph.addNode({
      id: 'synthesize',
      name: 'Synthesize Report',
      type: 'synthesizer',
      dependencies: ['validate'],
      analyzer: new IncidentReportSynthesizer(),
    });

    return graph;
  }
}

// Usage
const graph = IncidentGraphBuilder.build(llm, repo);
const state = await graph.execute(incidentRequest);
const report = state.nodeResults.get('synthesize');
```

---

## 6. PROMPT ENGINE

### 6.1 Versionamento & Templates

```typescript
// ai-intelligence/src/prompts/PromptEngine.ts

export interface PromptTemplate {
  id: string;
  version: number;
  type: AnalysisType;
  name: string;
  system: string;   // System prompt (fixed instructions)
  context: string;  // Placeholder for dynamic context
  rules: string;    // Hard constraints
  examples?: string; // Few-shot examples (optional)
  createdAt: Date;
  updatedAt: Date;
  metrics?: {
    avgScore: number;
    samplesEvaluated: number;
  };
}

export class PromptEngine {
  private templates: Map<string, PromptTemplate[]> = new Map();
  private repository: PromptRepository;
  private logger: Logger;

  constructor(repository: PromptRepository, logger: Logger) {
    this.repository = repository;
    this.logger = logger;
  }

  /**
   * Register a template version
   */
  async registerTemplate(template: PromptTemplate): Promise<void> {
    const key = `${template.type}:${template.name}`;
    
    if (!this.templates.has(key)) {
      this.templates.set(key, []);
    }

    const versions = this.templates.get(key)!;
    template.version = (versions[versions.length - 1]?.version ?? 0) + 1;
    versions.push(template);

    await this.repository.save(template);
    this.logger.info('Prompt template registered', { templateId: template.id, version: template.version });
  }

  /**
   * Get the best performing version
   */
  async getTemplate(type: AnalysisType, name: string): Promise<PromptTemplate> {
    const key = `${type}:${name}`;
    const versions = this.templates.get(key);

    if (!versions || versions.length === 0) {
      throw new Error(`No template found for ${key}`);
    }

    // Return highest version with best eval score
    return versions.reduce((best, current) => {
      const bestScore = best.metrics?.avgScore ?? 0;
      const currentScore = current.metrics?.avgScore ?? 0;
      return currentScore > bestScore ? current : best;
    });
  }

  /**
   * Compose final prompt from template + runtime context
   */
  composePrompt(
    template: PromptTemplate,
    context: {
      chunks: string[];
      query: string;
      constraints?: Record<string, unknown>;
    },
  ): { system: string; user: string } {
    const systemPrompt = [
      template.system,
      template.rules,
      template.examples ? `\nEXAMPLES:\n${template.examples}` : '',
    ]
      .filter(Boolean)
      .join('\n\n');

    const userPrompt = [
      template.context
        .replace('{{CHUNKS}}', context.chunks.join('\n---\n'))
        .replace('{{QUERY}}', context.query),
      context.constraints ? `\nCONSTRAINTS:\n${JSON.stringify(context.constraints, null, 2)}` : '',
    ]
      .filter(Boolean)
      .join('\n\n');

    return { system: systemPrompt, user: userPrompt };
  }

  /**
   * A/B test templates
   */
  async compareTemplates(
    type: AnalysisType,
    name1: string,
    name2: string,
    testData: Array<{ chunks: string[]; query: string }>,
  ): Promise<{ winner: string; improvement: number }> {
    const t1 = await this.getTemplate(type, name1);
    const t2 = await this.getTemplate(type, name2);

    let t1Score = 0, t2Score = 0;

    for (const testCase of testData) {
      const p1 = this.composePrompt(t1, testCase);
      const p2 = this.composePrompt(t2, testCase);

      // Run both through LLM
      const [r1, r2] = await Promise.all([
        this.llm.call({ systemPrompt: p1.system, userPrompt: p1.user }),
        this.llm.call({ systemPrompt: p2.system, userPrompt: p2.user }),
      ]);

      // Score outputs
      t1Score += await this._scoreResponse(r1.content, testCase);
      t2Score += await this._scoreResponse(r2.content, testCase);
    }

    const avgT1 = t1Score / testData.length;
    const avgT2 = t2Score / testData.length;
    const improvement = ((avgT2 - avgT1) / avgT1) * 100;

    return {
      winner: improvement > 0 ? name2 : name1,
      improvement: Math.abs(improvement),
    };
  }

  private async _scoreResponse(content: string, testCase: { chunks: string[]; query: string }): Promise<number> {
    // Implement scoring logic
    return 0.5;
  }
}
```

### 6.2 Templates Pré-definidos

```typescript
// ai-intelligence/src/prompts/templates/incident.template.ts

export const INCIDENT_INVESTIGATION_TEMPLATE: PromptTemplate = {
  id: 'incident-investigation-v1',
  version: 1,
  type: AnalysisType.INCIDENT,
  name: 'investigation',
  
  system: `You are a senior incident commander. Your job is to investigate production incidents 
and provide clear root cause analysis with actionable mitigation steps.

Decision framework:
1. What happened? (symptom)
2. When did it start? (timeline)
3. What changed? (root cause candidates)
4. How do we fix it NOW? (immediate mitigation)
5. How do we prevent it? (long-term fix)

Be concise. Prioritize urgency and impact.`,

  rules: `CRITICAL RULES:
- Always propose an immediate action if the incident is CRITICAL
- Never recommend a mitigation that requires more than 30 minutes to implement
- If unsure about root cause, say "unknown" and list investigation steps
- Always estimate impact (how many users affected, how long outage)
- Provide rollback instructions for any mitigation`,

  context: `Context from logs and metrics:

{{CHUNKS}}

Question: {{QUERY}}`,

  examples: `EXAMPLE 1:
Symptom: All API endpoints return 503
Root Cause: Database connection pool exhausted
Immediate Action: Restart database service (5 min downtime)
Investigation: Check for connection leaks in recent deployments

EXAMPLE 2:
Symptom: P99 latency spike
Root Cause: Unoptimized query on new feature
Immediate Action: Disable new feature flag
Investigation: Review query execution plan, add indexes`,
};
```

---

## 7. CONTEXT INTELLIGENCE ADAPTATIVO

### 7.1 Boost Dinâmico de Relevância

```typescript
// ai-intelligence/src/context/ContextIntelligence.ts

export interface ContextChunkWithMetadata extends ContextChunk {
  relevanceScore: number;
  successHistoryRate: number; // % of times this chunk led to high-scoring output
  recency: number; // 0-1, newer = closer to 1
  temporalBias?: number; // Boost for recent patterns
}

export class ContextIntelligence {
  private readonly repository: AnalysisRepository;
  private readonly redis: RedisClient;
  private readonly logger: Logger;

  constructor(repository: AnalysisRepository, redis: RedisClient, logger: Logger) {
    this.repository = repository;
    this.redis = redis;
    this.logger = logger;
  }

  /**
   * Adaptive boosting based on:
   * - Historical success rate (this chunk → high-quality output)
   * - Temporal pattern (if analysis type has recent success with this chunk)
   * - Context similarity (semantic distance to query)
   */
  async boostChunks(
    chunks: ContextChunkWithMetadata[],
    query: string,
    analysisType: AnalysisType,
  ): Promise<ContextChunkWithMetadata[]> {
    const boostFactors = await Promise.all(
      chunks.map((chunk) => this._computeBoostFactor(chunk, query, analysisType)),
    );

    return chunks.map((chunk, i) => ({
      ...chunk,
      relevanceScore: chunk.relevanceScore * boostFactors[i],
    }));
  }

  private async _computeBoostFactor(
    chunk: ContextChunkWithMetadata,
    query: string,
    analysisType: AnalysisType,
  ): Promise<number> {
    // Base boost = 1.0
    let boost = 1.0;

    // ── Factor 1: Historical Success Rate
    const successRate = chunk.successHistoryRate;
    if (successRate > 0.8) {
      boost *= 1.3; // +30% for proven chunks
    } else if (successRate < 0.5) {
      boost *= 0.7; // -30% for problematic chunks
    }

    // ── Factor 2: Recency Bias
    if (chunk.recency > 0.9) {
      boost *= 1.15; // Recent data is valuable
    }

    // ── Factor 3: Analysis-Type Affinity
    const typeAffinity = await this._getTypeAffinity(chunk, analysisType);
    boost *= typeAffinity; // 0.8 - 1.2

    // ── Factor 4: Query Similarity (cache)
    const similarityCache = `similarity:${hashQuery(query)}:${chunk.id}`;
    let similarity = await this.redis.get(similarityCache);

    if (!similarity) {
      similarity = await this._computeSemanticSimilarity(chunk.data, query);
      await this.redis.set(similarityCache, similarity, { EX: 3600 });
    }

    boost *= (0.8 + similarity * 0.4); // Range: 0.8 - 1.2

    this.logger.debug('Chunk boost computed', {
      chunkId: chunk.id,
      baseScore: chunk.relevanceScore,
      boost: boost.toFixed(2),
      factors: { successRate, recency: chunk.recency, typeAffinity, similarity },
    });

    return boost;
  }

  private async _getTypeAffinity(
    chunk: ContextChunkWithMetadata,
    type: AnalysisType,
  ): Promise<number> {
    // Check: for this analysis type, how often does this chunk type appear in high-scoring outputs?
    const cacheKey = `affinity:${type}:${chunk.metadata?.sourceType || 'unknown'}`;
    
    let affinity = parseFloat(await this.redis.get(cacheKey) || '1.0');

    if (affinity === 1.0) {
      // Compute if not cached
      const successes = await this.repository.query(
        `SELECT COUNT(*) as cnt FROM analysis_outputs 
         WHERE type = $1 AND eval_score > 0.8 
         AND context_chunks @> $2`,
        [type, JSON.stringify([chunk.metadata])],
      );

      const total = await this.repository.query(
        `SELECT COUNT(*) as cnt FROM analysis_outputs WHERE type = $1`,
        [type],
      );

      affinity = total.rows[0].cnt > 0 ? successes.rows[0].cnt / total.rows[0].cnt : 1.0;
      await this.redis.set(cacheKey, affinity.toString(), { EX: 86400 }); // 24h
    }

    return 0.8 + affinity * 0.4; // Range: 0.8 - 1.2
  }

  private async _computeSemanticSimilarity(text: string, query: string): Promise<number> {
    // Use embedding-based similarity (Jaccard as fallback)
    const textTokens = new Set(text.toLowerCase().split(/\s+/));
    const queryTokens = new Set(query.toLowerCase().split(/\s+/));

    const intersection = new Set([...textTokens].filter((t) => queryTokens.has(t)));
    const union = new Set([...textTokens, ...queryTokens]);

    return intersection.size / union.size;
  }
}

function hashQuery(q: string): string {
  return require('crypto').createHash('sha256').update(q).digest('hex');
}
```

---

## 8. SEGURANÇA AVANÇADA

### 8.1 Security Classifier

```typescript
// ai-intelligence/src/security/SecurityClassifier.ts

export enum SensitivityLevel {
  PUBLIC = 'public',        // OK para modelo cloud
  INTERNAL = 'internal',    // Empresa, mas não confidencial
  CONFIDENTIAL = 'confidential', // NDA/propriedade
  RESTRICTED = 'restricted', // PII/LGPD/segurança
}

export class SecurityClassifier {
  private readonly llm: LLMClient;
  private readonly logger: Logger;
  private patterns: Map<SensitivityLevel, RegExp[]> = new Map();

  constructor(llm: LLMClient, logger: Logger) {
    this.llm = llm;
    this.logger = logger;
    this._initPatterns();
  }

  async classify(text: string): Promise<SensitivityLevel> {
    // ── Rule-based: fast path
    for (const [level, regexps] of this.patterns) {
      if (regexps.some((r) => r.test(text))) {
        this.logger.info('Text classified by rule', { level });
        return level;
      }
    }

    // ── ML-based: slow path (for ambiguous cases)
    const response = await this.llm.call({
      systemPrompt: `Classify the sensitivity level of this text.
Respond with JSON: { "level": "public" | "internal" | "confidential" | "restricted" }`,
      userPrompt: `Text:\n${text.substring(0, 2000)}`, // Limit token usage
    });

    try {
      const parsed = JSON.parse(response.content);
      const level = parsed.level as SensitivityLevel;
      this.logger.info('Text classified by LLM', { level });
      return level;
    } catch {
      // Default to conservative
      return SensitivityLevel.RESTRICTED;
    }
  }

  private _initPatterns() {
    // RESTRICTED: PII, LGPD, keys
    this.patterns.set(SensitivityLevel.RESTRICTED, [
      /(?:cpf|cnpj)[\s:=]*\d+/gi,
      /(?:email|mail)[\s:=]*[\w\.-]+@[\w\.-]+/gi,
      /(?:password|senha|token|key|secret)[\s:=]*[\w\-\.]+/gi,
      /(?:credit card|cartão)[\s:=]*\d{4}[\s-]*\d{4}/gi,
      /(?:phone|celular|telefone)[\s:=]*[\d\s\(\)\-\+]+/gi,
    ]);

    // CONFIDENTIAL: proprietary, NDA
    this.patterns.set(SensitivityLevel.CONFIDENTIAL, [
      /(?:trade secret|segredo comercial|proprietary)/gi,
      /(?:nda|confidential|confidencial)/gi,
      /(?:internal only|apenas internamente)/gi,
    ]);

    // INTERNAL: company names, team info
    this.patterns.set(SensitivityLevel.INTERNAL, [
      /patrimônio 360|patrimonio|company name/gi,
    ]);

    // PUBLIC: all others
    this.patterns.set(SensitivityLevel.PUBLIC, []);
  }

  /**
   * Mask sensitive data
   */
  mask(text: string, level: SensitivityLevel): string {
    if (level === SensitivityLevel.PUBLIC) {
      return text;
    }

    let masked = text;

    // Replace patterns with redacted
    for (const [masklevel, regexps] of this.patterns) {
      if (masklevel !== SensitivityLevel.PUBLIC) {
        regexps.forEach((r) => {
          masked = masked.replace(r, '[REDACTED]');
        });
      }
    }

    return masked;
  }
}
```

### 8.2 Roteamento Seguro

```typescript
// ai-intelligence/src/security/SecureRouter.ts

export class SecureRouter {
  private readonly classifier: SecurityClassifier;
  private readonly modelRouter: ModelRouter;
  private readonly logger: Logger;

  constructor(
    classifier: SecurityClassifier,
    modelRouter: ModelRouter,
    logger: Logger,
  ) {
    this.classifier = classifier;
    this.modelRouter = modelRouter;
    this.logger = logger;
  }

  async routeSecurely(
    request: AnalysisRequest,
    context: string,
  ): Promise<{ model: ModelDecision; masked: boolean; reason: string }> {
    // ── Step 1: Classify sensitivity
    const sensitivity = await this.classifier.classify(context);

    // ── Step 2: Determine if masking/local model needed
    let requiresLocalModel = false;
    let shouldMask = false;
    let reason = '';

    switch (sensitivity) {
      case SensitivityLevel.RESTRICTED:
        requiresLocalModel = true;
        shouldMask = true;
        reason = 'PII/LGPD data detected: routing to local model';
        break;

      case SensitivityLevel.CONFIDENTIAL:
        shouldMask = true;
        reason = 'Confidential data: masking before cloud LLM';
        break;

      case SensitivityLevel.INTERNAL:
      case SensitivityLevel.PUBLIC:
        // OK for cloud LLM
        break;
    }

    // ── Step 3: Route model
    const maskContext = shouldMask ? this.classifier.mask(context, sensitivity) : context;

    const modelDecision = this.modelRouter.route({
      type: request.type,
      contextSize: maskContext.length,
      criticality: Criticality.NORMAL,
      requiresLocalModel,
      userTier: 'enterprise',
    });

    this.logger.info('Secure routing decision', {
      sensitivity,
      model: modelDecision.modelId,
      masked: shouldMask,
      reason,
    });

    return { model: modelDecision, masked: shouldMask, reason };
  }
}
```

---

## 9. MEMORY LAYER

### 9.1 Semantic Memory + LRU Cache

```typescript
// ai-intelligence/src/memory/MemoryLayer.ts

export interface AnalysisMemory {
  id: string;
  analysisId: string;
  type: AnalysisType;
  query: string;
  embedding: number[]; // Vector embedding
  result: {
    keyPoints: string[];
    recommendations: string[];
    qualityScore: number;
  };
  createdAt: Date;
  accessCount: number;
  lastAccessed: Date;
}

export class MemoryLayer {
  private readonly redis: RedisClient;
  private readonly pgVector: PostgresVectorDB;
  private readonly logger: Logger;
  private lruCache: LRU<string, AnalysisMemory>;
  private embeddingClient: EmbeddingModel;

  constructor(
    redis: RedisClient,
    pgVector: PostgresVectorDB,
    logger: Logger,
    embeddingModel: EmbeddingModel,
  ) {
    this.redis = redis;
    this.pgVector = pgVector;
    this.logger = logger;
    this.embeddingClient = embeddingModel;
    this.lruCache = new LRU({ max: 1000 });
  }

  /**
   * Store analysis in memory
   */
  async store(analysis: AnalysisResult): Promise<void> {
    const memory: AnalysisMemory = {
      id: `mem_${analysis.id}`,
      analysisId: analysis.id,
      type: analysis.type,
      query: analysis.query,
      embedding: await this.embeddingClient.embed(analysis.query),
      result: {
        keyPoints: analysis.keyPoints,
        recommendations: analysis.recommendations,
        qualityScore: analysis.qualityScore,
      },
      createdAt: new Date(),
      accessCount: 0,
      lastAccessed: new Date(),
    };

    // Store in both Redis (hot) and PostgreSQL+pgvector (cold)
    await this.redis.setex(
      `analysis:${memory.id}`,
      3600, // 1h TTL
      JSON.stringify(memory),
    );

    await this.pgVector.insert('analysis_memories', memory);
    this.lruCache.set(memory.id, memory);

    this.logger.info('Analysis stored in memory', { memoryId: memory.id });
  }

  /**
   * Retrieve similar analyses from memory (RAG-like)
   */
  async retrieve(
    query: string,
    analysisType: AnalysisType,
    topK: number = 5,
  ): Promise<AnalysisMemory[]> {
    // Try Redis first (hot cache)
    const cacheKey = `similar:${hashQuery(query)}:${analysisType}`;
    const cached = await this.redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    // Vector search in PostgreSQL
    const queryEmbedding = await this.embeddingClient.embed(query);
    const similar = await this.pgVector.vectorSearch(
      'analysis_memories',
      'embedding',
      queryEmbedding,
      {
        where: { type: analysisType },
        limit: topK,
        threshold: 0.7,
      },
    );

    // Update access count
    await Promise.all(
      similar.map((mem) =>
        this.pgVector.update('analysis_memories', mem.id, {
          accessCount: mem.accessCount + 1,
          lastAccessed: new Date(),
        }),
      ),
    );

    // Cache result
    await this.redis.setex(cacheKey, 7200, JSON.stringify(similar));

    this.logger.info('Similar analyses retrieved', {
      query,
      analysisType,
      found: similar.length,
    });

    return similar;
  }

  /**
   * Use memory to enhance new analysis
   */
  async enhanceContext(
    query: string,
    analysisType: AnalysisType,
    currentContext: ContextChunk[],
  ): Promise<ContextChunk[]> {
    const similar = await this.retrieve(query, analysisType, 3);

    if (similar.length === 0) {
      return currentContext;
    }

    // Add memory insights as synthetic chunks
    const memoryChunks: ContextChunk[] = similar.map((mem) => ({
      id: `memory:${mem.id}`,
      data: {
        type: 'memory_insight',
        from: mem.analysisId,
        keyPoints: mem.result.keyPoints,
        recommendations: mem.result.recommendations,
        qualityScore: mem.result.qualityScore,
      },
      score: 0.8 + (mem.result.qualityScore * 0.2), // Higher score if previous was high quality
      metadata: {
        sourceType: 'memory',
        retrieval: 'semantic',
        similarity: 0.8,
      },
    }));

    this.logger.info('Context enhanced with memory', {
      additionalChunks: memoryChunks.length,
    });

    return [...currentContext, ...memoryChunks];
  }
}
```

### 9.2 Integração com AIOrchestrator

```typescript
// Uso na pipeline
async analyze(request: AnalysisRequest): Promise<AnalysisResult> {
  // ── Step 1: Check memory
  let context = request.context ?? [];
  
  try {
    context = await this.memory.enhanceContext(
      request.query,
      request.type,
      context,
    );
  } catch (error) {
    this.logger.warn('Memory retrieval failed, continuing', { error });
  }

  // ── Step 2: Route + analyze
  const decision = this.router.route(/* ... */);
  const result = await this._executeAnalysis(request, decision, context);

  // ── Step 3: Store in memory
  try {
    await this.memory.store(result);
  } catch (error) {
    this.logger.warn('Memory storage failed', { error });
  }

  return result;
}
```

---

## 10. IMPLEMENTAÇÃO INCREMENTAL

### 10.1 Roadmap (Fases)

**FASE 1 (Semanas 1-2): Fundação**
- [ ] Implementar `ModelRouter` (sem histórico, baseado em regras)
- [ ] Integrar com `AIOrchestrator`
- [ ] Setup OpenTelemetry básico
- [ ] Criar estrutura de `PromptTemplate`

**FASE 2 (Semanas 3-4): Avaliação**
- [ ] Implementar `EvalPipeline` com 3 dimensões
- [ ] Criar datasets de eval para cada analysis type
- [ ] Integração de metrics com Prometheus
- [ ] Dashboard de monitoramento básico

**FASE 3 (Semanas 5-6): Security + Memory**
- [ ] Implementar `SecurityClassifier` + masking
- [ ] Integrar com `SecureRouter`
- [ ] Setup PostgreSQL pgvector
- [ ] Implementar `MemoryLayer` (Redis + pgvector)

**FASE 4 (Semanas 7-8): Agent Graph**
- [ ] Refatorar multi-agent para `AgentGraph` (DAG)
- [ ] Implementar topological sort + execution
- [ ] Criar exemplo completo: IncidentGraph
- [ ] Testes de dependências

**FASE 5 (Semanas 9-10): Context Intelligence**
- [ ] Implementar `ContextIntelligence` com boost adaptativo
- [ ] Integrar histórico de sucesso
- [ ] Refinar boosting com feedback de eval
- [ ] A/B testing de boost strategies

**FASE 6 (Semanas 11-12): Production Hardening**
- [ ] Load testing de toda pipeline
- [ ] SLA monitoring
- [ ] Cost optimization (model selection)
- [ ] Disaster recovery + fallbacks

### 10.2 Estrutura de Pastas Recomendada

```
ai-intelligence/
├── src/
│   ├── routing/
│   │   ├── ModelRouter.ts
│   │   └── RoutingContext.ts
│   ├── eval/
│   │   ├── EvalPipeline.ts
│   │   ├── EvalMetrics.ts
│   │   └── datasets/
│   │       ├── observability.dataset.ts
│   │       ├── incident.dataset.ts
│   │       └── ...
│   ├── security/
│   │   ├── SecurityClassifier.ts
│   │   ├── SecureRouter.ts
│   │   └── MaskingRules.ts
│   ├── memory/
│   │   ├── MemoryLayer.ts
│   │   └── MemoryTypes.ts
│   ├── agents/
│   │   ├── AgentGraph.ts
│   │   ├── graphs/
│   │   │   ├── IncidentGraph.ts
│   │   │   ├── RiskGraph.ts
│   │   │   └── ...
│   │   └── nodes/
│   │       ├── BaseNode.ts
│   │       └── ...
│   ├── prompts/
│   │   ├── PromptEngine.ts
│   │   └── templates/
│   │       ├── incident.template.ts
│   │       ├── risk.template.ts
│   │       └── ...
│   ├── observability/
│   │   ├── AIMetrics.ts
│   │   └── OTelInstrumentation.ts
│   └── gateway/
│       ├── AIGateway.ts
│       ├── ValidationMiddleware.ts
│       └── QuotaManager.ts
├── tests/
│   ├── eval/
│   │   └── datasets.ts
│   ├── routing/
│   │   └── ModelRouter.test.ts
│   └── ...
└── docker-compose.yml  # pgvector + Redis
```

### 10.3 Dependencies Adicionais

```json
{
  "devDependencies": {
    "@opentelemetry/sdk-node": "^0.48.0",
    "@opentelemetry/auto-instrumentations-node": "^0.43.0",
    "@opentelemetry/exporter-otlp-http": "^0.48.0",
    "@opentelemetry/api": "^1.8.0",
    "pgvector": "^0.1.0",
    "redis": "^4.6.0",
    "lru-cache": "^10.1.0",
    "@anthropic-ai/sdk": "^0.9.0"
  }
}
```

### 10.4 docker-compose.yml (Support Services)

```yaml
version: '3.9'

services:
  postgres:
    image: pgvector/pgvector:pg16-latest
    environment:
      POSTGRES_DB: ai_intelligence
      POSTGRES_PASSWORD: secure_password
    ports:
      - "5432:5432"
    volumes:
      - ./db/init.sql:/docker-entrypoint-initdb.d/init.sql

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server --maxmemory 2gb --maxmemory-policy allkeys-lru

  otel-collector:
    image: otel/opentelemetry-collector-k8s:latest
    ports:
      - "4317:4317" # OTLP gRPC
      - "4318:4318" # OTLP HTTP
    volumes:
      - ./otel-collector-config.yaml:/etc/otel-collector-config.yaml
    command: ["--config=/etc/otel-collector-config.yaml"]

  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - ./ai-metrics.yml:/etc/prometheus/rules/ai-metrics.yml

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    environment:
      GF_SECURITY_ADMIN_PASSWORD: admin
    volumes:
      - ./grafana/provisioning:/etc/grafana/provisioning
```

---

## 📊 RESUMO EXECUTIVO

### Benefícios Esperados

| Métrica | Antes | Depois | Ganho |
|---------|-------|--------|-------|
| **Custo/análise** | $0.15 | $0.08 | ↓ 47% |
| **Latência p99** | 8s | 4s | ↓ 50% |
| **Taxa de fallback** | 12% | 3% | ↓ 75% |
| **Eval score médio** | 0.72 | 0.88 | ↑ 22% |
| **Tempo de investigação** | 2h | 20m | ↓ 83% |
| **Conformidade LGPD** | 40% | 100% | ✅ |

### Decisões Arquiteturais Justificadas

1. **Model Router + Decision Tree**: Reduz custos 47% sem sacrificar qualidade (routing inteligente por tipo)
2. **Eval Pipeline**: Feedback loop crítico para melhorar prompts + detectar degradação (fase 2)
3. **AgentGraph (DAG)**: Encadeamento de dependências > paralelismo cego (melhor reasoning)
4. **Memory Layer (pgvector)**: RAG local reduz context size 30-40%, melhora qualidade
5. **PromptEngine com versioning**: A/B testing contínuo, rollback seguro
6. **SecurityClassifier**: LGPD compliance + roteamento dinâmico (local vs cloud)

### Próximos Passos

1. Aprovar roadmap de implementação
2. Criar branch `feature/enterprise-ai-evolution`
3. Iniciar FASE 1: ModelRouter + OTel
4. Definir métricas de sucesso por fase

---

**Autor:** Senior AI Architect  
**Documento:** Design for Implementation  
**Status:** Ready for Incremental Development
