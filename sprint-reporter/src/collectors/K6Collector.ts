import * as fs from 'fs';
import { Logger } from 'winston';
import { ICollector, CollectionResult } from './ICollector';

/**
 * K6Collector: Lê o arquivo de summary export gerado pelo K6
 * Gerado via: k6 run --summary-export=./k6/k6-summary.json k6/test.js
 */
export class K6Collector implements ICollector {
  private readonly summaryFilePath: string;
  private readonly logger: Logger;

  constructor(summaryFilePath: string, logger: Logger) {
    this.summaryFilePath = summaryFilePath;
    this.logger = logger;
  }

  async collect(_startDate: Date, _endDate: Date): Promise<CollectionResult> {
    const start = Date.now();

    try {
      if (!fs.existsSync(this.summaryFilePath)) {
        this.logger.warn(`K6 summary file not found: ${this.summaryFilePath}`);
        return {
          source: 'K6',
          success: false,
          error: 'Arquivo k6-summary.json não encontrado. Execute: k6 run --summary-export=./k6/k6-summary.json k6/test.js',
          itemsCollected: 0,
          duration: Date.now() - start,
        };
      }

      const raw = fs.readFileSync(this.summaryFilePath, 'utf-8');
      const summary = JSON.parse(raw);
      const metrics = summary.metrics || {};

      const data = this.parseMetrics(metrics);

      this.logger.info('K6 data collected', {
        totalRequests: data.summary.totalRequests,
        errorRate: data.summary.errorRate,
      });

      return {
        source: 'K6',
        success: true,
        data,
        itemsCollected: data.summary.totalRequests,
        duration: Date.now() - start,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('K6Collector error', { error: errorMsg });
      return {
        source: 'K6',
        success: false,
        error: errorMsg,
        itemsCollected: 0,
        duration: Date.now() - start,
      };
    }
  }

  getName(): string {
    return 'K6Collector';
  }

  async validate(): Promise<boolean> {
    return fs.existsSync(this.summaryFilePath);
  }

  // ─── Parsing ──────────────────────────────────────────────────────────────

  private parseMetrics(metrics: any) {
    const reqDuration = metrics['http_req_duration']?.values || {};
    const reqFailed   = metrics['http_req_failed']?.values   || {};
    const httpReqs    = metrics['http_reqs']?.values          || {};
    const dataRx      = metrics['data_received']?.values      || {};
    const dataTx      = metrics['data_sent']?.values          || {};
    const checks      = metrics['checks']?.values             || {};
    const iterations  = metrics['iterations']?.values         || {};
    const vusMax      = metrics['vus_max']?.values            || {};

    // Custom metrics from k6/test.js
    const loginDur    = metrics['login_duration']?.values     || {};
    const assetsDur   = metrics['assets_duration']?.values    || {};
    const maintDur    = metrics['maintenance_duration']?.values || {};

    const totalRequests = Math.round(httpReqs.count || 0);
    const errorRate     = reqFailed.rate || 0;
    const failedRequests = Math.round(totalRequests * errorRate);
    const successfulRequests = totalRequests - failedRequests;

    return {
      metrics: {
        http_req_duration: {
          avg:  reqDuration.avg  || 0,
          min:  reqDuration.min  || 0,
          max:  reqDuration.max  || 0,
          med:  reqDuration.med  || 0,
          p90:  reqDuration['p(90)'] || 0,
          p95:  reqDuration['p(95)'] || 0,
          p99:  reqDuration['p(99)'] || 0,
        },
        http_reqs: {
          count: totalRequests,
          rate:  httpReqs.rate || 0,
        },
        http_req_failed: {
          rate:   errorRate,
          passes: successfulRequests,
          fails:  failedRequests,
        },
        checks: {
          rate:   checks.rate   || 0,
          passes: checks.passes || 0,
          fails:  checks.fails  || 0,
        },
        iterations: {
          count: Math.round(iterations.count || 0),
          rate:  iterations.rate || 0,
        },
        data_received: {
          count: dataRx.count || 0,
          rate:  dataRx.rate  || 0,
        },
        data_sent: {
          count: dataTx.count || 0,
          rate:  dataTx.rate  || 0,
        },
        vus_max: vusMax.max || 0,
        // Cenários customizados
        login_duration:       { avg: loginDur.avg || 0, p95: loginDur['p(95)'] || 0 },
        assets_duration:      { avg: assetsDur.avg || 0, p95: assetsDur['p(95)'] || 0 },
        maintenance_duration: { avg: maintDur.avg || 0, p95: maintDur['p(95)'] || 0 },
      },
      summary: {
        totalRequests,
        successfulRequests,
        failedRequests,
        errorRate,
        rps: httpReqs.rate || 0,
        checksPassRate: checks.rate || 0,
        latency: {
          min: reqDuration.min  || 0,
          max: reqDuration.max  || 0,
          avg: reqDuration.avg  || 0,
          med: reqDuration.med  || 0,
          p90: reqDuration['p(90)'] || 0,
          p95: reqDuration['p(95)'] || 0,
          p99: reqDuration['p(99)'] || 0,
        },
        dataReceived: dataRx.count || 0,
        dataSent:     dataTx.count || 0,
        maxVUs:       vusMax.max || 0,
      },
    };
  }
}
