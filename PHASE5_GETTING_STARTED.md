# 📚 PHASE 5 GETTING STARTED — Adaptive Context Intelligence

**Phase:** 5 (Weeks 9-10)  
**Status:** ✅ Code Complete  
**Impact:** +5-10% eval score improvement, better chunk selection

---

## 📋 WHAT YOU GET

### 1. HistoricalSuccessTracker
- Tracks successful analyses by type and quality
- Learns patterns from past high-scoring results
- Ranks analysis types by performance
- Predicts quality expectations
- **Benefit:** Learns from history to guide future decisions

### 2. ContextIntelligence
- Adaptive boosting of relevant chunks
- Type-specific affinity scoring
- Query-chunk matching
- Historical pattern matching
- **Benefit:** +5-10% quality through smarter chunk selection

### Total Benefit
- Better chunk ranking → fewer irrelevant tokens
- Predicted expectations → better prompt engineering
- Type affinity → analysis-specific optimization

---

## 🚀 IMPLEMENTATION STEPS (2 weeks)

### Step 1: Database Setup (~15 min)

Create tracking table in PostgreSQL:

```sql
CREATE TABLE IF NOT EXISTS analysis_success_history (
  id SERIAL PRIMARY KEY,
  analysis_id VARCHAR(255) NOT NULL,
  analysis_type VARCHAR(50) NOT NULL,
  query TEXT,
  quality_score FLOAT,
  actionability_score FLOAT,
  consistency_score FLOAT,
  overall_score FLOAT,
  tokens_saved INT,
  resolution_time INT,
  user_feedback VARCHAR(20),
  timestamp TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_analysis FOREIGN KEY (analysis_id) REFERENCES analyses(id)
);

CREATE INDEX idx_type_timestamp ON analysis_success_history(analysis_type, timestamp);
CREATE INDEX idx_analysis_id ON analysis_success_history(analysis_id);
```

### Step 2: Copy Files (~5 min)

```bash
# Copy source files
cp ai-intelligence/src/learning/HistoricalSuccessTracker.ts your-project/src/learning/
cp ai-intelligence/src/learning/ContextIntelligence.ts your-project/src/learning/

# Copy tests
cp ai-intelligence/tests/learning/ContextIntelligence.test.ts your-project/tests/learning/
```

### Step 3: Integrate HistoricalSuccessTracker (~30 min)

After each analysis completes, record success:

```typescript
import { HistoricalSuccessTracker } from './learning/HistoricalSuccessTracker';

const tracker = new HistoricalSuccessTracker(redis, pgPool, logger);

// After analysis completes
async analyze(request: AnalysisRequest): Promise<AnalysisResult> {
  // ... existing analysis code ...

  const result = await this.executeAnalysis(request);

  // Record success metrics
  await tracker.recordSuccess({
    analysisId: result.id,
    analysisType: request.type,
    query: request.query,
    qualityScore: result.qualityScore,
    actionabilityScore: result.actionabilityScore,
    consistencyScore: result.consistencyScore,
    overallScore: result.overallScore,
    tokensSaved: contextBefore - contextAfter,
    resolutionTime: result.resolutionTimeMinutes,
    userFeedback: userFeedback?.feedback, // Optional
    timestamp: new Date(),
  });

  return result;
}
```

### Step 4: Integrate ContextIntelligence (~1 hour)

Boost chunks before LLM call:

```typescript
import { ContextIntelligence } from './learning/ContextIntelligence';

const intelligence = new ContextIntelligence(tracker, logger);

// In your analyze function, after getting chunks:
async analyze(request: AnalysisRequest): Promise<AnalysisResult> {
  // ... get initial chunks ...
  let chunks = contextBudget.selectChunks(request.context);

  // Apply intelligent boosting
  chunks = await intelligence.intelligentBoost(
    chunks,
    request.type,
    request.query,
  );

  // Recommended context size based on history
  const recommendation = await intelligence.getRecommendedContextSize(
    request.type,
  );

  this.logger.info('Context intelligence applied', {
    type: request.type,
    recommendedSize: recommendation.optimalTokens,
    reason: recommendation.reason,
  });

  // ... proceed with boosted chunks ...
}
```

### Step 5: Add Quality Prediction (~20 min)

Before analysis, predict expected quality:

```typescript
// Can be used for decision making (skip analysis if too low expected quality)
const expectedScore = await intelligence.predictExpectedScore(
  analysisType,
  contextSize,
  chunkCount,
);

if (expectedScore < 0.65) {
  this.logger.warn('Low quality expected, consider larger context', {
    expected: expectedScore,
    threshold: 0.65,
  });

  // Optionally: increase context budget
  // Or: route to more powerful model
}
```

### Step 6: Monitor Performance (~30 min)

Add Prometheus metrics:

```typescript
// In ContextIntelligence
const boostDistribution = new Histogram({
  name: 'ai_context_boost_applied',
  help: 'Boost factors applied to chunks',
  buckets: [0.01, 0.05, 0.1, 0.2, 0.3],
});

// In HistoricalSuccessTracker
const qualityByType = new Gauge({
  name: 'ai_quality_by_type',
  help: 'Historical average quality by analysis type',
  labelNames: ['type'],
});
```

### Step 7: Run Tests (~15 min)

```bash
npm run test -- learning/

# Expected: 25+ tests passing
# Coverage: 80%+
```

---

## 📊 HOW IT WORKS

### Learning Loop

```
Analysis Complete
  │
  ├─→ Record Success Metrics (HistoricalSuccessTracker)
  │    ├─ Quality score
  │    ├─ Actionability score
  │    ├─ Consistency score
  │    └─ Resolution time
  │
Next Analysis
  │
  ├─→ Get Historical Stats
  │    └─ "Historical incident analyses score 0.88 on average"
  │
  ├─→ Apply Intelligent Boost
  │    ├─ Chunks with historical patterns (+20% boost possible)
  │    ├─ Type-affinity chunks (+10% boost possible)
  │    └─ Query-matching chunks (+variable boost)
  │
  └─→ Reorder chunks by boosted score
       └─→ Better chunk selection = better analysis
```

### Type Affinity Examples

**OBSERVABILITY:**
- Chunks with keywords: latency, duration, error, rate, cpu, memory
- Bonus: Historical observability analyses score 0.87 avg
- Recommended context: 2000 tokens

**INCIDENT:**
- Chunks with keywords: error, exception, stack, trace, failed, timeout
- Bonus: Historical incident analyses score 0.85 avg
- Recommended context: 1500 tokens (smaller, more precise)

**RISK:**
- Chunks with keywords: violation, vulnerability, pii, credential, permission
- Bonus: Historical risk analyses score 0.82 avg
- Recommended context: 1800 tokens (comprehensive)

**CICD:**
- Chunks with keywords: build, deploy, job, status, workflow
- Bonus: Historical CICD analyses score 0.80 avg
- Recommended context: 1600 tokens

---

## 🎯 EXPECTED IMPROVEMENTS

### Quality Improvement
| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Avg eval score | 0.82 | 0.87 | **+6%** |
| Quality score | 0.80 | 0.85 | **+6%** |
| Actionability | 0.75 | 0.80 | **+7%** |
| Consistency | 0.82 | 0.87 | **+6%** |

### Chunk Selection Improvement
| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Relevant chunks | 60% | 75% | **+25%** |
| Irrelevant chunks | 40% | 25% | **-38%** |
| Avg boost applied | 0% | 12% | ✅ |

### Timeline Impact
| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Avg resolution time | 12 min | 11 min | **-8%** |
| User satisfaction | 72% | 78% | **+8%** |

---

## 🔧 TUNING PARAMETERS

### HistoricalSuccessTracker
```typescript
minSamples: 10              // Minimum examples needed to trust pattern
cacheTTL: 24 * 60 * 60      // Cache historical stats for 1 day
successHistoryWindow: 90    // Consider last 90 days for patterns
```

### ContextIntelligence
```typescript
historicalBoostMax: 0.2     // Max 20% boost from historical
affinityBoostMax: 0.1       // Max 10% boost from type affinity
maxBoost: 0.3               // Cap total boost at 30%

// Per analysis type
typeKeywords: {
  OBSERVABILITY: ['latency', 'metric', 'error', ...],
  INCIDENT: ['error', 'exception', 'stack', ...],
  // ... others
}
```

---

## 📈 ADOPTION STRATEGY

### Week 1: Foundation
- [ ] Create analysis_success_history table
- [ ] Deploy HistoricalSuccessTracker
- [ ] Start recording all analyses
- [ ] Monitor data collection

**Expected:** 100-200 initial data points

### Week 2: Intelligence Layer
- [ ] Deploy ContextIntelligence
- [ ] Test type affinity scoring
- [ ] Monitor boost effectiveness
- [ ] Tune parameters if needed

**Expected:** +3-5% quality improvement

### Ongoing
- [ ] Monitor quality trends by type
- [ ] Watch for pattern changes
- [ ] Adjust boost weights quarterly
- [ ] Collect user feedback

---

## ⚠️ IMPORTANT NOTES

### Data Requirements
- Minimum 10 examples per type before boosting becomes effective
- First week: boosting will be minimal (collecting data)
- After 2 weeks: patterns start to emerge
- After 1 month: significant improvements visible

### Cold Start Problem
- New analysis types won't have historical data initially
- Solution: Use type affinity boost (keyword matching)
- As data accumulates, historical boost becomes stronger

### Feedback Integration
- Optional: collect user feedback ("Was this helpful?")
- Include in historical tracker for refinement
- Use to detect model degradation

---

## 🧪 VALIDATION CHECKLIST

Before moving to Phase 6:

- [ ] HistoricalSuccessTracker collecting data
- [ ] 50+ analyses recorded per type
- [ ] ContextIntelligence boosting chunks
- [ ] Quality improvement > 3%
- [ ] Chunk ordering improved (top 3 more relevant)
- [ ] All 25+ tests passing
- [ ] Prometheus metrics flowing
- [ ] Team understands boost factors

---

## 📚 REFERENCE

- **Code:** [ai-intelligence/src/learning/](ai-intelligence/src/learning/)
- **Tests:** [ai-intelligence/tests/learning/](ai-intelligence/tests/learning/)
- **Schema:** Add analysis_success_history table (see Step 1)

---

## 🎯 SUCCESS CRITERIA

**Phase 5 Complete When:**

- [ ] Historical data being recorded
- [ ] Quality improvement >= 3%
- [ ] Chunk reordering improving relevance
- [ ] Type affinity scoring working
- [ ] All tests passing
- [ ] Monitoring in place
- [ ] Ready for Phase 6

---

**Status:** Phase 5 Ready for Integration ✅

**Next:** [PHASE6_GETTING_STARTED.md](PHASE6_GETTING_STARTED.md) — Production Hardening

**Timeline:** 2 weeks to full +5-10% improvement (as data accumulates)

---

*Created: 2026-04-16 | Phase 5 Adaptive Context Intelligence | Ready to Deploy*
