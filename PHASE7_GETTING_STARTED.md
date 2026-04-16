# 💰 PHASE 7 GETTING STARTED — Token Optimization

**Phase:** 7 (Weeks 13-14)  
**Status:** ✅ Code Complete  
**Impact:** -35% tokens, -15% cost, high ROI

---

## 📋 WHAT YOU GET

### 1. QueryRewriter
- Pattern-based query compression for Prometheus, SQL, logs
- LLM fallback for complex queries
- 7-day Redis cache for rewrite patterns
- **Benefit:** -20-30% context token overhead

### 2. ContextualSummarizer
- Adaptive summarization based on context size
- 3 aggressiveness levels (light/moderate/aggressive)
- Preserves critical fields during summarization
- **Benefit:** -30-50% for large contexts (>3000 tokens)

### 3. DynamicChunkingStrategy
- Type-specific chunking (observability vs incident vs risk)
- Number compression (1234567 → "1.2M")
- Temporal sampling for time series (1440 → 288 points)
- Field reordering for LLM relevance
- **Benefit:** -15-25% with better precision

**Total Combined:** -35% tokens, -15% cost

---

## 🚀 IMPLEMENTATION STEPS (1-2 weeks)

### Step 1: File Copy (~5 min)

```bash
# Copy source files
cp ai-intelligence/src/optimization/QueryRewriter.ts your-project/src/optimization/
cp ai-intelligence/src/optimization/ContextualSummarizer.ts your-project/src/optimization/
cp ai-intelligence/src/optimization/DynamicChunkingStrategy.ts your-project/src/optimization/

# Copy tests
cp ai-intelligence/tests/optimization/TokenOptimization.test.ts your-project/tests/optimization/
```

### Step 2: Integrate QueryRewriter (~30 min)

In your context pipeline (before LLM call):

```typescript
import { QueryRewriter } from './optimization/QueryRewriter';

const rewriter = new QueryRewriter(redis, llmClient, logger);

// Before sending context
async analyze(request: AnalysisRequest): Promise<AnalysisResult> {
  let context = request.context;

  // Rewrite any embedded queries
  if (context.includes('rate(') || context.includes('SELECT')) {
    const domain = context.includes('rate(') ? 'prometheus' : 'sql';
    const rewritten = await rewriter.rewrite(context, domain);
    
    this.logger.info('Query rewriting savings', {
      original: rewritten.tokensBeforeEstimate,
      after: rewritten.tokensAfterEstimate,
      savings: (rewritten.reduction * 100).toFixed(1) + '%',
    });

    // Use rewritten version
    context = rewritten.rewritten;
  }

  // ... rest of analysis
}
```

**Expected Metrics:**
- Cache hit rate: 80%+ after first 50 analyses
- Avg reduction: 25% for PromQL queries
- ROI: Breakeven after 50 analyses (LLM cost savings)

### Step 3: Integrate ContextualSummarizer (~1 hour)

In your context pipeline (after filter/dedup, before LLM):

```typescript
import { ContextualSummarizer } from './optimization/ContextualSummarizer';

const summarizer = new ContextualSummarizer(llmClient, logger, {
  enabled: true,
  minContextSize: 1000,
  aggressiveness: 'moderate', // Adjust based on quality needs
  preserveFields: ['anomalies', 'errors', 'severity'],
});

// In your analyze pipeline:
async analyze(request: AnalysisRequest): Promise<AnalysisResult> {
  // ... existing code ...

  // Apply summarization if needed
  const summaryResult = await summarizer.summarizeIfNeeded(
    contextChunks,
    request.type,
  );

  this.logger.info('Context summarization applied', {
    chunks: summaryResult.chunks.length,
    reduction: (summaryResult.reduction * 100).toFixed(1) + '%',
    summarized: summaryResult.summarizedCount,
  });

  const finalContext = summaryResult.chunks;

  // ... proceed with analysis using finalContext
}
```

**Expected Metrics:**
- Automatic on contexts > 1000 tokens
- Reduction: 30-50% for large logs
- Quality impact: < 2% (preserved critical fields)

### Step 4: Integrate DynamicChunkingStrategy (~45 min)

In your context chunking logic:

```typescript
import { DynamicChunkingStrategy } from './optimization/DynamicChunkingStrategy';

const chunking = new DynamicChunkingStrategy(logger);

// In ContextBudgetManager or equivalent:
function selectChunks(
  allChunks: ContextChunk[],
  analysisType: AnalysisType,
  tokenBudget: number,
): ContextChunk[] {
  const strategy = chunking.getStrategy(analysisType, tokenBudget);

  // Apply chunking strategy transformations
  const transformed = allChunks.map((chunk) =>
    chunking.transformChunk(chunk, strategy),
  );

  // Recalculate scores with strategy-specific relevance
  transformed.forEach((chunk) => {
    chunk.score = chunking.calculateRelevanceScore(chunk, analysisType);
  });

  // Select top chunks within budget
  const selected = selectTopByScore(transformed, tokenBudget);

  this.logger.info('Chunk selection with dynamic strategy', {
    analysisType,
    strategy: {
      chunkSize: strategy.chunkSize,
      compressNumbers: strategy.compressNumbers,
      timeSampling: strategy.timeSampling,
    },
    selected: selected.length,
  });

  return selected;
}
```

**Expected Metrics:**
- Automatic per analysis type
- Observability: -15-20% tokens + better anomaly detection
- Incident: -10-15% tokens + preserved sequencing
- Risk: -20-25% tokens + better violation detection

### Step 5: Run Tests (~15 min)

```bash
npm run test -- optimization/

# Expected: 40+ tests passing
# Coverage: 80%+
```

### Step 6: Monitor & Tune (~1 week)

Track in Prometheus:

```promql
# Token savings by phase
ai_tokens_saved_total{phase="query_rewriting"}
ai_tokens_saved_total{phase="summarization"}
ai_tokens_saved_total{phase="chunking"}

# Cache hit rate (QueryRewriter)
ai_query_rewrite_cache_hit_rate

# Summarization rates
ai_summarization_applied_percent

# Cost reduction
ai_cost_saved_usd_total
```

---

## 📊 EXPECTED RESULTS

### Before Phase 7
```
Raw context:       8,400 tokens
After filtering:   2,000 tokens (76% reduction)
Total analysis cost: $0.064 per analysis
```

### After Phase 7
```
Raw context:       8,400 tokens
After filtering:   2,000 tokens
After optimization: 1,300 tokens (-35%)
Total analysis cost: $0.054 per analysis (-15%)
```

### Key Metrics
| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Avg tokens/analysis | 2,000 | 1,300 | -35% |
| Cost/analysis | $0.064 | $0.054 | -15% |
| Query rewrite cache | 0% | 80%+ | ✅ |
| LLM calls/100 analyses | 50 | 10 | -80% |
| P95 latency | 8s | 6.5s | -19% |

---

## 🎯 IMPLEMENTATION ROADMAP

### Week 1: QueryRewriter + Monitoring
- [ ] Copy QueryRewriter files
- [ ] Integrate into context pipeline
- [ ] Configure Redis cache (7 days)
- [ ] Add Prometheus metrics
- [ ] Monitor cache hit rate

**Expected:** -20-30% on queries, 80%+ cache hits

### Week 2: ContextualSummarizer
- [ ] Copy ContextualSummarizer files
- [ ] Set aggressiveness='moderate' initially
- [ ] Monitor quality scores
- [ ] Adjust if needed (light/aggressive)

**Expected:** -30-50% on large contexts, quality stable

### Week 2 (parallel): DynamicChunkingStrategy
- [ ] Copy DynamicChunking files
- [ ] Integrate into ContextBudgetManager
- [ ] Test with each analysis type
- [ ] Verify chunk reordering helps

**Expected:** -15-25%, better anomaly detection

### End of Week 2: Combined Validation
- [ ] Run full test suite
- [ ] Compare metrics before/after
- [ ] Document learned patterns
- [ ] Plan Phase 8 (Predictive Intelligence)

**Expected Overall:** -35% tokens, -15% cost

---

## 🔧 TUNING PARAMETERS

### QueryRewriter
```typescript
// Cache TTL (how long to keep rewrites)
cacheTTL: 7 * 24 * 60 * 60  // 7 days (good for stable queries)

// Min query length to bother with rewriting
minQueryLength: 30  // Don't rewrite very short queries
```

### ContextualSummarizer
```typescript
// Aggressiveness levels
aggressiveness: 'light'      // 15-25% reduction
aggressiveness: 'moderate'   // 30-50% reduction (default)
aggressiveness: 'aggressive' // 50-70% reduction

// Fields to ALWAYS preserve (never summarize away)
preserveFields: [
  'anomalies',
  'errors', 
  'severity',
  'keyPoints',
]

// Min context size before considering summarization
minContextSize: 1000  // Don't summarize < 1000 tokens
```

### DynamicChunkingStrategy
```typescript
// Per analysis type
AnalysisType.OBSERVABILITY:
  chunkSize: 500        // Larger chunks for metrics
  overlap: 50           // Low overlap (not sequential)
  compressNumbers: true // "1234567" → "1.2M"

AnalysisType.INCIDENT:
  chunkSize: 300        // Smaller for logs
  overlap: 150          // High overlap (sequential context needed)
  compressNumbers: false // Keep exact values
```

---

## 📈 EXPECTED IMPACT

### Cost Reduction
- **Query Rewriting:** -5-10% cost (25% of queries)
- **Summarization:** -5-10% cost (large contexts)
- **Chunking:** -5-8% cost (better selection)
- **Total:** -15-20% cost reduction

### Token Reduction
- **Query Rewriting:** -20-30% query tokens
- **Summarization:** -30-50% summary tokens
- **Chunking:** -15-25% overall tokens
- **Total:** -35% average

### Quality Impact
- **Minimal degradation:** < 2% (preserved critical fields)
- **Better anomaly detection:** +5% (prioritized fields come first)
- **Faster resolution:** -20% avg time (shorter context, clearer signal)

---

## ⚠️ CONSIDERATIONS

### When to Use Light Summarization
- Critical production incidents (preserve detail)
- New analysis types (conservative)
- When quality score is already < 0.75

### When to Use Aggressive Summarization
- Routine monitoring analyses
- Large log files (> 5000 tokens)
- When context is mostly redundant

### Watch Out For
- **Over-compression of numbers:** "0.000123 → 123µ" might be confusing
  - Solution: Disable for INCIDENT type (keep exact)
- **Loss of context in logs:** Overlapping chunks are critical
  - Solution: INCIDENT uses 150-token overlap, not 50
- **Cache misses on unique queries:** Quer Rewriter cache only helps for repeated patterns
  - Solution: Normal queries will still benefit from LLM latency savings

---

## 🧪 VALIDATION CHECKLIST

Before moving to Phase 8:

- [ ] All 40+ tests passing
- [ ] QueryRewriter cache hit rate > 60%
- [ ] Summarization working on large contexts
- [ ] Chunk reordering improves LLM understanding
- [ ] Combined token reduction > 30%
- [ ] Quality score degradation < 2%
- [ ] Prometheus metrics showing savings
- [ ] Team understands tuning parameters

---

## 📚 REFERENCE

- **Code:** [ai-intelligence/src/optimization/](ai-intelligence/src/optimization/)
- **Tests:** [ai-intelligence/tests/optimization/](ai-intelligence/tests/optimization/)
- **Doc:** [AI_INNOVATION_IDEAS.md](AI_INNOVATION_IDEAS.md) (Phase 7 section)

---

## 🎯 ROI ANALYSIS

### Cost of Phase 7
- Development: 2 weeks = ~80 engineer-hours
- Daily LLM calls for summarization: +20 calls/day × $0.0002 = $0.004/day = ~$1.50/month

### Benefit of Phase 7
- Token reduction: 35% × 2,000 tokens/analysis × 1,000/day = -700,000 tokens/day
- Cost savings: 700,000 × $0.00001 = ~$7/day = ~$210/month
- **Payback period: 1 week** (after implementation)
- **ROI after 1 month: 14x** (savings vs cost)

---

## ✅ SUCCESS CRITERIA

**Phase 7 Complete When:**

- [ ] Combined token reduction > 30%
- [ ] Quality degradation < 2%
- [ ] QueryRewriter cache effective (> 60% hits)
- [ ] All three optimizations integrated
- [ ] Monitoring in place
- [ ] Team trained on tuning
- [ ] Phase 8 documented and ready

---

**Status:** Phase 7 Ready for Integration ✅

**Next:** [PHASE8_GETTING_STARTED.md](PHASE8_GETTING_STARTED.md) — Predictive Intelligence (Degradation Forecasting)

**Timeline:** 1-2 weeks to full 35% optimization

---

*Created: 2026-04-16 | Phase 7 Token Optimization | Ready to Deploy*
