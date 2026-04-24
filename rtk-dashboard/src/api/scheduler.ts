import { AIOrchestrator } from '../orchestrator/AIOrchestrator';
import { Logger } from 'winston';

export class AnalysisScheduler {
  private intervalHandle: NodeJS.Timeout | null = null;

  constructor(
    private readonly orchestrator: AIOrchestrator,
    private readonly logger: Logger,
    private readonly intervalMinutes: number = 60,
  ) {}

  start(): void {
    if (this.intervalHandle) {
      this.logger.warn('AnalysisScheduler already running');
      return;
    }

    this.logger.info('AnalysisScheduler starting', { intervalMinutes: this.intervalMinutes });
    this.runAnalyses();
    this.intervalHandle = setInterval(() => {
      this.runAnalyses();
    }, this.intervalMinutes * 60 * 1000);
  }

  stop(): void {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
      this.logger.info('AnalysisScheduler stopped');
    }
  }

  private async runAnalyses(): Promise<void> {
    try {
      this.logger.info('Scheduled analysis run started');

      const results = await Promise.all([
        this.orchestrator.analyze({ type: 'observability', windowMinutes: 30 }),
        this.orchestrator.analyze({ type: 'test-intelligence', projectId: 'default' }),
        this.orchestrator.analyze({ type: 'cicd', lookbackDays: 7 }),
        this.orchestrator.analyze({ type: 'incident', logs: [] }),
        this.orchestrator.analyze({ type: 'risk' }),
      ]);

      this.logger.info('Scheduled analysis run completed', {
        count: results.length,
        types: results.map((r) => r.metadata.type),
      });
    } catch (error) {
      this.logger.error('Scheduled analysis run failed', {
        error: error instanceof Error ? error.message : 'unknown',
      });
    }
  }
}
