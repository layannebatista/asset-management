import axios from 'axios';
import { config } from '../config';
import { logger } from '../api/logger';
import { GitHubWorkflowRun, GitHubJob } from '../types/metrics.types';

/**
 * Collects CI/CD data from the GitHub Actions REST API.
 * Uses read-only scope – only requires `repo` read permission.
 */
export class GitHubActionsCollector {
  private readonly headers: Record<string, string>;
  private readonly repoBase: string;

  constructor() {
    this.headers = {
      Authorization: `Bearer ${config.github.token}`,
      Accept: 'application/vnd.github.v3+json',
      'X-GitHub-Api-Version': '2022-11-28',
    };
    this.repoBase = `https://api.github.com/repos/${config.github.owner}/${config.github.repo}`;
  }

  async collectWorkflowRuns(lookbackDays = 7, maxRuns = 50): Promise<GitHubWorkflowRun[]> {
    if (!config.github.token || !config.github.owner || !config.github.repo) {
      logger.warn('GitHub config missing – skipping CI/CD collection');
      return [];
    }

    const since = new Date(Date.now() - lookbackDays * 86_400_000).toISOString();
    logger.info('Collecting GitHub Actions workflow runs', { lookbackDays, since });

    try {
      const response = await axios.get<{ workflow_runs: unknown[] }>(
        `${this.repoBase}/actions/runs`,
        {
          headers: this.headers,
          params: { per_page: maxRuns, created: `>=${since}` },
          timeout: 15000,
        },
      );

      const rawRuns = response.data.workflow_runs as Record<string, unknown>[];

      const runs: GitHubWorkflowRun[] = await Promise.all(
        rawRuns.slice(0, 20).map((run) => this.enrichRun(run)),
      );

      return runs;
    } catch (error) {
      logger.warn('Failed to collect GitHub Actions data', { error });
      return [];
    }
  }

  private async enrichRun(raw: Record<string, unknown>): Promise<GitHubWorkflowRun> {
    const createdAt = new Date(raw['created_at'] as string).getTime();
    const updatedAt = new Date(raw['updated_at'] as string).getTime();

    const run: GitHubWorkflowRun = {
      id: raw['id'] as number,
      name: raw['name'] as string,
      status: raw['status'] as string,
      conclusion: raw['conclusion'] as string | null,
      createdAt: raw['created_at'] as string,
      updatedAt: raw['updated_at'] as string,
      runAttempt: raw['run_attempt'] as number,
      durationMs: updatedAt - createdAt,
    };

    try {
      const jobsResponse = await axios.get<{ jobs: unknown[] }>(
        `${this.repoBase}/actions/runs/${run.id}/jobs`,
        { headers: this.headers, timeout: 10000 },
      );

      run.jobs = (jobsResponse.data.jobs as Record<string, unknown>[]).map((j) =>
        this.mapJob(j),
      );
    } catch {
      // Job enrichment is best-effort
    }

    return run;
  }

  private mapJob(raw: Record<string, unknown>): GitHubJob {
    const startedAt = raw['started_at'] ? new Date(raw['started_at'] as string).getTime() : 0;
    const completedAt = raw['completed_at'] ? new Date(raw['completed_at'] as string).getTime() : 0;

    return {
      id: raw['id'] as number,
      name: raw['name'] as string,
      status: raw['status'] as string,
      conclusion: raw['conclusion'] as string | null,
      startedAt: raw['started_at'] as string,
      completedAt: raw['completed_at'] as string,
      durationMs: completedAt > startedAt ? completedAt - startedAt : 0,
    };
  }
}
