import { Logger } from 'winston';
import { Redis } from 'ioredis';
import { LLMClient } from '../clients/LLMClient';

export type QueryDomain = 'prometheus' | 'logs' | 'events' | 'sql';

export interface QueryRewriteResult {
  original: string;
  rewritten: string;
  tokensBeforeEstimate: number;
  tokensAfterEstimate: number;
  reduction: number; // 0-1
  fromCache: boolean;
  method: 'rule' | 'llm';
}

/**
 * QueryRewriter: Reescreve queries estruturadas para formato mais compacto
 *
 * Estratégia:
 * 1. Cache first (7 dias)
 * 2. Padrões conhecidos (rule-based)
 * 3. LLM fallback para queries complexas
 *
 * Exemplos:
 * - "rate(http_request_duration_seconds_bucket[5m])" → "http.p95.5m"
 * - "SELECT COUNT(*) FROM logs WHERE severity='ERROR'" → "log.err.cnt"
 */
export class QueryRewriter {
  private readonly redis: Redis;
  private readonly llm: LLMClient;
  private readonly logger: Logger;
  private readonly rulePatterns: Map<QueryDomain, Map<RegExp, string>>;
  private readonly cacheKeyPrefix = 'query_rewrite:';
  private readonly cacheTTL = 7 * 24 * 60 * 60; // 7 dias

  constructor(redis: Redis, llm: LLMClient, logger: Logger) {
    this.redis = redis;
    this.llm = llm;
    this.logger = logger;
    this.rulePatterns = this._initializeRulePatterns();
  }

  /**
   * Reescrever uma query estruturada
   */
  async rewrite(query: string, domain: QueryDomain): Promise<QueryRewriteResult> {
    const cacheKey = this._getCacheKey(query, domain);

    // ── Step 1: Verificar cache
    const cached = await this._getFromCache(cacheKey);

    if (cached) {
      this.logger.debug('Query rewritten from cache', {
        domain,
        original: query.substring(0, 50),
        cached: cached.rewritten.substring(0, 50),
      });

      return {
        ...cached,
        fromCache: true,
      };
    }

    // ── Step 2: Tentar padrões conhecidos (rule-based)
    const ruleResult = this._applyRulePatterns(query, domain);

    if (ruleResult) {
      this.logger.debug('Query rewritten by rule', {
        domain,
        reduction: (ruleResult.reduction * 100).toFixed(1) + '%',
      });

      // Cache o resultado
      await this._saveToCache(cacheKey, ruleResult);

      return {
        ...ruleResult,
        fromCache: false,
        method: 'rule',
      };
    }

    // ── Step 3: LLM fallback para queries complexas
    const llmResult = await this._rewriteWithLLM(query, domain);

    // Cache o resultado
    await this._saveToCache(cacheKey, llmResult);

    this.logger.debug('Query rewritten by LLM', {
      domain,
      reduction: (llmResult.reduction * 100).toFixed(1) + '%',
    });

    return {
      ...llmResult,
      fromCache: false,
      method: 'llm',
    };
  }

  /**
   * Batch rewriting de múltiplas queries
   */
  async rewriteBatch(
    queries: Array<{ query: string; domain: QueryDomain }>,
  ): Promise<QueryRewriteResult[]> {
    return Promise.all(queries.map((q) => this.rewrite(q.query, q.domain)));
  }

  // ════════════════════════════════════════════════════════════════
  // Private methods
  // ════════════════════════════════════════════════════════════════

  /**
   * Padrões conhecidos para otimização rápida
   */
  private _initializeRulePatterns(): Map<QueryDomain, Map<RegExp, string>> {
    const patterns = new Map<QueryDomain, Map<RegExp, string>>();

    // Prometheus PromQL patterns
    const prometheusPatterns = new Map<RegExp, string>();

    prometheusPatterns.set(
      /rate\(http_request_duration_seconds_bucket\[5m\]\)/gi,
      'http.p95.5m',
    );
    prometheusPatterns.set(
      /rate\(http_request_duration_seconds_bucket\[1m\]\)/gi,
      'http.p95.1m',
    );
    prometheusPatterns.set(
      /rate\(http_request_duration_seconds_bucket\[(\w+)\]\)/gi,
      'http.dur.$1',
    );
    prometheusPatterns.set(/rate\(errors_total\[(\w+)\]\)/gi, 'err.rate.$1');
    prometheusPatterns.set(
      /histogram_quantile\(0\.95,.*?\)/gi,
      'p95',
    );
    prometheusPatterns.set(
      /histogram_quantile\(0\.99,.*?\)/gi,
      'p99',
    );
    prometheusPatterns.set(
      /jvm_memory_used_bytes\{type="heap"\}/gi,
      'heap.used',
    );
    prometheusPatterns.set(
      /jvm_memory_max_bytes\{type="heap"\}/gi,
      'heap.max',
    );
    prometheusPatterns.set(/container_cpu_usage_seconds_total/gi, 'cpu.time');
    prometheusPatterns.set(/container_memory_working_set_bytes/gi, 'mem.ws');

    patterns.set('prometheus', prometheusPatterns);

    // SQL patterns
    const sqlPatterns = new Map<RegExp, string>();

    sqlPatterns.set(/SELECT COUNT\(\*\) FROM (\w+)/gi, '$1.cnt');
    sqlPatterns.set(
      /SELECT \* FROM (\w+) WHERE (.*?) LIMIT (\d+)/gi,
      '$1.sel.$3',
    );
    sqlPatterns.set(/WHERE severity='ERROR'/gi, 'sev:err');
    sqlPatterns.set(/WHERE severity='WARN'/gi, 'sev:warn');
    sqlPatterns.set(/ORDER BY timestamp DESC/gi, 'ord:time');

    patterns.set('sql', sqlPatterns);

    // Logs patterns
    const logsPatterns = new Map<RegExp, string>();

    logsPatterns.set(/level=ERROR/gi, 'lv:err');
    logsPatterns.set(/level=WARN/gi, 'lv:wrn');
    logsPatterns.set(/level=INFO/gi, 'lv:inf');
    logsPatterns.set(/service=(\w+)/gi, 'svc:$1');
    logsPatterns.set(/duration=(\d+)ms/gi, '$1ms');

    patterns.set('logs', logsPatterns);

    return patterns;
  }

  /**
   * Aplicar padrões conhecidos
   */
  private _applyRulePatterns(query: string, domain: QueryDomain): QueryRewriteResult | null {
    const patterns = this.rulePatterns.get(domain);

    if (!patterns) return null;

    let rewritten = query;
    let matched = false;

    for (const [pattern, replacement] of patterns) {
      if (pattern.test(query)) {
        rewritten = query.replace(pattern, replacement);
        matched = true;
        break;
      }
    }

    if (!matched) return null;

    const before = this._estimateTokens(query);
    const after = this._estimateTokens(rewritten);

    return {
      original: query,
      rewritten,
      tokensBeforeEstimate: before,
      tokensAfterEstimate: after,
      reduction: (before - after) / before,
    };
  }

  /**
   * Reescrever usando LLM para casos complexos
   */
  private async _rewriteWithLLM(
    query: string,
    domain: QueryDomain,
  ): Promise<QueryRewriteResult> {
    try {
      const response = await this.llm.call({
        systemPrompt: `You are a query optimization expert for ${domain}.
Your task: Rewrite this query in the most compact form possible (max 50 chars).
Rules:
- Maintain semantic meaning
- Use standard abbreviations
- Remove redundancy
- For ${domain === 'prometheus' ? 'PromQL' : domain === 'sql' ? 'SQL' : 'text'}, use domain-specific syntax
- ONLY respond with the rewritten query, nothing else`,
        userPrompt: `Query:\n${query}`,
      });

      const rewritten = response.content.trim();

      // Validação básica
      if (rewritten.length === 0 || rewritten.length > 100) {
        // Fallback se resposta inválida
        return {
          original: query,
          rewritten: query, // Retorna original se LLM falhou
          tokensBeforeEstimate: this._estimateTokens(query),
          tokensAfterEstimate: this._estimateTokens(query),
          reduction: 0,
        };
      }

      const before = this._estimateTokens(query);
      const after = this._estimateTokens(rewritten);

      return {
        original: query,
        rewritten,
        tokensBeforeEstimate: before,
        tokensAfterEstimate: after,
        reduction: Math.max(0, (before - after) / before),
      };
    } catch (error) {
      this.logger.warn('LLM query rewriting failed', {
        error: error instanceof Error ? error.message : 'unknown',
        query: query.substring(0, 50),
      });

      // Fallback: retorna query original
      return {
        original: query,
        rewritten: query,
        tokensBeforeEstimate: this._estimateTokens(query),
        tokensAfterEstimate: this._estimateTokens(query),
        reduction: 0,
      };
    }
  }

  /**
   * Estimação de tokens (heurística: ~4 chars = 1 token)
   */
  private _estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * Chave de cache
   */
  private _getCacheKey(query: string, domain: QueryDomain): string {
    const hash = this._simpleHash(query);
    return `${this.cacheKeyPrefix}${domain}:${hash}`;
  }

  /**
   * Simples hash para query
   */
  private _simpleHash(text: string): string {
    let hash = 0;

    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = (hash << 5) - hash + char;
    }

    return Math.abs(hash).toString(16);
  }

  /**
   * Obter do cache
   */
  private async _getFromCache(key: string): Promise<QueryRewriteResult | null> {
    try {
      const cached = await this.redis.get(key);

      if (!cached) return null;

      return JSON.parse(cached);
    } catch (error) {
      this.logger.debug('Cache retrieval failed', {
        error: error instanceof Error ? error.message : 'unknown',
      });

      return null;
    }
  }

  /**
   * Salvar no cache
   */
  private async _saveToCache(key: string, result: QueryRewriteResult): Promise<void> {
    try {
      await this.redis.setex(key, this.cacheTTL, JSON.stringify(result));
    } catch (error) {
      this.logger.warn('Cache save failed', {
        error: error instanceof Error ? error.message : 'unknown',
      });
    }
  }
}
