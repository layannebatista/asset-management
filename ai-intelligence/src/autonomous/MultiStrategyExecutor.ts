import { Logger } from 'winston';
import { Pool } from 'pg';
import { DecisionOutput } from '../types/DecisionOutput';
import { AnalysisType } from '../types/analysis.types';

/**
 * Estratégia de execução
 */
export interface ExecutionStrategy {
  id: string;
  name: string;
  type: 'fast_model' | 'precise_model' | 'expanded_context' | 'alternative_prompt' | 'ensemble';
  config: Record<string, any>;
  expectedQuality: number;
  expectedLatency: number;
  expectedCost: number;
}

/**
 * Resultado de uma estratégia
 */
export interface StrategyResult {
  strategy: ExecutionStrategy;
  decision: DecisionOutput;
  executionTime: number;
  actualCost: number;
  compositeScore: number; // weighted: quality 50%, latency 20%, cost 30%
}

/**
 * Comparação de estratégias
 */
export interface StrategyComparison {
  winnerStrategy: ExecutionStrategy;
  winner: StrategyResult;
  runners: StrategyResult[];
  ranking: Array<{
    rank: number;
    strategy: ExecutionStrategy;
    score: number;
    reason: string;
  }>;
  recommendation: string;
}

/**
 * MultiStrategyExecutor: Executa múltiplas estratégias em paralelo
 *
 * Estratégias:
 * 1. fast_model: GPT-4o-mini, latência baixa
 * 2. precise_model: GPT-4-turbo, qualidade alta
 * 3. expanded_context: +50% tokens, contexto melhor
 * 4. alternative_prompt: Versão otimizada do prompt
 * 5. ensemble: Combina múltiplas (voting)
 *
 * Seleciona melhor baseado em:
 * - Quality (50%)
 * - Latency (20%)
 * - Cost (30%)
 *
 * Máximo 2 estratégias paralelas para economizar tokens
 */
export class MultiStrategyExecutor {
  private readonly pgPool: Pool;
  private readonly logger: Logger;

  // Estratégias predefinidas
  private readonly strategies: ExecutionStrategy[] = [
    {
      id: 'fast',
      name: 'Fast Model',
      type: 'fast_model',
      config: { model: 'gpt-4o-mini', context_size: 1500 },
      expectedQuality: 0.72,
      expectedLatency: 2000,
      expectedCost: 0.005,
    },
    {
      id: 'precise',
      name: 'Precise Model',
      type: 'precise_model',
      config: { model: 'gpt-4-turbo', context_size: 1500 },
      expectedQuality: 0.85,
      expectedLatency: 3500,
      expectedCost: 0.012,
    },
    {
      id: 'expanded',
      name: 'Expanded Context',
      type: 'expanded_context',
      config: { model: 'gpt-4o', context_size: 2500 },
      expectedQuality: 0.80,
      expectedLatency: 3000,
      expectedCost: 0.010,
    },
    {
      id: 'ensemble',
      name: 'Ensemble (2 models + voting)',
      type: 'ensemble',
      config: { models: ['gpt-4o-mini', 'gpt-4o'], voting: true },
      expectedQuality: 0.82,
      expectedLatency: 4000,
      expectedCost: 0.015,
    },
  ];

  constructor(pgPool: Pool, logger: Logger) {
    this.pgPool = pgPool;
    this.logger = logger;
  }

  /**
   * Executar múltiplas estratégias em paralelo
   */
  async executeMultiStrategy(
    analysisType: AnalysisType,
    context: Record<string, any>,
    criticality: string,
    maxStrategies: number = 2,
  ): Promise<StrategyComparison> {
    try {
      // ── Step 1: Selecionar estratégias para este tipo
      const selectedStrategies = this._selectStrategies(analysisType, criticality, maxStrategies);

      this.logger.info('Executing multiple strategies in parallel', {
        analysisType,
        strategyCount: selectedStrategies.length,
        strategies: selectedStrategies.map((s) => s.name),
      });

      // ── Step 2: Executar em paralelo (mock - em produção seria real executor)
      const results: StrategyResult[] = await Promise.all(
        selectedStrategies.map((strategy) => this._executeStrategy(strategy, context, analysisType)),
      );

      // ── Step 3: Rankear resultados
      const ranking = this._rankResults(results);

      // ── Step 4: Selecionar vencedor
      const winnerRank = ranking[0];
      const winner = results.find((r) => r.strategy.id === winnerRank.strategy.id)!;

      // ── Step 5: Gerar recomendação
      const recommendation = this._generateRecommendation(ranking, criticality);

      const comparison: StrategyComparison = {
        winnerStrategy: winner.strategy,
        winner,
        runners: results.filter((r) => r.strategy.id !== winner.strategy.id),
        ranking,
        recommendation,
      };

      this.logger.info('Strategy comparison complete', {
        winner: winner.strategy.name,
        winningScore: winnerRank.score.toFixed(2),
        quality: winner.decision.metrics.quality_score.toFixed(2),
        latency: winner.executionTime,
        cost: winner.actualCost.toFixed(4),
      });

      // ── Step 6: Registrar comparação
      await this._recordComparison(analysisType, comparison);

      return comparison;
    } catch (error) {
      this.logger.error('Error executing multiple strategies', {
        error: error instanceof Error ? error.message : 'unknown',
      });

      throw error;
    }
  }

  /**
   * Obter histórico de comparações (qual estratégia ganhou mais)
   */
  async getStrategyWinRate(analysisType: AnalysisType, days: number = 30): Promise<
    Array<{
      strategyId: string;
      strategyName: string;
      winRate: number;
      avgQuality: number;
      avgLatency: number;
      avgCost: number;
      winCount: number;
    }>
  > {
    const client = await this.pgPool.connect();

    try {
      const result = await client.query(
        `SELECT
          winner_strategy_id,
          winner_strategy_name,
          COUNT(*) as win_count,
          SUM(CASE WHEN winner THEN 1 ELSE 0 END)::float / COUNT(*) as win_rate,
          AVG(winner_quality)::float as avg_quality,
          AVG(winner_latency)::float as avg_latency,
          AVG(winner_cost)::float as avg_cost
        FROM strategy_executions
        WHERE analysis_type = $1
        AND timestamp > NOW() - INTERVAL '${days} days'
        GROUP BY winner_strategy_id, winner_strategy_name
        ORDER BY win_rate DESC`,
        [analysisType],
      );

      return result.rows.map((row) => ({
        strategyId: row.winner_strategy_id,
        strategyName: row.winner_strategy_name,
        winRate: row.win_rate || 0,
        avgQuality: row.avg_quality || 0,
        avgLatency: row.avg_latency || 0,
        avgCost: row.avg_cost || 0,
        winCount: parseInt(row.win_count || '0'),
      }));
    } finally {
      client.release();
    }
  }

  /**
   * Obter estatísticas de comparação
   */
  async getComparisonStats(analysisType: AnalysisType): Promise<{
    totalComparisons: number;
    avgWinnerQuality: number;
    costSavingsByUsingWinner: number;
    strategyDiversity: number; // quantas estratégias vencem
  }> {
    const winRates = await this.getStrategyWinRate(analysisType, 30);

    const client = await this.pgPool.connect();

    try {
      const result = await client.query(
        `SELECT
          COUNT(*) as total_comparisons,
          AVG(winner_quality)::float as avg_winner_quality,
          AVG(COALESCE(alternative_cost - winner_cost, 0))::float as avg_saving
        FROM strategy_executions
        WHERE analysis_type = $1
        AND timestamp > NOW() - INTERVAL '30 days'`,
        [analysisType],
      );

      if (result.rows.length === 0) {
        return {
          totalComparisons: 0,
          avgWinnerQuality: 0,
          costSavingsByUsingWinner: 0,
          strategyDiversity: 0,
        };
      }

      const row = result.rows[0];

      return {
        totalComparisons: parseInt(row.total_comparisons || '0'),
        avgWinnerQuality: row.avg_winner_quality || 0,
        costSavingsByUsingWinner: row.avg_saving || 0,
        strategyDiversity: Math.min(winRates.length, this.strategies.length),
      };
    } finally {
      client.release();
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // Private methods
  // ═══════════════════════════════════════════════════════════════════

  private _selectStrategies(
    analysisType: AnalysisType,
    criticality: string,
    maxCount: number,
  ): ExecutionStrategy[] {
    // Estratégia seleção baseado no tipo e criticality
    if (criticality === 'CRITICAL') {
      // Para crítico: sempre usar preciso + expanded
      return [this.strategies[1], this.strategies[2]]; // precise + expanded
    }

    if (criticality === 'HIGH') {
      // Para alto: preciso + contexto expandido
      return [this.strategies[1], this.strategies[2]];
    }

    // Para normal/low: fast + preciso (comparar)
    return [this.strategies[0], this.strategies[1]].slice(0, maxCount);
  }

  private async _executeStrategy(
    strategy: ExecutionStrategy,
    context: Record<string, any>,
    analysisType: AnalysisType,
  ): Promise<StrategyResult> {
    // Mock: Em produção, isso seria real executor
    const startTime = Date.now();

    // Simular execução
    await new Promise((resolve) => setTimeout(resolve, strategy.expectedLatency * 0.8));

    const executionTime = Date.now() - startTime;

    // Mock decision
    const mockQuality = strategy.expectedQuality + (Math.random() - 0.5) * 0.1;
    const mockCost = strategy.expectedCost * (0.8 + Math.random() * 0.4);

    const decision: DecisionOutput = {
      decision: {
        recommendation: `Using strategy: ${strategy.name}`,
        reasoning: `Executed via ${strategy.name} with expected quality ${strategy.expectedQuality.toFixed(2)}`,
        actions: [],
      },
      metrics: {
        quality_score: mockQuality,
        actionability_score: 0.8,
        consistency_score: 0.8,
        confidence_score: 0.85,
      },
      metadata: {
        analysisId: `multi-${strategy.id}-${Date.now()}`,
        type: analysisType as any,
        criticality: 'HIGH',
        model_used: strategy.config.model || 'ensemble',
        execution_time_ms: executionTime,
        context_tokens_used: strategy.config.context_size || 1500,
        cached: false,
        evaluation_count: 0,
      },
      tracing: {
        request_id: `trace-${strategy.id}`,
        agent_chain: [strategy.name],
        memory_hits: [],
        model_routing_rationale: `Selected ${strategy.name}`,
        timestamp: new Date(),
      },
      feedback_eligible: true,
    };

    const compositeScore = this._calculateCompositeScore(mockQuality, executionTime, mockCost);

    return {
      strategy,
      decision,
      executionTime,
      actualCost: mockCost,
      compositeScore,
    };
  }

  private _calculateCompositeScore(quality: number, latency: number, cost: number): number {
    // Normalizar
    const qualityScore = quality;
    const latencyScore = Math.max(0, 1 - latency / 5000); // 5s = 0
    const costScore = Math.max(0, 1 - cost / 0.05); // $0.05 = 0

    // Pesos
    return qualityScore * 0.5 + latencyScore * 0.2 + costScore * 0.3;
  }

  private _rankResults(
    results: StrategyResult[],
  ): Array<{
    rank: number;
    strategy: ExecutionStrategy;
    score: number;
    reason: string;
  }> {
    const ranked = results
      .map((r) => ({
        rank: 0,
        strategy: r.strategy,
        score: r.compositeScore,
        reason: `Quality: ${r.decision.metrics.quality_score.toFixed(2)}, Latency: ${r.executionTime}ms, Cost: $${r.actualCost.toFixed(4)}`,
      }))
      .sort((a, b) => b.score - a.score)
      .map((r, i) => ({ ...r, rank: i + 1 }));

    return ranked;
  }

  private _generateRecommendation(ranking: any[], criticality: string): string {
    const winner = ranking[0];
    const runner = ranking.length > 1 ? ranking[1] : null;

    const delta = runner ? ((winner.score - runner.score) / runner.score) * 100 : 0;

    if (delta < 5) {
      return `✓ Winner: ${winner.strategy.name} (marginal advantage +${delta.toFixed(1)}% - consider runner-up)`;
    }

    if (criticality === 'CRITICAL' && winner.score < 0.7) {
      return `⚠️ Winner: ${winner.strategy.name} (low score - recommend ensemble or reexecution)`;
    }

    return `✓ Winner: ${winner.strategy.name} (+${delta.toFixed(1)}% advantage)`;
  }

  private async _recordComparison(analysisType: AnalysisType, comparison: StrategyComparison): Promise<void> {
    try {
      const client = await this.pgPool.connect();

      try {
        await client.query(
          `INSERT INTO strategy_comparisons
          (analysis_type, winner_strategy_id, winner_strategy_name, winner_quality,
           winner_latency, winner_cost, all_results, timestamp)
          VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
          [
            analysisType,
            comparison.winnerStrategy.id,
            comparison.winnerStrategy.name,
            comparison.winner.decision.metrics.quality_score,
            comparison.winner.executionTime,
            comparison.winner.actualCost,
            JSON.stringify(comparison.runners.map((r) => ({ strategy: r.strategy.name, score: r.compositeScore }))),
          ],
        );
      } finally {
        client.release();
      }
    } catch (error) {
      this.logger.warn('Failed to record strategy comparison', {
        error: error instanceof Error ? error.message : 'unknown',
      });
    }
  }
}
