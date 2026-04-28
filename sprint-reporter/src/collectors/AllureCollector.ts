import * as fs from 'fs';
import * as path from 'path';
import { Logger } from 'winston';
import { ICollector, CollectionResult } from './ICollector';
import { AllureData } from '../types/report.types';

/**
 * AllureCollector: Lê resultados de testes do diretório allure-results/
 * Suporta testes Backend (JUnit) e E2E (Playwright)
 */
export class AllureCollector implements ICollector {
  private readonly allureResultsPath: string;
  private readonly logger: Logger;

  constructor(allureResultsPath: string, logger: Logger) {
    this.allureResultsPath = allureResultsPath;
    this.logger = logger;
  }

  async collect(startDate: Date, endDate: Date): Promise<CollectionResult> {
    const start = Date.now();

    try {
      if (!this.fileExists(this.allureResultsPath)) {
        this.logger.warn(`Allure results path not found: ${this.allureResultsPath}`);
        return {
          source: 'Allure',
          success: false,
          error: 'Allure results directory not found',
          itemsCollected: 0,
          duration: Date.now() - start,
        };
      }

      const resultFiles = this.getResultFiles();
      this.logger.debug(`Found ${resultFiles.length} Allure result files`);

      const tests = this.parseTestResults(resultFiles, startDate, endDate);
      const allureData = this.aggregateResults(tests);

      this.logger.info(`Allure collected ${tests.length} test results`, {
        passed: allureData.testResults.passed,
        failed: allureData.testResults.failed,
      });

      return {
        source: 'Allure',
        success: true,
        data: allureData,
        itemsCollected: tests.length,
        duration: Date.now() - start,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('AllureCollector error', { error: errorMsg });
      return {
        source: 'Allure',
        success: false,
        error: errorMsg,
        itemsCollected: 0,
        duration: Date.now() - start,
      };
    }
  }

  getName(): string {
    return 'AllureCollector';
  }

  async validate(): Promise<boolean> {
    return this.fileExists(this.allureResultsPath);
  }

  // ─── Private Methods ──────────────────────────────────────────────────────

  private fileExists(filePath: string): boolean {
    try {
      return fs.existsSync(filePath);
    } catch {
      return false;
    }
  }

  private getResultFiles(): string[] {
    try {
      const files = fs.readdirSync(this.allureResultsPath);
      return files
        .filter((f) => f.endsWith('-result.json'))
        .map((f) => path.join(this.allureResultsPath, f));
    } catch (error) {
      this.logger.error('Error reading Allure results directory', { error });
      return [];
    }
  }

  private parseTestResults(files: string[], startDate: Date, endDate: Date): any[] {
    const results: any[] = [];

    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf-8');
        const json = JSON.parse(content);

        // Filtrar por data
        if (json.start >= startDate.getTime() && json.start <= endDate.getTime()) {
          results.push(json);
        }
      } catch (error) {
        this.logger.debug(`Error parsing ${path.basename(file)}`);
      }
    }

    return results;
  }

  private aggregateResults(tests: any[]): AllureData {
    const statuses = tests.map((t) => String(t.status || '').toLowerCase());
    const testResults = {
      total: tests.length,
      passed: statuses.filter((s) => s === 'passed').length,
      failed: statuses.filter((s) => s === 'failed' || s === 'broken').length,
      skipped: statuses.filter((s) => s === 'skipped' || s === 'unknown').length,
    };

    // Detectar testes instáveis (mesma história com múltiplas tentativas)
    const historyMap = new Map<string, any[]>();
    for (const test of tests) {
      const key = test.historyId || test.testCaseId;
      if (!historyMap.has(key)) {
        historyMap.set(key, []);
      }
      historyMap.get(key)!.push(test);
    }

    // Um teste é flaky se tem múltiplas execuções com diferentes resultados
    let flakyCount = 0;
    for (const executions of historyMap.values()) {
      if (executions.length > 1) {
        const statuses = new Set(executions.map((e) => e.status));
        if (statuses.size > 1) {
          flakyCount++;
        }
      }
    }

    const byTypeAccumulator = {
      unit: { total: 0, passed: 0, failed: 0, passRate: 0 },
      integration: { total: 0, passed: 0, failed: 0, passRate: 0 },
      e2e: { total: 0, passed: 0, failed: 0, passRate: 0 },
      performance: { total: 0, passed: 0, failed: 0, passRate: 0 },
    };

    const byStatus = {
      passed: [] as string[],
      failed: [] as string[],
      flaky: [] as string[],
    };

    const flakyIds = new Set<string>();
    for (const [key, executions] of historyMap.entries()) {
      if (executions.length <= 1) {
        continue;
      }

      const executionStatuses = new Set(executions.map((e) => e.status));
      if (executionStatuses.size > 1) {
        flakyIds.add(key);
      }
    }

    for (const test of tests) {
      const status = String(test.status || '').toLowerCase();
      const name = String(test.name || test.fullName || test.testCaseName || 'teste sem nome');
      const testType = this.detectTestType(test);
      const bucket = byTypeAccumulator[testType];

      bucket.total += 1;
      if (status === 'passed') {
        bucket.passed += 1;
        byStatus.passed.push(name);
      } else if (status === 'failed' || status === 'broken') {
        bucket.failed += 1;
        byStatus.failed.push(name);
      }

      const historyKey = test.historyId || test.testCaseId;
      if (historyKey && flakyIds.has(historyKey)) {
        byStatus.flaky.push(name);
      }
    }

    for (const key of Object.keys(byTypeAccumulator) as Array<keyof typeof byTypeAccumulator>) {
      const bucket = byTypeAccumulator[key];
      bucket.passRate = bucket.total > 0 ? (bucket.passed / bucket.total) * 100 : 0;
    }

    return {
      tests,
      testResults: {
        ...testResults,
        flaky: flakyCount,
      } as any,
      byType: byTypeAccumulator,
      byStatus,
    };
  }

  private detectTestType(test: any): 'unit' | 'integration' | 'e2e' | 'performance' {
    const labels = Array.isArray(test.labels) ? test.labels : [];
    const labelValues = labels
      .map((l: any) => `${String(l?.name || '')}:${String(l?.value || '')}`.toLowerCase())
      .join(' ');
    const text = `${String(test.name || '')} ${String(test.fullName || '')} ${labelValues}`.toLowerCase();

    if (text.includes('k6') || text.includes('performance') || text.includes('load')) {
      return 'performance';
    }

    if (text.includes('playwright') || text.includes('frontend') || text.includes('e2e') || text.includes('bdd')) {
      return 'e2e';
    }

    if (text.includes('integration') || text.includes('backend') || text.includes('cucumber')) {
      return 'integration';
    }

    return 'unit';
  }
}
