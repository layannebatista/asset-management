import { Router, Request, Response, NextFunction } from 'express';
import { Logger } from 'winston';
import { Pool } from 'pg';

/**
 * Rotas de Insights Reais
 * Métricas que geram valor: economia de tokens, ROI, eficiência de modelos
 */
export function createInsightsRouter(pgPool: Pool, logger: Logger): Router {
  const router = Router();

  /**
   * GET /api/v1/insights/token-economy
   * Economía de tokens com RTK vs sem RTK
   */
  router.get('/token-economy', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const client = await pgPool.connect();

      try {
        const result = await client.query(`
          SELECT
            COUNT(*) as total_analyses,
            SUM(raw_tokens) as tokens_without_rtk,
            SUM(final_tokens) as tokens_with_rtk,
            SUM(raw_tokens) - SUM(final_tokens) as total_tokens_saved,
            ROUND(100 * (1 - SUM(final_tokens)::float / NULLIF(SUM(raw_tokens), 0)), 2) as savings_percentage,
            ROUND(SUM(raw_tokens) * 0.0005, 2) as cost_without_optimization,
            ROUND(SUM(final_tokens) * 0.0005, 2) as cost_with_optimization,
            ROUND((SUM(raw_tokens) - SUM(final_tokens)) * 0.0005, 2) as usd_saved,
            AVG(total_reduction_pct) as avg_reduction_pct,
            AVG(context_accuracy_pct) as avg_accuracy
          FROM token_savings_log
          WHERE timestamp >= NOW() - INTERVAL '${days} days'
        `);

        const data = result.rows[0];

        res.json({
          period: { days, startDate: new Date(Date.now() - days * 24 * 60 * 60 * 1000), endDate: new Date() },
          tokenEconomy: {
            totalAnalyses: parseInt(data.total_analyses),
            tokensWithoutRTK: parseInt(data.tokens_without_rtk) || 0,
            tokensWithRTK: parseInt(data.tokens_with_rtk) || 0,
            totalTokensSaved: parseInt(data.total_tokens_saved) || 0,
            savingsPercentage: parseFloat(data.savings_percentage) || 0,
          },
          financialImpact: {
            costWithoutOptimization: parseFloat(data.cost_without_optimization) || 0,
            costWithOptimization: parseFloat(data.cost_with_optimization) || 0,
            usdSaved: parseFloat(data.usd_saved) || 0,
          },
          quality: {
            avgReductionPercentage: parseFloat(data.avg_reduction_pct) || 0,
            avgContextAccuracy: parseFloat(data.avg_accuracy) || 0,
          },
        });
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error('Token economy request failed', { error });
      res.status(500).json({ error: 'Failed to fetch token economy' });
    }
  });

  /**
   * GET /api/v1/insights/model-efficiency
   * Qual modelo é mais eficiente (tokens vs qualidade)
   */
  router.get('/model-efficiency', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const client = await pgPool.connect();

      try {
        const result = await client.query(`
          SELECT
            model,
            COUNT(*) as executions,
            ROUND(AVG(raw_tokens), 0) as avg_input_tokens,
            ROUND(AVG(final_tokens), 0) as avg_final_tokens,
            ROUND(AVG(total_reduction_pct), 2) as avg_reduction_pct,
            ROUND(AVG(context_accuracy_pct), 2) as avg_accuracy,
            ROUND(AVG(final_tokens) * 0.0005, 4) as cost_per_analysis,
            ROUND(AVG(final_tokens) * 0.0005 * COUNT(*), 2) as total_cost,
            ROUND(100 * AVG(context_accuracy_pct) / NULLIF(ROUND(AVG(final_tokens) * 0.0005, 4), 0), 2) as efficiency_ratio
          FROM token_savings_log
          WHERE timestamp >= NOW() - INTERVAL '${days} days'
          GROUP BY model
          ORDER BY efficiency_ratio DESC
        `);

        const models = result.rows.map(row => ({
          model: row.model,
          executions: parseInt(row.executions),
          avgInputTokens: parseInt(row.avg_input_tokens),
          avgFinalTokens: parseInt(row.avg_final_tokens),
          avgReductionPercentage: parseFloat(row.avg_reduction_pct),
          avgAccuracy: parseFloat(row.avg_accuracy),
          costPerAnalysis: parseFloat(row.cost_per_analysis),
          totalCost: parseFloat(row.total_cost),
          efficiencyRatio: parseFloat(row.efficiency_ratio),
          recommendation: parseFloat(row.efficiency_ratio) > 85 ? 'RECOMENDADO' : 'REVISAR',
        }));

        res.json({
          period: { days },
          models,
          bestModel: models[0]?.model,
          recommendation: `Use ${models[0]?.model} para melhor custo-benefício`,
        });
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error('Model efficiency request failed', { error });
      res.status(500).json({ error: 'Failed to fetch model efficiency' });
    }
  });

  /**
   * GET /api/v1/insights/analysis-roi
   * ROI por tipo de análise
   */
  router.get('/analysis-roi', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const client = await pgPool.connect();

      try {
        const result = await client.query(`
          SELECT
            analysis_type,
            COUNT(*) as executions,
            ROUND(AVG(total_reduction_pct), 2) as avg_efficiency,
            ROUND(AVG(context_accuracy_pct), 2) as avg_accuracy,
            ROUND(SUM(raw_tokens - final_tokens) * 0.0005, 2) as total_usd_saved,
            ROUND(AVG(raw_tokens - final_tokens) * 0.0005, 4) as avg_usd_saved_per_analysis,
            ROUND(100 * AVG(total_reduction_pct), 2) as roi_percentage
          FROM token_savings_log
          WHERE timestamp >= NOW() - INTERVAL '${days} days'
          GROUP BY analysis_type
          ORDER BY roi_percentage DESC
        `);

        const analyses = result.rows.map(row => ({
          type: row.analysis_type,
          executions: parseInt(row.executions),
          avgEfficiency: parseFloat(row.avg_efficiency),
          avgAccuracy: parseFloat(row.avg_accuracy),
          totalUsdSaved: parseFloat(row.total_usd_saved),
          avgUsdSavedPerAnalysis: parseFloat(row.avg_usd_saved_per_analysis),
          roiPercentage: parseFloat(row.roi_percentage),
          recommendation: parseFloat(row.roi_percentage) > 50 ? 'ALTA PRIORIDADE' : 'OTIMIZAR',
        }));

        res.json({
          period: { days },
          analyses,
          topROI: analyses[0],
          totalUsdSaved: analyses.reduce((sum, a) => sum + a.totalUsdSaved, 0),
        });
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error('Analysis ROI request failed', { error });
      res.status(500).json({ error: 'Failed to fetch analysis ROI' });
    }
  });

  /**
   * GET /api/v1/insights/executive-summary
   * Resumo executivo: o que realmente importa
   */
  router.get('/executive-summary', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const client = await pgPool.connect();

      try {
        const tokenResult = await client.query(`
          SELECT
            COUNT(*) as total_analyses,
            SUM(raw_tokens) - SUM(final_tokens) as total_tokens_saved,
            ROUND((SUM(raw_tokens) - SUM(final_tokens)) * 0.0005, 2) as usd_saved,
            ROUND(100 * (1 - SUM(final_tokens)::float / NULLIF(SUM(raw_tokens), 0)), 2) as savings_pct,
            AVG(context_accuracy_pct) as avg_accuracy
          FROM token_savings_log
          WHERE timestamp >= NOW() - INTERVAL '${days} days'
        `);

        const data = tokenResult.rows[0];

        res.json({
          summary: {
            period: `Últimos ${days} dias`,
            totalAnalysesExecuted: parseInt(data.total_analyses) || 0,
            metrics: {
              tokensSaved: parseInt(data.total_tokens_saved) || 0,
              usdSaved: parseFloat(data.usd_saved) || 0,
              savingsPercentage: parseFloat(data.savings_pct) || 0,
              qualityScore: parseFloat(data.avg_accuracy) || 0,
            },
            keyInsights: [
              `RTK economizou ${parseFloat(data.usd_saved) || 0} USD`,
              `Redução de ${parseFloat(data.savings_pct) || 0}% em tokens`,
              `${parseInt(data.total_analyses) || 0} análises executadas com sucesso`,
              `Qualidade mantida em ${parseFloat(data.avg_accuracy) || 0}%`,
            ],
            recommendation: parseFloat(data.savings_pct) > 60
              ? '✅ RTK está gerando excelente valor - manter em produção'
              : '⚠️ Revisar configurações de RTK',
          },
        });
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error('Executive summary request failed', { error });
      res.status(500).json({ error: 'Failed to fetch executive summary' });
    }
  });

  /**
   * GET /api/v1/insights/history
   * Histórico de economia ao longo do tempo
   */
  router.get('/history', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const months = parseInt(req.query.months as string) || 3;
      const client = await pgPool.connect();

      try {
        const result = await client.query(`
          SELECT
            DATE_TRUNC('week', timestamp) as week,
            COUNT(*) as total_analyses,
            SUM(raw_tokens) as tokens_without_rtk,
            SUM(final_tokens) as tokens_with_rtk,
            ROUND(100 * (1 - SUM(final_tokens)::float / NULLIF(SUM(raw_tokens), 0)), 2) as savings_percentage,
            ROUND((SUM(raw_tokens) - SUM(final_tokens)) * 0.0005, 2) as usd_saved,
            AVG(context_accuracy_pct) as avg_accuracy
          FROM token_savings_log
          WHERE timestamp >= NOW() - INTERVAL '${months} months'
          GROUP BY DATE_TRUNC('week', timestamp)
          ORDER BY week DESC
        `);

        const history = result.rows.map(row => ({
          week: row.week,
          totalAnalyses: parseInt(row.total_analyses),
          tokensWithoutRtk: parseInt(row.tokens_without_rtk) || 0,
          tokensWithRtk: parseInt(row.tokens_with_rtk) || 0,
          savingsPercentage: parseFloat(row.savings_percentage) || 0,
          usdSaved: parseFloat(row.usd_saved) || 0,
          avgAccuracy: parseFloat(row.avg_accuracy) || 0,
        }));

        res.json({
          period: { months, startDate: new Date(Date.now() - months * 30 * 24 * 60 * 60 * 1000), endDate: new Date() },
          history: history,
          trend: history.length > 1 ? {
            savingsIncreasing: history[0].savingsPercentage > history[1].savingsPercentage,
            accuracyTrend: history[0].avgAccuracy > history[1].avgAccuracy ? 'improving' : 'declining'
          } : null
        });
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error('History request failed', { error });
      res.status(500).json({ error: 'Failed to fetch history' });
    }
  });

  return router;
}
