import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawnSync } from 'child_process';
import { Logger } from 'winston';

export interface RtkCommandRecord {
  timestamp: string;
  originalCmd: string;
  rtkCmd: string;
  inputTokens: number;
  outputTokens: number;
  savedTokens: number;
  savingsPct: number;
  execTimeMs: number;
  projectPath: string;
}

export interface RtkParseFailureRecord {
  timestamp: string;
  rawCommand: string;
  errorMessage: string;
  fallbackSucceeded: boolean;
}

export interface ObservedAgentModel {
  agent: string;
  provider: string;
  model: string;
  assistantMessages: number;
  sessions: number;
  lastSeen: string;
  entrypoints: string[];
  source: string;
}

export interface RtkInsightsSnapshot {
  projectRoot: string;
  historyDbPath: string;
  generatedAt: string;
  commands: RtkCommandRecord[];
  failures: RtkParseFailureRecord[];
  models: ObservedAgentModel[];
}

export class RtkLocalDataSource {
  private readonly historyDbPath: string;
  private readonly claudeProjectsPath: string;
  private readonly codexSessionsPath: string;
  private readonly copilotRootPath: string;
  private readonly projectRoot: string;
  private readonly readerScriptPath: string;

  constructor(private readonly logger: Logger) {
    this.historyDbPath = process.env.RTK_HISTORY_DB_PATH
      ?? path.join(os.homedir(), 'AppData', 'Local', 'rtk', 'history.db');
    this.claudeProjectsPath = process.env.RTK_CLAUDE_PROJECTS_PATH
      ?? path.join(os.homedir(), '.claude', 'projects');
    this.codexSessionsPath = process.env.RTK_CODEX_SESSIONS_PATH
      ?? path.join(os.homedir(), '.codex', 'sessions');
    this.copilotRootPath = process.env.RTK_COPILOT_ROOT_PATH
      ?? path.join(os.homedir(), '.copilot');
    this.projectRoot = this.normalizePath(
      process.env.RTK_PROJECT_ROOT ?? path.resolve(process.cwd(), '..'),
    );
    this.readerScriptPath = path.resolve(process.cwd(), 'scripts', 'read_rtk_snapshot.py');
  }

  getStatus(): {
    historyDbPath: string;
    projectRoot: string;
    historyAvailable: boolean;
    claudeProjectsAvailable: boolean;
    codexSessionsAvailable: boolean;
    copilotAvailable: boolean;
    readerScriptPath: string;
  } {
    return {
      historyDbPath: this.historyDbPath,
      projectRoot: this.projectRoot,
      historyAvailable: fs.existsSync(this.historyDbPath),
      claudeProjectsAvailable: fs.existsSync(this.claudeProjectsPath),
      codexSessionsAvailable: fs.existsSync(this.codexSessionsPath),
      copilotAvailable: fs.existsSync(this.copilotRootPath),
      readerScriptPath: this.readerScriptPath,
    };
  }

  getSnapshot(days: number): RtkInsightsSnapshot {
    if (!fs.existsSync(this.readerScriptPath)) {
      throw new Error(`RTK snapshot reader not found: ${this.readerScriptPath}`);
    }

    const python = this.resolvePythonCommand();
    const result = spawnSync(
      python.command,
      [
        ...python.args,
        this.readerScriptPath,
        this.historyDbPath,
        this.claudeProjectsPath,
        this.codexSessionsPath,
        this.copilotRootPath,
        this.projectRoot,
        String(days),
      ],
      {
        encoding: 'utf8',
        windowsHide: true,
      },
    );

    if (result.status !== 0) {
      throw new Error((result.stderr || result.stdout || 'unknown python error').trim());
    }

    return JSON.parse(result.stdout) as RtkInsightsSnapshot;
  }

  private resolvePythonCommand(): { command: string; args: string[] } {
    const explicitCandidates = [
      process.env.RTK_PYTHON_PATH,
      path.join(os.homedir(), 'AppData', 'Local', 'Python', 'bin', 'python.exe'),
      path.join(os.homedir(), 'AppData', 'Local', 'Microsoft', 'WindowsApps', 'python.exe'),
      path.join(os.homedir(), 'AppData', 'Local', 'Microsoft', 'WindowsApps', 'py.exe'),
    ].filter((candidate): candidate is string => Boolean(candidate));

    const pythonCandidates = [
      ...explicitCandidates.map((command) => ({
        command,
        args: command.toLowerCase().endsWith('\\py.exe') ? ['-3'] as string[] : [] as string[],
      })),
      { command: 'python', args: [] as string[] },
      { command: 'py', args: ['-3'] as string[] },
    ];

    for (const candidate of pythonCandidates) {
      const probe = spawnSync(candidate.command, [...candidate.args, '--version'], {
        encoding: 'utf8',
        windowsHide: true,
      });

      if (probe.status === 0) {
        return candidate;
      }
    }

    this.logger.error('Python runtime not found for RTK snapshot reader');
    throw new Error('Python runtime not found. Install Python 3 to read RTK history.db.');
  }

  private normalizePath(inputPath: string): string {
    return inputPath
      .replace(/^\\\\\?\\/, '')
      .replace(/\//g, '\\')
      .replace(/\\+$/, '')
      .toLowerCase();
  }
}
