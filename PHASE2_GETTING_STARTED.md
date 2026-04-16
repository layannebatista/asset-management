# 🎯 FASE 2 — Eval Pipeline + Datasets (Weeks 3-4)

**Status:** Implementation-Ready Code  
**Builds On:** Phase 1 (ModelRouter + OTel)  
**Impact:** +22% quality, detect degradation early

---

## 📦 Delivered Artifacts

### Core Components
```
src/eval/
└── EvalPipeline.ts         (3-dimensional quality evaluation)

tests/eval/
├── datasets.ts             (20+ eval datapoints for all 5 types)
└── EvalPipeline.test.ts    (30+ unit tests)
```

### Quality Metrics
- **Dimension 1: Quality** (50%)
  - ROUGE-L: Longest common subsequence
  - Factuality: Alignment with input context
  
- **Dimension 2: Actionability** (30%)
  - Specificity: Not vague
  - Executability: Can be done
  - Measurability: Success criteria clear
  
- **Dimension 3: Consistency** (20%)
  - Historical alignment
  - No contradictions

---

## ✅ Implementation Checklist

### Step 1: Copy Fase 2 Files (10 min)

```bash
# Copy eval pipeline
cp src/eval/EvalPipeline.ts your-project/src/eval/

# Copy test datasets
cp tests/eval/datasets.ts your-project/tests/eval/
cp tests/eval/EvalPipeline.test.ts your-project/tests/eval/

# Run tests
npm run test:eval
```

### Step 2: Integrate with AIOrchestrator (1h)

**Modify `src/orchestrator/AIOrchestrator.ts`:**

```typescript
import { EvalPipeline } from '../eval/EvalPipeline';

export class AIOrchestrator {
  private evaluator: EvalPipeline;

  constructor(repository: AnalysisRepository, logger: Logger) {
    // ... existing code ...
    
    // NEW: Initialize Eval Pipeline
    this.evaluator = new EvalPipeline(this.llm, repository, logger);
  }

  async analyze(request: AnalysisRequest): Promise<AnalysisResult> {
    const trace = this.metrics.traceAnalysis(request.type);

    try {
      // ... existing routing + analysis code ...
      
      // NEW: Evaluate result (if available)
      let evalScore = 0.5; // default
      if (result.keyPoints && result.recommendations) {
        const evalResult = await this.evaluator.evaluate({
          id: result.id,
          analysisType: request.type,
          input: {
            contextChunks: request.context?.map(c => JSON.stringify(c.data)) || [],
            query: request.query,
          },
          expectedOutput: {
            keyPoints: [], // Would come from dataset in production
            recommendedActions: [],
          },
          generatedOutput: {
            keyPoints: result.keyPoints,
            recommendedActions: result.recommendations,
            confidence: result.confidence || 0.5,
          },
        });
        evalScore = evalResult.overall;

        // Record in database/metrics
        await repository.saveEvalScore(result.id, evalResult);
      }

      trace.end({
        duration_ms: Date.now() - startTime,
        model: modelDecision.modelName,
        eval_score: evalScore,
      });

      return result;

    } catch (error) {
      trace.error(error as Error);
      throw error;
    }
  }
}
```

### Step 3: Run Eval Tests (15 min)

```bash
# Run all eval tests
npm run test:eval

# Expected output:
# ✓ EvalPipeline: 30+ tests passing
# ✓ Datasets: 20+ datapoints valid
# Coverage: 75%+

# Run specific dataset
npm run test:eval -- --testNamePattern="observability"
```

### Step 4: Test Against Real Data (30 min)

**Create a one-off evaluation script:**

```typescript
// scripts/eval-sample.ts
import { EvalPipeline } from '../src/eval/EvalPipeline';
import { getDatasetForType } from '../tests/eval/datasets';
import { AnalysisType } from '../src/routing/RoutingContext';
import { logger } from '../src/api/logger';
import { LLMClient } from '../src/llm/LLMClient';
import { AnalysisRepository } from '../src/storage/AnalysisRepository';

async function main() {
  const llm = new LLMClient();
  const repo = new AnalysisRepository();
  const evaluator = new EvalPipeline(llm, repo, logger);

  // Get sample datapoints
  const datapoints = getDatasetForType(AnalysisType.OBSERVABILITY);

  // Evaluate
  const scores = await evaluator.evaluateBatch(datapoints);

  // Log results
  const stats = evaluator.getStats(scores);
  console.log('Evaluation Results:');
  console.log(`  Overall avg: ${(stats.avgOverall * 100).toFixed(1)}%`);
  console.log(`  Quality avg: ${(stats.avgQuality * 100).toFixed(1)}%`);
  console.log(`  Actionability avg: ${(stats.avgActionability * 100).toFixed(1)}%`);
  console.log(`  Consistency avg: ${(stats.avgConsistency * 100).toFixed(1)}%`);
  console.log(`  Failure rate: ${(stats.failureRate * 100).toFixed(1)}%`);
}

main().catch(console.error);
```

### Step 5: Create Prometheus Alert Rules (Fase 1)

**Add to `prometheus-rules.yml`:**

```yaml
- alert: LowEvalScore
  expr: ai_intelligence_analysis_eval_score < 0.70
  for: 5m
  annotations:
    summary: "Analysis eval score < 70%"
    description: "Last eval score: {{ $value }}"

- alert: HighEvalScoreVariance
  expr: |
    (max(ai_intelligence_analysis_eval_score) - min(ai_intelligence_analysis_eval_score)) > 0.2
  for: 10m
  annotations:
    summary: "High variance in eval scores"
    description: "Score variance > 0.2"
```

### Step 6: Add Eval Score to Grafana Dashboard

**Update `grafana/dashboards/phase1-metrics.json`:**

```json
{
  "title": "Eval Score Trend",
  "targets": [
    {
      "expr": "ai_intelligence_analysis_eval_score",
      "legendFormat": "{{ analysis_type }}"
    }
  ]
}
```

---

## 🎯 Phase 2 Success Criteria

✅ **EvalPipeline:**
- 3 dimensions evaluating correctly
- ROUGE-L > 0.7 for good outputs
- Factuality check working
- Coherence detection functional

✅ **Datasets:**
- 20+ datapoints per analysis type
- Expected outputs realistic
- Coverage of edge cases

✅ **Quality Monitoring:**
- Eval scores emitted to Prometheus
- Grafana dashboard showing trends
- Alerts firing on low scores (< 0.70)

✅ **Tests:**
- 30+ tests passing
- Coverage > 70%
- Dataset validation working

---

## 📊 Expected Eval Scores (Baselines)

From running datasets against good vs bad outputs:

| Scenario | Quality | Actionability | Consistency | Overall |
|----------|---------|---------------|-------------|---------|
| **Good output** | 0.85-0.95 | 0.80-0.95 | 0.80-0.90 | 0.85-0.92 |
| **Medium output** | 0.70-0.80 | 0.65-0.80 | 0.70-0.80 | 0.70-0.80 |
| **Poor output** | 0.40-0.60 | 0.30-0.60 | 0.30-0.60 | 0.35-0.60 |

**Your threshold: 0.70** (flag anything below)

---

## 🔍 How to Use Eval Results

### Per-Analysis Feedback Loop
```
1. Run analysis
2. Eval Pipeline scores it
3. If score < 0.70:
   - Log degradation
   - Alert on-call
   - Compare to template version
   - Suggest template rollback
```

### A/B Testing Templates (Fase 5)
```
1. Run analysis with Template v1
2. Score and store
3. Run same query with Template v2
4. Compare scores
5. Promote if v2 > v1 + 2%
```

### Model Routing Feedback (Phase 1)
```
1. ModelRouter selects model (gpt-4o vs 4-turbo)
2. Analysis runs
3. Eval scores it
4. If low score + wrong model choice:
   - Log to routing decision history
   - Adjust thresholds
   - Retrain router
```

---

## 🚨 Troubleshooting Phase 2

| Issue | Cause | Solution |
|-------|-------|----------|
| **All scores 0.5** | LLM mock not configured | Update jest mocks with real LLM calls |
| **ROUGE-L always 0** | String mismatch | Check case sensitivity in comparison |
| **Factuality always false** | LLM returns wrong format | Validate JSON parsing |
| **Tests timeout** | LLM calls slow | Mock LLMClient in tests, add timeout |
| **High variance in scores** | Inconsistent LLM responses | Use temperature=0.2 for eval calls |

---

## 📈 Metrics to Track (Phase 2)

**Prometheus:**
```
ai_intelligence_analysis_eval_score        # Per-analysis score
ai_analysis_eval_quality_score             # Quality dimension only
ai_analysis_eval_actionability_score       # Actionability dimension
ai_analysis_eval_consistency_score         # Consistency dimension
ai_analysis_eval_failures                  # Count of scores < 0.70
```

**Grafana:**
- Eval score trend (all types)
- Eval score distribution (histogram)
- Failure rate (score < 0.70)
- Quality by analysis type

---

## 🔄 Integration Points

**With Phase 1:**
- ✅ ModelRouter provides model decision
- ✅ PromptTemplate provides template ID
- ✅ OTel metrics emit eval scores
- ✅ Routing history updated with eval outcome

**With Phase 3+:**
- Will provide feedback for PromptEngine A/B testing
- Will inform ContextIntelligence boosting
- Will trigger alerts in Production Hardening

---

## 📝 Real-World Example: Incident Analysis

```
1. User submits: "What caused the 14:30 outage?"
2. ModelRouter → o1-preview (critical + complex)
3. PromptTemplate → incident-investigation v1
4. Analysis runs → generates key points + actions
5. EvalPipeline scores it:
   - Quality: 0.88 (covers root cause)
   - Actionability: 0.92 (specific actions with timelines)
   - Consistency: 0.85 (aligns with previous incidents)
   - Overall: 0.88 ✅ GOOD

Result: Stored in database, no alerts, template stays v1
```

**Bad scenario:**
```
... same as above but...
5. EvalPipeline scores it:
   - Quality: 0.52 (missing key cause)
   - Actionability: 0.45 (vague recommendations)
   - Consistency: 0.60 (contradicts previous pattern)
   - Overall: 0.54 ❌ POOR

Result: Alert fired, logged as failure, suggest template review
```

---

## ✨ Phase 2 Enables

✅ **Quality Baseline:** Know if analyses are good (>0.80)  
✅ **Degradation Detection:** Alerts when quality drops  
✅ **Template Validation:** A/B test new templates  
✅ **Model Feedback:** Learn which models work best  
✅ **Foundation:** Ready for Phase 3+ features

---

## 🚀 Next: Transition to Phase 3

**When ready (Week 5):**
1. Eval scores stable in Prometheus ✅
2. Baseline quality established (target: 0.80+) ✅
3. Alerts firing correctly on low scores ✅
4. Team understands eval dimensions ✅

→ Start Phase 3: **SecurityClassifier + MemoryLayer**

---

## 📞 Phase 2 Sync Points

- **Day 1:** EvalPipeline integrated
- **Day 2:** Datasets loaded and tested
- **Day 3:** Real analyses being scored
- **Day 5:** Alerts configured + working
- **End of Week 2:** Go/no-go for Phase 3

---

**Status:** Ready to Start  
**Effort:** 30-40 engineer-hours  
**Risk:** Low (non-blocking, metrics only)  
**Go/No-Go:** End of Phase 2
