import { ContextChunk } from './ContextBudgetManager';

/**
 * Semantic Data Deduplication (SDD)
 *
 * Removes or merges context chunks that carry redundant information before
 * the ContextBudgetManager selects which chunks to send to the LLM.
 *
 * Why this matters:
 *   Without SDD, the same signal can appear in multiple chunks:
 *     - anomalyFlags: ['HIGH_LATENCY']       ← chunk 1
 *     - http.p95LatencyMs: 4800              ← chunk 2 (same fact, different form)
 *     - topSlowEndpoints: [...]              ← chunk 3 (consequence of same fact)
 *   The LLM receives 3 representations of the same problem → wasted tokens.
 *
 * Approach (no embeddings needed):
 *   1. Exact deduplication  – same key appears twice → keep highest score
 *   2. Numeric overlap      – two numeric signals within the same range → merge
 *   3. Text overlap         – error messages with Jaccard similarity > threshold → merge
 *   4. Flag-to-field merge  – if anomalyFlags already covers a signal, reduce the
 *                             baseRelevance of the raw numeric chunk (don't drop,
 *                             just demote so the budget manager ranks it lower)
 *   5. Array dedup          – remove duplicate entries within an array chunk
 */
export class SemanticDeduplicator {
  /**
   * @param textSimilarityThreshold  Jaccard similarity above which two string
   *                                 entries are considered duplicates [0–1].
   *                                 Default 0.6 is aggressive enough to catch
   *                                 paraphrased error messages.
   */
  constructor(private readonly textSimilarityThreshold = 0.6) {}

  deduplicate(chunks: ContextChunk[]): ContextChunk[] {
    let result = this.exactKeyDedup(chunks);
    result = this.demoteRedundantNumericChunks(result);
    result = this.deduplicateArrayEntries(result);
    return result;
  }

  // ─── Step 1: Exact key deduplication ─────────────────────────────────────
  // If two chunks have the same key (shouldn't happen normally, but can when
  // multiple collectors contribute the same metric name), keep the higher score.

  private exactKeyDedup(chunks: ContextChunk[]): ContextChunk[] {
    const seen = new Map<string, ContextChunk>();

    for (const chunk of chunks) {
      const existing = seen.get(chunk.key);
      if (!existing || chunk.baseRelevance > existing.baseRelevance) {
        seen.set(chunk.key, chunk);
      }
    }

    return [...seen.values()];
  }

  // ─── Step 2: Demote numeric chunks that are already summarised in flags ───
  // The anomalyFlags chunk is a distilled summary of the raw numeric signals.
  // If a flag covers a numeric chunk, reduce the numeric chunk's relevance by 30%
  // so the budget manager is less likely to include both.

  private demoteRedundantNumericChunks(chunks: ContextChunk[]): ContextChunk[] {
    const flagChunk = chunks.find((c) => c.key === 'anomalyFlags');
    if (!flagChunk || !Array.isArray(flagChunk.data) || flagChunk.data.length === 0) {
      return chunks;
    }

    const activeFlags = new Set<string>(flagChunk.data as string[]);

    const FLAG_TO_CHUNK: Record<string, string[]> = {
      HIGH_HEAP_USAGE:     ['jvm'],
      GC_PAUSE_ALERT:      ['jvm'],
      HIGH_ERROR_RATE:     ['http'],
      HIGH_LATENCY:        ['http'],
      HIGH_CPU:            ['system'],
      THREAD_SATURATION:   ['jvm'],
    };

    // Collect which chunk keys are already covered by active flags
    const coveredKeys = new Set<string>();
    for (const flag of activeFlags) {
      for (const key of FLAG_TO_CHUNK[flag] ?? []) {
        coveredKeys.add(key);
      }
    }

    return chunks.map((chunk) => {
      if (coveredKeys.has(chunk.key)) {
        // Demote by 30% – still included if budget allows, but won't crowd out
        // uncovered chunks with useful novel information
        return { ...chunk, baseRelevance: chunk.baseRelevance * 0.7 };
      }
      return chunk;
    });
  }

  // ─── Step 3: Deduplicate entries within array chunks ─────────────────────
  // Handles two sub-cases:
  //   a) Exact duplicate objects (same name/key)
  //   b) Near-duplicate strings (Jaccard similarity > threshold)

  private deduplicateArrayEntries(chunks: ContextChunk[]): ContextChunk[] {
    return chunks.map((chunk) => {
      if (!Array.isArray(chunk.data)) return chunk;

      const arr = chunk.data as unknown[];

      if (arr.length === 0) return chunk;

      // Detect element type
      if (typeof arr[0] === 'string') {
        return { ...chunk, data: this.deduplicateStrings(arr as string[]) };
      }

      if (typeof arr[0] === 'object' && arr[0] !== null) {
        return { ...chunk, data: this.deduplicateObjects(arr as Record<string, unknown>[]) };
      }

      return chunk;
    });
  }

  /**
   * Removes near-duplicate strings using Jaccard similarity on word tokens.
   * Keeps the first occurrence of each semantic cluster.
   */
  private deduplicateStrings(arr: string[]): string[] {
    const kept: string[] = [];

    for (const candidate of arr) {
      const isDuplicate = kept.some(
        (existing) => this.jaccardSimilarity(candidate, existing) >= this.textSimilarityThreshold,
      );
      if (!isDuplicate) kept.push(candidate);
    }

    return kept;
  }

  /**
   * Removes exact duplicate objects and objects with the same primary key
   * (name, id, uri, fullName — whichever is present).
   */
  private deduplicateObjects(arr: Record<string, unknown>[]): Record<string, unknown>[] {
    const seenKeys = new Set<string>();
    const seenJson = new Set<string>();
    const kept: Record<string, unknown>[] = [];

    for (const obj of arr) {
      // Exact JSON dedup
      const json = JSON.stringify(obj);
      if (seenJson.has(json)) continue;
      seenJson.add(json);

      // Primary key dedup (handles renamed/updated entries with same identity)
      const primaryKey =
        (obj['name'] ?? obj['id'] ?? obj['uri'] ?? obj['fullName'] ?? obj['key']) as string | undefined;

      if (primaryKey !== undefined) {
        if (seenKeys.has(String(primaryKey))) continue;
        seenKeys.add(String(primaryKey));
      }

      kept.push(obj);
    }

    return kept;
  }

  /**
   * Jaccard similarity between two strings, tokenised on whitespace and punctuation.
   * Range [0, 1]. Fast enough for short error messages (<500 chars).
   */
  private jaccardSimilarity(a: string, b: string): number {
    const tokenize = (s: string): Set<string> =>
      new Set(s.toLowerCase().split(/[\s\W]+/).filter(Boolean));

    const setA = tokenize(a);
    const setB = tokenize(b);

    if (setA.size === 0 && setB.size === 0) return 1;
    if (setA.size === 0 || setB.size === 0) return 0;

    let intersection = 0;
    for (const token of setA) {
      if (setB.has(token)) intersection++;
    }

    const union = setA.size + setB.size - intersection;
    return intersection / union;
  }
}
