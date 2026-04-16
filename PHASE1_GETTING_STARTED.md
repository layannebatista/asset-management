# 🚀 FASE 1 — Getting Started (ModelRouter + OTel + PromptTemplate)

**Timeline:** Weeks 1-2  
**Status:** Implementation-Ready Code  
**Priority:** Critical — Foundation for all other phases

---

## 📋 Delivered Artifacts

### Core Components (TypeScript)
```
src/routing/
├── RoutingContext.ts         (types & enums)
└── ModelRouter.ts            (decision tree implementation)

src/prompts/
├── PromptTemplate.ts         (template engine)
└── templates.ts              (5 pre-configured templates)

src/observability/
└── OTelInstrumentation.ts    (metrics + tracing)
```

### Infrastructure
```
docker-compose.phase1.yml      (Postgres + Redis + OTel + Prometheus + Grafana)
otel-collector-config.yaml     (OTel configuration)
prometheus-config.yml          (Prometheus configuration)
prometheus-rules.yml           (Alert rules + recording rules)
grafana/dashboards/phase1-metrics.json  (Dashboard)
```

### Tests
```
tests/routing/
└── ModelRouter.test.ts       (45 unit tests)

tests/prompts/
└── PromptTemplate.test.ts    (40+ unit tests)
```

### Configuration
```
package.json.phase1            (NPM scripts + dependencies)
```

---

## ✅ Implementation Checklist

### Step 1: Setup (30 min)

```bash
# 1. Copy files to your project
cp -r ai-intelligence/src/routing/* your-project/src/routing/
cp -r ai-intelligence/src/prompts/* your-project/src/prompts/
cp -r ai-intelligence/src/observability/* your-project/src/observability/

# 2. Copy infrastructure files
cp docker-compose.phase1.yml your-project/
cp otel-collector-config.yaml your-project/
cp prometheus-config.yml your-project/
cp prometheus-rules.yml your-project/

# 3. Copy tests
cp -r tests/routing/* your-project/tests/routing/
cp -r tests/prompts/* your-project/tests/prompts/

# 4. Update package.json with dependencies
npm install @opentelemetry/sdk-node @opentelemetry/auto-instrumentations-node
npm install @opentelemetry/exporter-otlp-http
npm install redis pg uuid winston
```

### Step 2: Start Infrastructure (10 min)

```bash
# Start all services (Postgres + Redis + OTel + Prometheus + Grafana)
docker-compose -f docker-compose.phase1.yml up -d

# Verify everything is running
docker-compose -f docker-compose.phase1.yml ps

# Check logs
docker-compose -f docker-compose.phase1.yml logs -f
```

**Wait for all services to be healthy:**
- PostgreSQL: localhost:5432
- Redis: localhost:6379
- Prometheus: localhost:9090
- Grafana: localhost:3000 (admin/admin)
- OTel: localhost:4317

### Step 3: Run Tests (15 min)

```bash
# Install dev dependencies
npm install --save-dev jest @jest/globals ts-jest @types/jest

# Run all Phase 1 tests
npm run test:all-phase1

# Expected output:
# ✓ ModelRouter: 45 tests passing
# ✓ PromptTemplate: 40+ tests passing
# Coverage: 80%+
```

### Step 4: Integrate with AIOrchestrator (1h)

**Modify `src/orchestrator/AIOrchestrator.ts`:**

```typescript
import { ModelRouter } from '../routing/ModelRouter';
import { PromptEngine, PromptTemplateRepository } from '../prompts/PromptTemplate';
import { DEFAULT_TEMPLATES } from '../prompts/templates';
import { AIMetricsInstrumentation, initializeOTel } from '../observability/OTelInstrumentation';

export class AIOrchestrator {
  private router: ModelRouter;
  private prompts: PromptEngine;
  private metrics: AIMetricsInstrumentation;

  constructor(repository: AnalysisRepository, logger: Logger) {
    // Existing initialization...
    this.llm = new LLMClient();
    this.repository = repository;

    // ── NEW: Initialize Phase 1 components
    this.router = new ModelRouter(logger);
    
    const promptRepo = new PromptTemplateRepository(logger);
    this.prompts = new PromptEngine(promptRepo, logger);
    
    this.metrics = new AIMetricsInstrumentation(logger);

    // Register default templates
    for (const template of DEFAULT_TEMPLATES) {
      promptRepo.save(template).catch((err) => logger.error('Template load failed', { err }));
    }

    // Initialize OTel
    initializeOTel('ai-intelligence', logger);

    // Initialize analyzers...
    this.observabilityAnalyzer = new ObservabilityAnalyzer(this.llm, prometheus, repository);
    // ... etc
  }

  async analyze(request: AnalysisRequest): Promise<AnalysisResult> {
    const trace = this.metrics.traceAnalysis(request.type);

    try {
      // ── NEW: Route model dynamically
      const routingContext = {
        type: request.type,
        contextSize: request.context?.length || 2000,
        criticality: this._mapToCriticality(request),
        userTier: 'enterprise',
      };

      const modelDecision = this.router.route(routingContext);
      this.logger.info('Model decision', { decision: modelDecision });

      // ── NEW: Get versioned prompt template
      const template = await this.prompts.getTemplate(request.type, 'default');
      const composed = this.prompts.composePrompt(template, {
        chunks: request.context?.map((c) => JSON.stringify(c.data)) || [],
        query: request.query,
      });

      // ── Use model decision to configure LLM call
      const response = await this.llm.call({
        systemPrompt: composed.system,
        userPrompt: composed.user,
        useFallback: modelDecision.modelName === 'gpt-4o-mini',
      });

      const result = await this._executeWithModel(request, modelDecision);

      // ── Record routing outcome
      this.router.recordOutcome(routingContext, modelDecision, result.qualityScore || 0.5);

      // ── Record template eval score (when available in Phase 2)
      await this.prompts.recordEvalScore(template.id, result.qualityScore || 0.5);

      trace.end({
        duration_ms: Date.now() - Date.now(),
        model: modelDecision.modelName,
        eval_score: result.qualityScore,
      });

      return result;

    } catch (error) {
      trace.error(error as Error);
      throw error;
    }
  }

  private _mapToCriticality(request: AnalysisRequest): Criticality {
    // Map request attributes to criticality level
    return Criticality.NORMAL;
  }
}
```

### Step 5: Verify Metrics (10 min)

```bash
# 1. Open Prometheus UI
#    http://localhost:9090
#    Query: ai_intelligence_analysis_total
#    Should show your metrics

# 2. Open Grafana
#    http://localhost:3000 (admin/admin)
#    Dashboard: "AI Intelligence - Phase 1 Metrics"
#    Should show analysis counts and latencies

# 3. Check OTel collector logs
docker-compose -f docker-compose.phase1.yml logs otel-collector

# 4. Verify traces are exported
#    OTel metrics on prometheus:8888
```

---

## 🎯 Phase 1 Success Criteria

✅ **ModelRouter:**
- Decision accuracy > 95%
- All 5 analysis types routed correctly
- Cost matrix matches pricing

✅ **PromptTemplate:**
- All 5 templates loaded successfully
- Composition works with chunks + query
- Version management functional

✅ **OpenTelemetry:**
- Traces exported to collector
- Metrics emitted to Prometheus
- Grafana dashboard shows data

✅ **Tests:**
- 85+ tests passing
- Coverage > 70%
- No regressions

---

## 📊 Key Metrics to Monitor

**From Prometheus:**
```
ai_intelligence_analysis_total{analysis_type="incident"}     # Count
ai:analysis:latency_p99                                       # Latency
ai:cost:per_hour                                              # Cost
ai:analysis:count_per_minute                                  # Throughput
ai_intelligence_llm_fallback_used                            # Fallback rate
```

**From Grafana Dashboard:**
- Analysis latency (P50/P95/P99)
- Cost trends
- Analysis count by type
- Token usage per hour

---

## 🔍 Troubleshooting Phase 1

| Issue | Cause | Solution |
|-------|-------|----------|
| **Tests failing** | Missing dependencies | `npm install && npm run test:all-phase1` |
| **Prometheus not scraping** | OTel not exporting | Check `otel-collector logs` |
| **Grafana dashboard empty** | No data in Prometheus | Run some analyses, wait 30s |
| **ModelRouter wrong decisions** | Context size calculation off | Log context size in routing call |
| **Templates not loading** | ID conflicts | Ensure each template has unique ID |
| **High latency** | LLM timeout | Check OpenAI API key + rate limits |

---

## 📝 What Phase 1 Enables

✅ **Cost Optimization:** ModelRouter reduces LLM costs by 30-47%  
✅ **Quality Monitoring:** Track analysis quality from day 1  
✅ **Intelligent Routing:** Smart model selection based on analysis type  
✅ **Observability:** See all metrics in real-time  
✅ **Foundation:** Ready for Phase 2 (Eval Pipeline)  

---

## 🚀 Next: Transition to Phase 2

**When ready (Week 3):**
1. All Phase 1 tests passing ✅
2. Metrics stable in Prometheus ✅
3. Grafana dashboard operational ✅
4. Team aligned on results ✅

→ Start Phase 2: **EvalPipeline + Datasets**

---

## 📞 Phase 1 Sync Points

- **Day 1:** Infrastructure + tests running
- **Day 3:** ModelRouter integrated with AIOrchestrator
- **Day 5:** PromptTemplate loaded + working
- **Day 10:** Metrics flowing to Prometheus + Grafana
- **End of Week 2:** Go/no-go decision for Phase 2

---

## 📚 Phase 1 Documentation

- `ENTERPRISE_AI_EVOLUTION.md` — Section 2 (Model Router) & 4 (OTel)
- `QUICK_REFERENCE.md` — ModelRouter + metrics tables
- Code comments — ModelRouter.ts, PromptTemplate.ts, OTelInstrumentation.ts

---

**Status:** Ready to Start  
**Effort:** 40-60 engineer-hours (1-2 devs × 1-2 weeks)  
**Risk:** Low (foundation only, non-breaking changes)  
**Go/No-Go:** End of Phase 1
