import { Logger } from 'winston';
import { ICollector } from '../collectors/ICollector';
import { CollectedData, SprintPeriod } from '../types/report.types';

/**
 * DataAggregator: Orquestra a coleta de dados de múltiplos collectors
 * e agrega tudo em um modelo unificado
 */
export class DataAggregator {
  private readonly collectors: ICollector[];
  private readonly logger: Logger;

  constructor(collectors: ICollector[], logger: Logger) {
    this.collectors = collectors;
    this.logger = logger;
  }

  async aggregate(period: SprintPeriod): Promise<CollectedData> {
    this.logger.info(`Aggregating data from ${this.period.count} collectors`, {
      startDate: period.startDate,
      endDate: period.endDate,
    });

    const results = await Promise.allSettled(
      this.collectors.map((c) => c.collect(period.startDate, period.endDate)),
    );

    const aggregated: any = {
      allure: null,
      github: null,
      postgres: null,
      aiapi: null,
      rtkapi: null,
      k6: null,
    };

    for (const result of results) {
      if (result.status === 'fulfilled') {
        const { source, success, data } = result.value;

        if (success && data) {
          const key = source.toLowerCase();
          aggregated[key] = data;

          this.logger.info(`${source} data aggregated successfully`);
        } else {
          this.logger.warn(`${source} collection failed:`, {
            error: result.value.error,
          });
        }
      } else {
        this.logger.error('Collector promise rejected', {
          reason: result.reason,
        });
      }
    }

    return aggregated as CollectedData;
  }

  /**
   * Valida se todos os collectors conseguem acessar suas fontes
   */
  async validateAll(): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>();

    for (const collector of this.collectors) {
      try {
        const isValid = await collector.validate();
        results.set(collector.getName(), isValid);

        if (!isValid) {
          this.logger.warn(`${collector.getName()} validation failed`);
        }
      } catch (error) {
        results.set(collector.getName(), false);
        this.logger.error(`${collector.getName()} validation error`, { error });
      }
    }

    return results;
  }

  private get period(): { count: number } {
    return { count: this.collectors.length };
  }
}
