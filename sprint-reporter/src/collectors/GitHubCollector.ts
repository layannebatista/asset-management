import axios, { AxiosInstance } from 'axios';
import { Logger } from 'winston';
import { ICollector, CollectionResult } from './ICollector';
import { GitHubData } from '../types/report.types';

/**
 * GitHubCollector: Coleta dados de GitHub Actions
 * - Duração dos jobs
 * - Taxa de sucesso/falha
 * - Fluxo de CI/CD
 */
export class GitHubCollector implements ICollector {
  private readonly axiosClient: AxiosInstance;
  private readonly logger: Logger;
  private readonly owner: string;
  private readonly repo: string;
  private readonly hasToken: boolean;

  constructor(token: string, owner: string, repo: string, logger: Logger) {
    this.owner = owner;
    this.repo = repo;
    this.logger = logger;
    this.hasToken = !!token && token.trim().length > 0;

    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
    };
    if (this.hasToken) {
      headers.Authorization = `Bearer ${token}`;
    }

    this.axiosClient = axios.create({
      baseURL: 'https://api.github.com',
      headers,
    });
  }

  async collect(startDate: Date, endDate: Date): Promise<CollectionResult> {
    const start = Date.now();

    if (!this.hasToken) {
      this.logger.warn('GitHubCollector skipped: GITHUB_TOKEN não configurado');
      return {
        source: 'GitHub',
        success: false,
        error: 'GITHUB_TOKEN não configurado',
        itemsCollected: 0,
        duration: Date.now() - start,
      };
    }

    try {
      const runs = await this.getWorkflowRuns(startDate, endDate);
      this.logger.debug(`GitHub: Found ${runs.length} workflow runs`);

      const jobs = await this.getJobsForRuns(runs);
      this.logger.debug(`GitHub: Found ${jobs.length} jobs`);

      const githubData = this.aggregateData(runs, jobs);

      this.logger.info(`GitHub collected ${runs.length} workflow runs`, {
        successRate: ((githubData.summary as any).successRate * 100).toFixed(1),
      });

      return {
        source: 'GitHub',
        success: true,
        data: githubData,
        itemsCollected: runs.length,
        duration: Date.now() - start,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('GitHubCollector error', { error: errorMsg });
      return {
        source: 'GitHub',
        success: false,
        error: errorMsg,
        itemsCollected: 0,
        duration: Date.now() - start,
      };
    }
  }

  getName(): string {
    return 'GitHubCollector';
  }

  async validate(): Promise<boolean> {
    if (!this.hasToken) {
      return false;
    }

    try {
      await this.axiosClient.get(`/repos/${this.owner}/${this.repo}`);
      return true;
    } catch {
      return false;
    }
  }

  // ─── Private Methods ──────────────────────────────────────────────────────

  private async getWorkflowRuns(startDate: Date, endDate: Date): Promise<any[]> {
    const runs: any[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      try {
        const response = await this.axiosClient.get(`/repos/${this.owner}/${this.repo}/actions/runs`, {
          params: {
            page,
            per_page: 100,
            status: 'completed',
          },
        });

        if (response.data.workflow_runs.length === 0) {
          hasMore = false;
          break;
        }

        // Filtrar por data
        for (const run of response.data.workflow_runs) {
          const createdAt = new Date(run.created_at);
          if (createdAt >= startDate && createdAt <= endDate) {
            runs.push(run);
          } else if (createdAt < startDate) {
            hasMore = false;
            break;
          }
        }

        page++;
      } catch (error) {
        this.logger.error('Error fetching GitHub workflow runs', { error });
        hasMore = false;
      }
    }

    return runs;
  }

  private async getJobsForRuns(runs: any[]): Promise<any[]> {
    const jobs: any[] = [];

    for (const run of runs) {
      try {
        const response = await this.axiosClient.get(`/repos/${this.owner}/${this.repo}/actions/runs/${run.id}/jobs`);
        jobs.push(...response.data.jobs);
      } catch (error) {
        this.logger.debug(`Error fetching jobs for run ${run.id}`);
      }
    }

    return jobs;
  }

  private aggregateData(runs: any[], jobs: any[]): GitHubData {
    const totalDuration = runs.reduce((sum, run) => {
      const startedAt = new Date(run.created_at).getTime();
      const updatedAt = new Date(run.updated_at).getTime();
      return sum + (updatedAt - startedAt);
    }, 0);

    const successfulRuns = runs.filter((r) => r.conclusion === 'success').length;
    const failedRuns = runs.filter((r) => r.conclusion === 'failure').length;

    // Agrupar jobs por name
    const jobsByName = new Map<string, any[]>();
    for (const job of jobs) {
      if (!jobsByName.has(job.name)) {
        jobsByName.set(job.name, []);
      }
      jobsByName.get(job.name)!.push(job);
    }

    const jobMetrics: Record<string, any> = {};
    for (const [jobName, jobList] of jobsByName.entries()) {
      const succeeded = jobList.filter((j) => j.conclusion === 'success').length;
      const avgDuration =
        jobList.reduce((sum, j) => {
          const started = new Date(j.started_at).getTime();
          const completed = new Date(j.completed_at).getTime();
          return sum + (completed - started);
        }, 0) / jobList.length;

      jobMetrics[jobName] = {
        name: jobName,
        runs: jobList.length,
        succeeded,
        failed: jobList.length - succeeded,
        avgDuration,
        status: succeeded === jobList.length ? 'healthy' : succeeded / jobList.length > 0.8 ? 'degraded' : 'critical',
      };
    }

    return {
      runs,
      jobs,
      summary: {
        totalRuns: runs.length,
        totalDuration,
        successfulRuns,
        failedRuns,
        successRate: runs.length > 0 ? successfulRuns / runs.length : 0,
        avgDuration: runs.length > 0 ? totalDuration / runs.length : 0,
        byJob: jobMetrics,
      } as any,
    };
  }
}
