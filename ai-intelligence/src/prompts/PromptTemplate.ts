/**
 * Prompt Template System: Versionedtemplates with composition
 *
 * Supports:
 * - Version management
 * - Template composition (system + context + rules)
 * - Few-shot examples
 * - Metric tracking
 */

import { Logger } from 'winston';
import { AnalysisType } from '../routing/RoutingContext';

export interface PromptTemplate {
  id: string;
  version: number;
  type: AnalysisType;
  name: string;
  description: string;
  system: string; // System prompt (instructions)
  context: string; // Context template (with {{CHUNKS}} and {{QUERY}} placeholders)
  rules: string; // Hard constraints
  examples?: string; // Few-shot examples
  createdAt: Date;
  updatedAt: Date;
  metrics?: {
    avgScore: number;
    samplesEvaluated: number;
    successRate: number;
  };
  tags?: string[];
}

export interface ComposedPrompt {
  system: string;
  user: string;
  templateId: string;
  templateVersion: number;
}

export interface TemplateCompositionContext {
  chunks: string[];
  query: string;
  constraints?: Record<string, unknown>;
}

/**
 * Template repository (in-memory for Phase 1, can be backed by DB later)
 */
export class PromptTemplateRepository {
  private templates: Map<string, PromptTemplate[]> = new Map();
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Register or update a template
   */
  async save(template: PromptTemplate): Promise<void> {
    const key = `${template.type}:${template.name}`;

    if (!this.templates.has(key)) {
      this.templates.set(key, []);
    }

    const versions = this.templates.get(key)!;

    // Auto-increment version if not provided
    if (template.version === 0) {
      template.version = (versions[versions.length - 1]?.version ?? 0) + 1;
    }

    versions.push(template);

    this.logger.info('Template saved', {
      templateId: template.id,
      version: template.version,
      type: template.type,
    });
  }

  /**
   * Get latest version of a template
   */
  async getLatest(type: AnalysisType, name: string): Promise<PromptTemplate | null> {
    const key = `${type}:${name}`;
    const versions = this.templates.get(key);

    if (!versions || versions.length === 0) {
      return null;
    }

    // Return highest version with best eval score
    return versions.reduce((best, current) => {
      const bestScore = best.metrics?.avgScore ?? 0;
      const currentScore = current.metrics?.avgScore ?? 0;
      return currentScore > bestScore ? current : best;
    });
  }

  /**
   * Get specific version
   */
  async getVersion(type: AnalysisType, name: string, version: number): Promise<PromptTemplate | null> {
    const key = `${type}:${name}`;
    const versions = this.templates.get(key);

    if (!versions) {
      return null;
    }

    return versions.find((t) => t.version === version) || null;
  }

  /**
   * List all versions of a template
   */
  async listVersions(type: AnalysisType, name: string): Promise<PromptTemplate[]> {
    const key = `${type}:${name}`;
    return this.templates.get(key) || [];
  }

  /**
   * Get all templates for a type
   */
  async listByType(type: AnalysisType): Promise<PromptTemplate[]> {
    const result: PromptTemplate[] = [];

    for (const [key, versions] of this.templates) {
      if (key.startsWith(`${type}:`)) {
        result.push(...versions);
      }
    }

    return result;
  }

  /**
   * Update metrics for a template
   */
  async updateMetrics(
    templateId: string,
    evalScore: number,
  ): Promise<void> {
    for (const [, versions] of this.templates) {
      const template = versions.find((t) => t.id === templateId);

      if (template) {
        if (!template.metrics) {
          template.metrics = {
            avgScore: evalScore,
            samplesEvaluated: 1,
            successRate: evalScore >= 0.8 ? 1 : 0,
          };
        } else {
          const m = template.metrics;
          const oldAvg = m.avgScore;
          m.samplesEvaluated++;
          m.avgScore = (oldAvg * (m.samplesEvaluated - 1) + evalScore) / m.samplesEvaluated;
          m.successRate = m.successRate * ((m.samplesEvaluated - 1) / m.samplesEvaluated) + (evalScore >= 0.8 ? 1 / m.samplesEvaluated : 0);
        }

        this.logger.info('Template metrics updated', {
          templateId,
          avgScore: template.metrics.avgScore.toFixed(2),
          samples: template.metrics.samplesEvaluated,
        });

        return;
      }
    }

    this.logger.warn('Template not found for metrics update', { templateId });
  }
}

/**
 * Prompt Engine: Compose and manage prompts
 */
export class PromptEngine {
  private repository: PromptTemplateRepository;
  private logger: Logger;

  constructor(repository: PromptTemplateRepository, logger: Logger) {
    this.repository = repository;
    this.logger = logger;
  }

  /**
   * Compose final prompt from template + runtime context
   */
  composePrompt(template: PromptTemplate, context: TemplateCompositionContext): ComposedPrompt {
    // Build system prompt
    const systemPrompt = [
      template.system,
      template.rules,
      template.examples ? `\n## EXAMPLES\n${template.examples}` : '',
    ]
      .filter(Boolean)
      .join('\n\n');

    // Build user prompt
    const userPrompt = [
      template.context
        .replace('{{CHUNKS}}', context.chunks.join('\n---\n'))
        .replace('{{QUERY}}', context.query),
      context.constraints ? `\n\n## CONSTRAINTS\n${JSON.stringify(context.constraints, null, 2)}` : '',
    ]
      .filter(Boolean)
      .join('\n\n');

    return {
      system: systemPrompt,
      user: userPrompt,
      templateId: template.id,
      templateVersion: template.version,
    };
  }

  /**
   * Register a new template
   */
  async register(template: PromptTemplate): Promise<void> {
    await this.repository.save(template);
  }

  /**
   * Get best template for a type
   */
  async getTemplate(type: AnalysisType, name: string): Promise<PromptTemplate> {
    const template = await this.repository.getLatest(type, name);

    if (!template) {
      throw new Error(`No template found for ${type}:${name}`);
    }

    return template;
  }

  /**
   * Record eval score for a template
   */
  async recordEvalScore(templateId: string, evalScore: number): Promise<void> {
    await this.repository.updateMetrics(templateId, evalScore);
  }

  /**
   * Get template versions
   */
  async getVersions(type: AnalysisType, name: string): Promise<PromptTemplate[]> {
    return this.repository.listVersions(type, name);
  }
}
