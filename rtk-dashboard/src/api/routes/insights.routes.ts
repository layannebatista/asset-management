import { Router, Request, Response } from 'express';
import { Logger } from 'winston';
import {
  ObservedAgentModel,
  RtkCommandRecord,
  RtkLocalDataSource,
  RtkParseFailureRecord,
} from '../../observability/RtkLocalDataSource';

function asPositiveInt(value: unknown, fallback: number): number {
  const parsed = parseInt(String(value ?? fallback), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 100) / 100;
}

function estimateUsd(tokens: number): number {
  return Math.round(tokens * 0.0005 * 100) / 100;
}

function getCommandGroup(command: RtkCommandRecord): string {
  const source = command.rtkCmd?.trim() || command.originalCmd?.trim();
  if (!source) return 'unknown';

  const parts = source.split(/\s+/);
  if (parts[0] === 'rtk' && parts[1]) return parts[1];
  return parts[0];
}

function buildCommandBreakdown(commands: RtkCommandRecord[]) {
  const groups = new Map<string, RtkCommandRecord[]>();

  for (const command of commands) {
    const group = getCommandGroup(command);
    const rows = groups.get(group) ?? [];
    rows.push(command);
    groups.set(group, rows);
  }

  return Array.from(groups.entries())
    .map(([group, rows]) => {
      const executions = rows.length;
      const totalSavedTokens = rows.reduce((sum, row) => sum + row.savedTokens, 0);
      const totalInputTokens = rows.reduce((sum, row) => sum + row.inputTokens, 0);

      return {
        type: group,
        executions,
        avgEfficiency: average(rows.map((row) => row.savingsPct)),
        avgLatencyMs: average(rows.map((row) => row.execTimeMs)),
        avgInputTokens: average(rows.map((row) => row.inputTokens)),
        avgOutputTokens: average(rows.map((row) => row.outputTokens)),
        totalUsdSaved: estimateUsd(totalSavedTokens),
        avgUsdSavedPerAnalysis: executions > 0
          ? Math.round((estimateUsd(totalSavedTokens) / executions) * 10000) / 10000
          : 0,
        roiPercentage: totalInputTokens > 0
          ? Math.round((totalSavedTokens / totalInputTokens) * 10000) / 100
          : 0,
        recommendation: executions > 0 ? 'USAR' : 'SEM DADOS',
      };
    })
    .sort((a, b) => b.totalUsdSaved - a.totalUsdSaved || b.executions - a.executions);
}

function buildModelBreakdown(models: ObservedAgentModel[]) {
  return models.map((model) => ({
    agent: model.agent,
    provider: model.provider,
    model: model.model,
    assistantMessages: model.assistantMessages,
    sessions: model.sessions,
    lastSeen: model.lastSeen,
    entrypoints: model.entrypoints,
    source: model.source,
  }));
}

function buildFailureSummary(failures: RtkParseFailureRecord[]) {
  return {
    totalFailures: failures.length,
    recoveredFailures: failures.filter((failure) => failure.fallbackSucceeded).length,
    unresolvedFailures: failures.filter((failure) => !failure.fallbackSucceeded).length,
    recentFailures: failures.slice(0, 15),
  };
}

export function createInsightsRouter(rtkDataSource: RtkLocalDataSource, logger: Logger): Router {
  const router = Router();

  router.get('/token-economy', (req: Request, res: Response) => {
    try {
      const days = asPositiveInt(req.query.days, 30);
      const snapshot = rtkDataSource.getSnapshot(days);
      const commands = snapshot.commands;
      const tokensWithoutRTK = commands.reduce((sum, row) => sum + row.inputTokens, 0);
      const tokensWithRTK = commands.reduce((sum, row) => sum + row.outputTokens, 0);
      const totalTokensSaved = commands.reduce((sum, row) => sum + row.savedTokens, 0);
      const savingsPercentage = tokensWithoutRTK > 0
        ? Math.round((totalTokensSaved / tokensWithoutRTK) * 10000) / 100
        : 0;

      res.json({
        period: { days, startDate: new Date(Date.now() - days * 24 * 60 * 60 * 1000), endDate: new Date() },
        source: snapshot.historyDbPath,
        tokenEconomy: {
          totalCommands: commands.length,
          tokensWithoutRTK,
          tokensWithRTK,
          totalTokensSaved,
          savingsPercentage,
          avgReductionPercentage: average(commands.map((row) => row.savingsPct)),
          avgExecTimeMs: average(commands.map((row) => row.execTimeMs)),
        },
        financialImpact: {
          estimatedCostWithoutOptimization: estimateUsd(tokensWithoutRTK),
          estimatedCostWithOptimization: estimateUsd(tokensWithRTK),
          estimatedUsdSaved: estimateUsd(totalTokensSaved),
        },
      });
    } catch (error) {
      logger.error('Token economy request failed', { error });
      res.status(500).json({ error: 'Failed to fetch token economy' });
    }
  });

  router.get('/model-efficiency', (req: Request, res: Response) => {
    try {
      const days = asPositiveInt(req.query.days, 30);
      const snapshot = rtkDataSource.getSnapshot(days);
      const models = buildModelBreakdown(snapshot.models);

      res.json({
        period: { days },
        models,
        totalModels: models.length,
      });
    } catch (error) {
      logger.error('Model observations request failed', { error });
      res.status(500).json({ error: 'Failed to fetch model observations' });
    }
  });

  router.get('/analysis-roi', (req: Request, res: Response) => {
    try {
      const days = asPositiveInt(req.query.days, 30);
      const snapshot = rtkDataSource.getSnapshot(days);
      const analyses = buildCommandBreakdown(snapshot.commands);

      res.json({
        period: { days },
        analyses,
        topROI: analyses[0] ?? null,
        totalUsdSaved: analyses.reduce((sum, analysis) => sum + analysis.totalUsdSaved, 0),
      });
    } catch (error) {
      logger.error('Command efficiency request failed', { error });
      res.status(500).json({ error: 'Failed to fetch command efficiency' });
    }
  });

  router.get('/executive-summary', (req: Request, res: Response) => {
    try {
      const days = asPositiveInt(req.query.days, 30);
      const snapshot = rtkDataSource.getSnapshot(days);
      const totalInputTokens = snapshot.commands.reduce((sum, row) => sum + row.inputTokens, 0);
      const tokensSaved = snapshot.commands.reduce((sum, row) => sum + row.savedTokens, 0);
      const failureSummary = buildFailureSummary(snapshot.failures);
      const uniqueAgents = new Set(snapshot.models.map((model) => model.agent));
      const savingsPercentage = totalInputTokens > 0
        ? Math.round((tokensSaved / totalInputTokens) * 10000) / 100
        : 0;

      res.json({
        summary: {
          period: `Ultimos ${days} dias`,
          totalCommandsTracked: snapshot.commands.length,
          metrics: {
            tokensSaved,
            estimatedUsdSaved: estimateUsd(tokensSaved),
            savingsPercentage,
            avgExecTimeMs: average(snapshot.commands.map((row) => row.execTimeMs)),
            parseFailures: failureSummary.totalFailures,
          },
          keyInsights: [
            `${snapshot.commands.length} comandos reais rastreados pelo RTK`,
            `${tokensSaved.toLocaleString('en-US')} tokens economizados`,
            `Reducao media de ${average(snapshot.commands.map((row) => row.savingsPct))}%`,
            `${failureSummary.totalFailures} falhas de parse observadas`,
            `${uniqueAgents.size} agentes observados nas fontes locais`,
          ],
          recommendation: snapshot.commands.length > 0
            ? 'Painel atualizado com historico local do RTK e sessoes reais dos agentes detectados.'
            : 'Nenhum comando RTK real foi encontrado para este projeto no periodo solicitado.',
        },
      });
    } catch (error) {
      logger.error('Executive summary request failed', { error });
      res.status(500).json({ error: 'Failed to fetch executive summary' });
    }
  });

  router.get('/history', (req: Request, res: Response) => {
    try {
      const months = asPositiveInt(req.query.months, 3);
      const snapshot = rtkDataSource.getSnapshot(months * 30);
      const weekly = new Map<string, RtkCommandRecord[]>();

      for (const command of snapshot.commands) {
        const date = new Date(command.timestamp);
        const weekStart = new Date(date);
        weekStart.setUTCDate(date.getUTCDate() - date.getUTCDay());
        weekStart.setUTCHours(0, 0, 0, 0);
        const key = weekStart.toISOString();
        const rows = weekly.get(key) ?? [];
        rows.push(command);
        weekly.set(key, rows);
      }

      const history = Array.from(weekly.entries())
        .map(([week, rows]) => {
          const tokensWithoutRtk = rows.reduce((sum, row) => sum + row.inputTokens, 0);
          const tokensWithRtk = rows.reduce((sum, row) => sum + row.outputTokens, 0);
          const tokensSaved = rows.reduce((sum, row) => sum + row.savedTokens, 0);
          return {
            week,
            totalCommands: rows.length,
            tokensWithoutRtk,
            tokensWithRtk,
            savingsPercentage: tokensWithoutRtk > 0 ? Math.round((tokensSaved / tokensWithoutRtk) * 10000) / 100 : 0,
            estimatedUsdSaved: estimateUsd(tokensSaved),
            avgExecTimeMs: average(rows.map((row) => row.execTimeMs)),
          };
        })
        .sort((a, b) => b.week.localeCompare(a.week));

      res.json({
        period: { months, startDate: new Date(Date.now() - months * 30 * 24 * 60 * 60 * 1000), endDate: new Date() },
        history,
      });
    } catch (error) {
      logger.error('History request failed', { error });
      res.status(500).json({ error: 'Failed to fetch history' });
    }
  });

  router.get('/recent-commands', (req: Request, res: Response) => {
    try {
      const days = asPositiveInt(req.query.days, 30);
      const limit = asPositiveInt(req.query.limit, 15);
      const snapshot = rtkDataSource.getSnapshot(days);
      res.json({
        period: { days },
        commands: snapshot.commands.slice(0, limit),
      });
    } catch (error) {
      logger.error('Recent commands request failed', { error });
      res.status(500).json({ error: 'Failed to fetch recent commands' });
    }
  });

  router.get('/failures', (req: Request, res: Response) => {
    try {
      const days = asPositiveInt(req.query.days, 30);
      const snapshot = rtkDataSource.getSnapshot(days);
      res.json({
        period: { days },
        ...buildFailureSummary(snapshot.failures),
      });
    } catch (error) {
      logger.error('Failure summary request failed', { error });
      res.status(500).json({ error: 'Failed to fetch failure summary' });
    }
  });

  router.get('/source-status', (_req: Request, res: Response) => {
    res.json(rtkDataSource.getStatus());
  });

  return router;
}
