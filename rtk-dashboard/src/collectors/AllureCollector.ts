import axios from 'axios';
import { config } from '../config';
import { logger } from '../api/logger';
import { AllureTestResult, AllureSummary } from '../types/metrics.types';

/**
 * Pulls test results from the Allure Docker Service API.
 * Endpoint docs: http://allure:5050/allure-docker-service
 */
export class AllureCollector {
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = `${config.services.allureUrl}/allure-docker-service`;
  }

  async collectResults(projectId = 'default'): Promise<AllureTestResult[]> {
    logger.info('Collecting Allure test results', { projectId });

    try {
      const response = await axios.get<{ data: { results: AllureTestResult[] } }>(
        `${this.baseUrl}/results`,
        { params: { project_id: projectId }, timeout: 15000 },
      );
      return response.data?.data?.results ?? [];
    } catch (error) {
      logger.warn('Failed to fetch Allure results, using empty dataset', { error });
      return [];
    }
  }

  async collectSummary(projectId = 'default'): Promise<AllureSummary | null> {
    try {
      const response = await axios.get<{ data: AllureSummary }>(
        `${this.baseUrl}/report/summary`,
        { params: { project_id: projectId }, timeout: 10000 },
      );
      return response.data?.data ?? null;
    } catch (error) {
      logger.warn('Failed to fetch Allure summary', { error });
      return null;
    }
  }

  /**
   * Detects flaky tests by comparing the last N result sets.
   * A test is flaky if it has both passed and failed in recent runs.
   */
  async detectFlakyTests(projectId = 'default'): Promise<string[]> {
    try {
      const response = await axios.get<{ data: { results: AllureTestResult[] }[] }>(
        `${this.baseUrl}/reports`,
        { params: { project_id: projectId }, timeout: 15000 },
      );

      const reports = response.data?.data ?? [];
      const testHistory: Record<string, Set<string>> = {};

      for (const report of reports.slice(0, 10)) {
        for (const result of report.results ?? []) {
          testHistory[result.fullName] = testHistory[result.fullName] ?? new Set();
          testHistory[result.fullName].add(result.status);
        }
      }

      return Object.entries(testHistory)
        .filter(([, statuses]) => statuses.has('passed') && (statuses.has('failed') || statuses.has('broken')))
        .map(([name]) => name);
    } catch {
      return [];
    }
  }
}
