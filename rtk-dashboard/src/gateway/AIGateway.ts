/**
 * AI Gateway: Central entry point for all analysis requests
 *
 * Responsibilities:
 * - Request validation & input sanitization
 * - Security classification & masking
 * - Quota & rate limiting
 * - Model routing decision
 * - Cache lookup
 * - Orchestration + result formatting
 * - Metric emission
 */

import { Logger } from 'winston';
import { RedisClient } from 'redis';
import { v4 as uuidv4 } from 'uuid';

import {
  EnterpriseAnalysisRequest,
  EnterpriseAnalysisResult,
  GatewayRequest,
  GatewayResponse,
  RoutingContext,
  Criticality,
  SecureRoutingResult,
  QuotaConfig,
} from '../types/enterprise.types';

import { AIOrchestrator } from '../orchestrator/AIOrchestrator';
import { ModelRouter } from '../routing/ModelRouter';
import { SecureRouter } from '../security/SecureRouter';
import { MemoryLayer } from '../memory/MemoryLayer';
import { AIMetricsCollector } from '../observability/AIMetrics';

export class AIGateway {
  private readonly orchestrator: AIOrchestrator;
  private readonly modelRouter: ModelRouter;
  private readonly secureRouter: SecureRouter;
  private readonly memory: MemoryLayer;
  private readonly redis: RedisClient;
  private readonly logger: Logger;
  private readonly metricsCollector: AIMetricsCollector;

  // Rate limiting & quota
  private quotaStore: Map<string, QuotaConfig> = new Map();
  private readonly requestCache = 3600; // 1h TTL for cache

  constructor(
    orchestrator: AIOrchestrator,
    modelRouter: ModelRouter,
    secureRouter: SecureRouter,
    memory: MemoryLayer,
    redis: RedisClient,
    logger: Logger,
  ) {
    this.orchestrator = orchestrator;
    this.modelRouter = modelRouter;
    this.secureRouter = secureRouter;
    this.memory = memory;
    this.redis = redis;
    this.logger = logger;
    this.metricsCollector = new AIMetricsCollector();
  }

  /**
   * Main entry point: process a gateway request
   */
  async process(request: GatewayRequest): Promise<GatewayResponse> {
    const startTime = Date.now();
    this.metricsCollector.startTimer('gateway.process', 'ai.gateway.duration_ms');

    try {
      // ── Step 1: Validate & authenticate
      this._validateRequest(request);
      await this._validateApiKey(request.userId, request.apiKey);

      // ── Step 2: Check quota
      await this._checkQuota(request.userId);

      // ── Step 3: Check cache
      const cached = await this._lookupCache(request.analysisRequest);
      if (cached) {
        this.logger.info('Cache hit', { correlationId: request.correlationId });
        await this._updateQuotaUsage(request.userId, 0, cached.costUsd);

        return {
          result: cached,
          quota: await this._getQuotaStatus(request.userId),
          cached: true,
          correlationId: request.correlationId,
        };
      }

      // ── Step 4: Memory-augmented context
      this.metricsCollector.startTimer('memory.retrieve', 'ai.memory.retrieval_ms');
      const contextEnhanced = await this._enhanceContextWithMemory(
        request.analysisRequest,
      );
      this.metricsCollector.endTimer('memory.retrieve', 'ai.memory.retrieval_ms');

      // ── Step 5: Security classification & routing
      this.metricsCollector.startTimer('security', 'ai.security.classification_ms');
      const secureRoute = await this._secureRoute(request.analysisRequest, contextEnhanced);
      this.metricsCollector.endTimer('security', 'ai.security.classification_ms');

      // ── Step 6: Execute analysis
      this.metricsCollector.startTimer('orchestration', 'ai.orchestration_ms');
      const result = await this._executeAnalysis(
        request.analysisRequest,
        contextEnhanced,
        secureRoute,
      );
      this.metricsCollector.endTimer('orchestration', 'ai.orchestration_ms');

      // ── Step 7: Store in memory (async, non-blocking)
      this._storeInMemory(result).catch((error) => {
        this.logger.warn('Memory storage failed', { error });
      });

      // ── Step 8: Cache result
      await this._cacheResult(request.analysisRequest, result);

      // ── Step 9: Update quota
      await this._updateQuotaUsage(request.userId, 1, result.costUsd);

      // ── Step 10: Emit metrics
      this._emitMetrics(request.userId, result, secureRoute);

      this.metricsCollector.endTimer('gateway.process', 'ai.gateway.duration_ms');

      return {
        result,
        quota: await this._getQuotaStatus(request.userId),
        cached: false,
        correlationId: request.correlationId,
      };

    } catch (error) {
      this.logger.error('Gateway processing failed', {
        error,
        correlationId: request.correlationId,
        userId: request.userId,
      });

      throw error;
    }
  }

  // ──────────────────────────────────────────────────────────────
  // PRIVATE: Validation
  // ──────────────────────────────────────────────────────────────

  private _validateRequest(request: GatewayRequest): void {
    if (!request.analysisRequest.query || request.analysisRequest.query.trim().length === 0) {
      throw new Error('Invalid request: empty query');
    }

    if (request.analysisRequest.query.length > 50000) {
      throw new Error('Invalid request: query too large (max 50KB)');
    }

    if (!request.userId || !request.apiKey) {
      throw new Error('Invalid request: missing auth credentials');
    }
  }

  private async _validateApiKey(userId: string, apiKey: string): Promise<void> {
    const cached = await this.redis.get(`apikey:${apiKey}`);

    if (!cached) {
      throw new Error('Unauthorized: invalid API key');
    }

    const stored = JSON.parse(cached);
    if (stored.userId !== userId) {
      throw new Error('Unauthorized: API key does not match user');
    }

    if (new Date(stored.expiresAt) < new Date()) {
      throw new Error('Unauthorized: API key expired');
    }
  }

  // ──────────────────────────────────────────────────────────────
  // PRIVATE: Quota & Rate Limiting
  // ──────────────────────────────────────────────────────────────

  private async _checkQuota(userId: string): Promise<void> {
    const quotaKey = `quota:${userId}`;
    const quota = await this.redis.get(quotaKey);

    if (!quota) {
      // First time user or quota reset
      const defaultQuota: QuotaConfig = {
        dailyRequests: 100,
        monthlyBudgetUsd: 50,
        maxContextSize: 10000,
        maxConcurrentAnalyses: 5,
        priorityLevel: 'normal',
      };
      this.quotaStore.set(userId, defaultQuota);
      return;
    }

    const parsedQuota = JSON.parse(quota);

    if (parsedQuota.dailyRequests <= 0) {
      throw new Error('Quota exceeded: daily request limit');
    }

    if (parsedQuota.monthlyBudgetUsd <= 0.01) {
      throw new Error('Quota exceeded: monthly budget');
    }
  }

  private async _updateQuotaUsage(userId: string, requests: number, costUsd: number): Promise<void> {
    const quotaKey = `quota:${userId}`;
    const quota = await this.redis.get(quotaKey);

    if (!quota) {
      return; // No quota tracking yet
    }

    const parsed = JSON.parse(quota);
    parsed.dailyRequests -= requests;
    parsed.monthlyBudgetUsd -= costUsd;

    await this.redis.setex(quotaKey, 86400, JSON.stringify(parsed)); // 24h
  }

  private async _getQuotaStatus(userId: string) {
    const quotaKey = `quota:${userId}`;
    const quota = await this.redis.get(quotaKey);

    const parsed = quota ? JSON.parse(quota) : { dailyRequests: 0, monthlyBudgetUsd: 0 };

    return {
      remaining: parsed.dailyRequests,
      budgetRemaining: parsed.monthlyBudgetUsd,
      throttled: parsed.dailyRequests < 5 || parsed.monthlyBudgetUsd < 1,
    };
  }

  // ──────────────────────────────────────────────────────────────
  // PRIVATE: Cache
  // ──────────────────────────────────────────────────────────────

  private async _lookupCache(request: EnterpriseAnalysisRequest): Promise<EnterpriseAnalysisResult | null> {
    const cacheKey = this._getCacheKey(request);
    const cached = await this.redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    return null;
  }

  private async _cacheResult(
    request: EnterpriseAnalysisRequest,
    result: EnterpriseAnalysisResult,
  ): Promise<void> {
    const cacheKey = this._getCacheKey(request);
    await this.redis.setex(cacheKey, this.requestCache, JSON.stringify(result));
  }

  private _getCacheKey(request: EnterpriseAnalysisRequest): string {
    const hash = require('crypto')
      .createHash('sha256')
      .update(request.type + request.query)
      .digest('hex');

    return `analysis:${hash}`;
  }

  // ──────────────────────────────────────────────────────────────
  // PRIVATE: Memory & Context
  // ──────────────────────────────────────────────────────────────

  private async _enhanceContextWithMemory(
    request: EnterpriseAnalysisRequest,
  ): Promise<EnterpriseAnalysisRequest> {
    try {
      const enhancedContext = await this.memory.enhanceContext(
        request.query,
        request.type,
        request.context || [],
      );

      return {
        ...request,
        context: enhancedContext,
      };

    } catch (error) {
      this.logger.warn('Memory enhancement failed, continuing with original context', { error });
      return request;
    }
  }

  private async _storeInMemory(result: EnterpriseAnalysisResult): Promise<void> {
    // Only store high-quality results
    if (result.qualityScore < 0.75) {
      return;
    }

    await this.memory.store({
      id: result.id,
      type: result.type,
      query: result.query,
      keyPoints: result.keyPoints,
      recommendations: result.recommendations,
      qualityScore: result.qualityScore,
    } as any);
  }

  // ──────────────────────────────────────────────────────────────
  // PRIVATE: Security & Routing
  // ──────────────────────────────────────────────────────────────

  private async _secureRoute(
    request: EnterpriseAnalysisRequest,
    enhancedRequest: EnterpriseAnalysisRequest,
  ): Promise<SecureRoutingResult> {
    const contextStr = (enhancedRequest.context || [])
      .map((chunk) => JSON.stringify(chunk.data))
      .join('\n');

    return this.secureRouter.routeSecurely(request, contextStr);
  }

  // ──────────────────────────────────────────────────────────────
  // PRIVATE: Execution
  // ──────────────────────────────────────────────────────────────

  private async _executeAnalysis(
    request: EnterpriseAnalysisRequest,
    enhancedRequest: EnterpriseAnalysisRequest,
    secureRoute: SecureRoutingResult,
  ): Promise<EnterpriseAnalysisResult> {
    // Execute through orchestrator (which uses the decided model)
    const result = await this.orchestrator.analyze({
      type: request.type,
      ...enhancedRequest,
      modelOverride: secureRoute.model,
    } as any);

    return {
      ...result,
      modelUsed: secureRoute.model.modelName,
      costUsd: secureRoute.model.costEstimate,
      durationMs: Date.now() - request.timestamp.getTime(),
    } as EnterpriseAnalysisResult;
  }

  // ──────────────────────────────────────────────────────────────
  // PRIVATE: Metrics
  // ──────────────────────────────────────────────────────────────

  private _emitMetrics(
    userId: string,
    result: EnterpriseAnalysisResult,
    secureRoute: SecureRoutingResult,
  ): void {
    const metrics = this.metricsCollector.getMetrics();

    this.logger.info('Analysis completed', {
      userId,
      analysisId: result.id,
      type: result.type,
      model: result.modelUsed,
      cost: result.costUsd,
      quality: result.qualityScore,
      duration: result.durationMs,
      metrics,
      security: {
        sensitivity: secureRoute.sensitivity,
        masked: secureRoute.masked,
      },
    });

    // Emit to Prometheus / OpenTelemetry
    // (Implementation depends on your metrics backend)
  }
}

/**
 * Factory function for production use
 */
export async function createAIGateway(
  dependencies: {
    orchestrator: AIOrchestrator;
    modelRouter: ModelRouter;
    secureRouter: SecureRouter;
    memory: MemoryLayer;
    redis: RedisClient;
    logger: Logger;
  },
): Promise<AIGateway> {
  return new AIGateway(
    dependencies.orchestrator,
    dependencies.modelRouter,
    dependencies.secureRouter,
    dependencies.memory,
    dependencies.redis,
    dependencies.logger,
  );
}
