import { Logger } from 'winston';
import { Redis } from 'ioredis';
import { AnalysisType } from '../types/analysis.types';

/**
 * Quota de uso para prevenir explosão de custo
 */
export interface RateLimitQuota {
  userId: string;
  analysisType: AnalysisType;
  environment: 'dev' | 'staging' | 'production';

  // Limites
  maxRequestsPerHour: number;
  maxCostPerHour: number;              // USD
  maxReexecutionsPerRequest: number;
  maxTokensPerMonth: number;

  // Uso atual
  requestsThisHour: number;
  costThisHour: number;
  tokensThisMonth: number;

  // Timestamps
  hourResetAt: Date;
  monthResetAt: Date;

  createdAt: Date;
}

export interface RateLimitDecision {
  allowed: boolean;
  reason?: string;
  tokensEstimate: number;
  costEstimate: number;
  quotaRemaining: {
    requestsPerHour: number;
    costPerHour: number;
    tokensPerMonth: number;
  };
  suggestedWaitTime?: number; // segundos
}

/**
 * RateLimitingEngine: Previne consumo excessivo de IA
 *
 * Responsabilidades:
 * 1. Rastrear uso (requests, custos, tokens) por usuário/tipo
 * 2. Bloquear se exceder quota
 * 3. Estimar custos antes da execução
 * 4. Sugerir quando parar (circuit breaker)
 * 5. Diferentes quotas por environment/tier
 *
 * Limites (produção):
 * - 100 requests/hora por usuário
 * - $100/hora por usuário
 * - 1M tokens/mês por usuário
 * - Max 3 reexecuções por request
 *
 * Estratégia:
 * - Redis para rastreamento em tempo real
 * - Sliding window (últimas N horas/meses)
 * - Circuit breaker se custo/tokens acumulados
 * - Backoff exponencial se limite atingido
 */
export class RateLimitingEngine {
  private readonly redis: Redis;
  private readonly logger: Logger;

  // Quotas padrão por environment
  private readonly defaultQuotas = {
    dev: {
      maxRequestsPerHour: 1000,
      maxCostPerHour: 500,
      maxReexecutionsPerRequest: 10,
      maxTokensPerMonth: 100000000, // 100M
    },
    staging: {
      maxRequestsPerHour: 500,
      maxCostPerHour: 200,
      maxReexecutionsPerRequest: 5,
      maxTokensPerMonth: 50000000, // 50M
    },
    production: {
      maxRequestsPerHour: 100,
      maxCostPerHour: 100,
      maxReexecutionsPerRequest: 3,
      maxTokensPerMonth: 10000000, // 10M
    },
  };

  constructor(redis: Redis, logger: Logger) {
    this.redis = redis;
    this.logger = logger;

    this.logger.info('RateLimitingEngine initialized');
  }

  /**
   * Verificar se request é permitido
   */
  async checkRateLimit(
    userId: string,
    analysisType: AnalysisType,
    environment: 'dev' | 'staging' | 'production',
    estimatedTokens: number = 2000,
  ): Promise<RateLimitDecision> {
    try {
      const quotaKey = `quota:${userId}:${analysisType}:${environment}`;
      const costKey = `cost:${userId}:${environment}`;
      const tokensKey = `tokens:${userId}`;

      // Obter quotas
      const quota = await this._getQuota(userId, analysisType, environment);
      const costEstimate = (estimatedTokens / 1000) * 0.02; // Estimativa: $0.02 per 1k tokens

      // Verificar requests por hora
      const requestsThisHour = await this._getCounter(quotaKey, 'hour');
      if (requestsThisHour >= quota.maxRequestsPerHour) {
        return {
          allowed: false,
          reason: `Rate limit exceeded: ${requestsThisHour}/${quota.maxRequestsPerHour} requests/hour`,
          tokensEstimate: estimatedTokens,
          costEstimate,
          quotaRemaining: {
            requestsPerHour: 0,
            costPerHour: quota.maxCostPerHour,
            tokensPerMonth: quota.maxTokensPerMonth,
          },
          suggestedWaitTime: 60,
        };
      }

      // Verificar custo por hora
      const costThisHour = await this._getCostThisHour(costKey);
      if (costThisHour + costEstimate > quota.maxCostPerHour) {
        return {
          allowed: false,
          reason: `Cost limit exceeded: $${(costThisHour + costEstimate).toFixed(2)}/$${quota.maxCostPerHour}`,
          tokensEstimate: estimatedTokens,
          costEstimate,
          quotaRemaining: {
            requestsPerHour: quota.maxRequestsPerHour - requestsThisHour,
            costPerHour: 0,
            tokensPerMonth: quota.maxTokensPerMonth,
          },
          suggestedWaitTime: 120,
        };
      }

      // Verificar tokens por mês
      const tokensThisMonth = await this._getCounter(tokensKey, 'month');
      if (tokensThisMonth + estimatedTokens > quota.maxTokensPerMonth) {
        return {
          allowed: false,
          reason: `Monthly token limit exceeded`,
          tokensEstimate: estimatedTokens,
          costEstimate,
          quotaRemaining: {
            requestsPerHour: quota.maxRequestsPerHour - requestsThisHour,
            costPerHour: quota.maxCostPerHour - costThisHour,
            tokensPerMonth: 0,
          },
          suggestedWaitTime: 86400, // 1 dia
        };
      }

      // PERMITIDO
      return {
        allowed: true,
        tokensEstimate: estimatedTokens,
        costEstimate,
        quotaRemaining: {
          requestsPerHour: quota.maxRequestsPerHour - requestsThisHour - 1,
          costPerHour: quota.maxCostPerHour - costThisHour - costEstimate,
          tokensPerMonth: quota.maxTokensPerMonth - tokensThisMonth - estimatedTokens,
        },
      };
    } catch (error) {
      this.logger.error('Error checking rate limit', {
        error: error instanceof Error ? error.message : 'unknown',
      });

      // Erro = permite (fail open)
      return {
        allowed: true,
        tokensEstimate: 0,
        costEstimate: 0,
        quotaRemaining: {
          requestsPerHour: 0,
          costPerHour: 0,
          tokensPerMonth: 0,
        },
      };
    }
  }

  /**
   * Registrar uso após execução
   */
  async recordUsage(
    userId: string,
    analysisType: AnalysisType,
    environment: 'dev' | 'staging' | 'production',
    actualTokensUsed: number,
    actualCost: number,
  ): Promise<void> {
    try {
      const quotaKey = `quota:${userId}:${analysisType}:${environment}`;
      const costKey = `cost:${userId}:${environment}`;
      const tokensKey = `tokens:${userId}`;

      // Incrementar counters (com expiração)
      await this.redis.incrby(quotaKey, 1);
      await this.redis.expire(quotaKey, 3600); // 1 hora

      await this.redis.incrbyfloat(costKey, actualCost);
      await this.redis.expire(costKey, 3600);

      await this.redis.incrby(tokensKey, actualTokensUsed);
      await this.redis.expire(tokensKey, 2592000); // 30 dias

      this.logger.debug('Usage recorded', {
        userId,
        analysisType,
        environment,
        tokensUsed: actualTokensUsed,
        cost: actualCost,
      });
    } catch (error) {
      this.logger.warn('Failed to record usage', {
        error: error instanceof Error ? error.message : 'unknown',
      });
    }
  }

  /**
   * Estimar custo de operação
   */
  async estimateCost(
    analysisType: AnalysisType,
    criticality: string,
    contextSize: number,
  ): Promise<number> {
    // Estimativa baseada em histórico
    const baseTokens = contextSize / 4; // ~1 token por 4 chars

    const typeMultiplier = {
      observability: 1.0,
      test_intelligence: 1.5, // Mais complexo
      cicd: 0.8,
      incident: 2.0, // Muito mais tokens (análise profunda)
      risk: 1.2,
    };

    const criticityMultiplier = {
      LOW: 0.8,
      NORMAL: 1.0,
      HIGH: 1.3,
      CRITICAL: 1.5,
    };

    const estimatedTokens =
      baseTokens * (typeMultiplier[analysisType] || 1) * (criticityMultiplier[criticality] || 1);

    // $0.02 per 1k tokens (GPT-4 pricing)
    const cost = (estimatedTokens / 1000) * 0.02;

    return Math.round(cost * 100) / 100; // Arredondar para 2 casas decimais
  }

  /**
   * Gerar relatório de uso
   */
  async getUserUsageReport(userId: string, environment: 'dev' | 'staging' | 'production'): Promise<{
    requestsThisHour: number;
    costThisHour: number;
    tokensThisMonth: number;
    quotas: Record<string, number>;
    percentageUsed: Record<string, number>;
  }> {
    try {
      const quota = this.defaultQuotas[environment];

      // Obter uso atual
      const requestsThisHour = await this._getCounter(
        `quota:${userId}:*:${environment}`,
        'hour',
      );
      const costThisHour = await this._getCostThisHour(`cost:${userId}:${environment}`);
      const tokensThisMonth = await this._getCounter(`tokens:${userId}`, 'month');

      return {
        requestsThisHour,
        costThisHour: Math.round(costThisHour * 100) / 100,
        tokensThisMonth,
        quotas: {
          maxRequestsPerHour: quota.maxRequestsPerHour,
          maxCostPerHour: quota.maxCostPerHour,
          maxTokensPerMonth: quota.maxTokensPerMonth,
        },
        percentageUsed: {
          requests: (requestsThisHour / quota.maxRequestsPerHour) * 100,
          cost: (costThisHour / quota.maxCostPerHour) * 100,
          tokens: (tokensThisMonth / quota.maxTokensPerMonth) * 100,
        },
      };
    } catch (error) {
      this.logger.error('Error generating usage report', {
        error: error instanceof Error ? error.message : 'unknown',
      });
      throw error;
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // Private methods
  // ═══════════════════════════════════════════════════════════════════

  private async _getQuota(
    userId: string,
    analysisType: AnalysisType,
    environment: 'dev' | 'staging' | 'production',
  ): Promise<RateLimitQuota> {
    // TODO: Carregar do banco de dados se existe quota customizada
    // Por enquanto, retornar quota padrão

    const defaults = this.defaultQuotas[environment];

    return {
      userId,
      analysisType,
      environment,
      maxRequestsPerHour: defaults.maxRequestsPerHour,
      maxCostPerHour: defaults.maxCostPerHour,
      maxReexecutionsPerRequest: defaults.maxReexecutionsPerRequest,
      maxTokensPerMonth: defaults.maxTokensPerMonth,
      requestsThisHour: 0,
      costThisHour: 0,
      tokensThisMonth: 0,
      hourResetAt: new Date(Date.now() + 3600000),
      monthResetAt: new Date(Date.now() + 2592000000),
      createdAt: new Date(),
    };
  }

  private async _getCounter(key: string, window: 'hour' | 'month'): Promise<number> {
    try {
      const value = await this.redis.get(key);
      return parseInt(value || '0', 10);
    } catch {
      return 0;
    }
  }

  private async _getCostThisHour(costKey: string): Promise<number> {
    try {
      const value = await this.redis.get(costKey);
      return parseFloat(value || '0');
    } catch {
      return 0;
    }
  }
}
