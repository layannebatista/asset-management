/**
 * PromptTemplate unit tests
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { createLogger } from 'winston';
import { PromptEngine, PromptTemplateRepository } from '../../src/prompts/PromptTemplate';
import { DEFAULT_TEMPLATES } from '../../src/prompts/templates';
import { AnalysisType } from '../../src/routing/RoutingContext';
import { v4 as uuidv4 } from 'uuid';

describe('PromptTemplateRepository', () => {
  let repository: PromptTemplateRepository;
  let logger = createLogger({ silent: true });

  beforeEach(() => {
    repository = new PromptTemplateRepository(logger);
  });

  describe('Template Storage', () => {
    it('should save and retrieve a template', async () => {
      const template = DEFAULT_TEMPLATES[0];

      await repository.save(template);
      const retrieved = await repository.getLatest(template.type, template.name);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(template.id);
    });

    it('should auto-increment version', async () => {
      const template1 = { ...DEFAULT_TEMPLATES[0], id: uuidv4(), version: 0 };
      const template2 = { ...DEFAULT_TEMPLATES[0], id: uuidv4(), version: 0, name: template1.name };

      await repository.save(template1);
      await repository.save(template2);

      const versions = await repository.listVersions(template1.type, template1.name);

      expect(versions.length).toBe(2);
      expect(versions[0].version).toBe(1);
      expect(versions[1].version).toBe(2);
    });

    it('should return highest version with best score as latest', async () => {
      const template1 = { ...DEFAULT_TEMPLATES[0], id: uuidv4(), version: 1 };
      const template2 = { ...DEFAULT_TEMPLATES[0], id: uuidv4(), version: 2 };

      template1.metrics = { avgScore: 0.75, samplesEvaluated: 10, successRate: 0.75 };
      template2.metrics = { avgScore: 0.88, samplesEvaluated: 15, successRate: 0.9 };

      await repository.save(template1);
      await repository.save(template2);

      const latest = await repository.getLatest(template1.type, template1.name);

      expect(latest?.version).toBe(2);
      expect(latest?.metrics?.avgScore).toBe(0.88);
    });
  });

  describe('Version Management', () => {
    it('should get specific version', async () => {
      const template1 = { ...DEFAULT_TEMPLATES[0], id: uuidv4(), version: 1 };
      const template2 = { ...DEFAULT_TEMPLATES[0], id: uuidv4(), version: 2 };

      await repository.save(template1);
      await repository.save(template2);

      const v1 = await repository.getVersion(template1.type, template1.name, 1);
      const v2 = await repository.getVersion(template1.type, template1.name, 2);

      expect(v1?.id).toBe(template1.id);
      expect(v2?.id).toBe(template2.id);
    });

    it('should list all versions', async () => {
      for (let i = 0; i < 3; i++) {
        const template = { ...DEFAULT_TEMPLATES[0], id: uuidv4(), version: i + 1 };
        await repository.save(template);
      }

      const versions = await repository.listVersions(DEFAULT_TEMPLATES[0].type, DEFAULT_TEMPLATES[0].name);

      expect(versions.length).toBe(3);
    });

    it('should list templates by type', async () => {
      const incident = { ...DEFAULT_TEMPLATES[0], id: uuidv4(), version: 1 };
      const risk = DEFAULT_TEMPLATES[2]; // Risk template

      await repository.save(incident);
      await repository.save(risk);

      const incidents = await repository.listByType(AnalysisType.INCIDENT);
      const risks = await repository.listByType(AnalysisType.RISK);

      expect(incidents.length).toBeGreaterThan(0);
      expect(risks.length).toBeGreaterThan(0);
    });
  });

  describe('Metrics Tracking', () => {
    it('should update metrics for a template', async () => {
      const template = { ...DEFAULT_TEMPLATES[0], id: uuidv4(), version: 1 };

      await repository.save(template);
      await repository.updateMetrics(template.id, 0.85);

      const updated = await repository.getLatest(template.type, template.name);

      expect(updated?.metrics?.avgScore).toBe(0.85);
      expect(updated?.metrics?.samplesEvaluated).toBe(1);
    });

    it('should accumulate metrics', async () => {
      const template = { ...DEFAULT_TEMPLATES[0], id: uuidv4(), version: 1 };

      await repository.save(template);
      await repository.updateMetrics(template.id, 0.80);
      await repository.updateMetrics(template.id, 0.90);

      const updated = await repository.getLatest(template.type, template.name);

      expect(updated?.metrics?.samplesEvaluated).toBe(2);
      expect(updated?.metrics?.avgScore).toBeCloseTo(0.85, 1);
    });

    it('should track success rate', async () => {
      const template = { ...DEFAULT_TEMPLATES[0], id: uuidv4(), version: 1 };

      await repository.save(template);
      await repository.updateMetrics(template.id, 0.75); // Below 0.8
      await repository.updateMetrics(template.id, 0.85); // Above 0.8
      await repository.updateMetrics(template.id, 0.90); // Above 0.8

      const updated = await repository.getLatest(template.type, template.name);

      expect(updated?.metrics?.successRate).toBeCloseTo(0.667, 2);
    });
  });
});

describe('PromptEngine', () => {
  let engine: PromptEngine;
  let repository: PromptTemplateRepository;
  let logger = createLogger({ silent: true });

  beforeEach(async () => {
    repository = new PromptTemplateRepository(logger);
    engine = new PromptEngine(repository, logger);

    // Register default templates
    for (const template of DEFAULT_TEMPLATES) {
      await engine.register(template);
    }
  });

  describe('Prompt Composition', () => {
    it('should compose prompt with chunks and query', async () => {
      const template = await engine.getTemplate(AnalysisType.INCIDENT, 'investigation');

      const composed = engine.composePrompt(template, {
        chunks: ['Log line 1', 'Log line 2', 'Log line 3'],
        query: 'What happened?',
      });

      expect(composed.system).toContain('incident commander');
      expect(composed.user).toContain('Log line 1');
      expect(composed.user).toContain('What happened?');
      expect(composed.templateId).toBe(template.id);
      expect(composed.templateVersion).toBe(template.version);
    });

    it('should include constraints in user prompt', async () => {
      const template = await engine.getTemplate(AnalysisType.RISK, 'assessment');

      const composed = engine.composePrompt(template, {
        chunks: ['Code snippet'],
        query: 'Assess security risk',
        constraints: { maxTimelineHours: 24 },
      });

      expect(composed.user).toContain('CONSTRAINTS');
      expect(composed.user).toContain('maxTimelineHours');
    });

    it('should separate chunks with delimiter', async () => {
      const template = await engine.getTemplate(AnalysisType.OBSERVABILITY, 'analysis');

      const composed = engine.composePrompt(template, {
        chunks: ['Metric A', 'Metric B', 'Metric C'],
        query: 'Analyze trends',
      });

      const count = (composed.user.match(/---/g) || []).length;

      expect(count).toBe(2); // Between 3 chunks
    });

    it('should include examples in system prompt', async () => {
      const template = await engine.getTemplate(AnalysisType.INCIDENT, 'investigation');

      const composed = engine.composePrompt(template, {
        chunks: [],
        query: 'Test',
      });

      expect(composed.system).toContain('Example');
    });
  });

  describe('Template Retrieval', () => {
    it('should get incident investigation template', async () => {
      const template = await engine.getTemplate(AnalysisType.INCIDENT, 'investigation');

      expect(template.type).toBe(AnalysisType.INCIDENT);
      expect(template.name).toBe('investigation');
      expect(template.system).toContain('incident commander');
    });

    it('should get observability template', async () => {
      const template = await engine.getTemplate(AnalysisType.OBSERVABILITY, 'analysis');

      expect(template.type).toBe(AnalysisType.OBSERVABILITY);
      expect(template.system).toContain('observability');
    });

    it('should get risk assessment template', async () => {
      const template = await engine.getTemplate(AnalysisType.RISK, 'assessment');

      expect(template.type).toBe(AnalysisType.RISK);
      expect(template.system).toContain('security');
    });

    it('should throw on missing template', async () => {
      await expect(engine.getTemplate(AnalysisType.INCIDENT, 'nonexistent')).rejects.toThrow();
    });
  });

  describe('Eval Score Recording', () => {
    it('should record eval scores for templates', async () => {
      const template = await engine.getTemplate(AnalysisType.INCIDENT, 'investigation');

      await engine.recordEvalScore(template.id, 0.87);

      const updated = await engine.getTemplate(AnalysisType.INCIDENT, 'investigation');

      expect(updated.metrics?.avgScore).toBe(0.87);
    });

    it('should accumulate eval scores', async () => {
      const template = await engine.getTemplate(AnalysisType.INCIDENT, 'investigation');

      await engine.recordEvalScore(template.id, 0.80);
      await engine.recordEvalScore(template.id, 0.90);

      const updated = await engine.getTemplate(AnalysisType.INCIDENT, 'investigation');

      expect(updated.metrics?.samplesEvaluated).toBe(2);
      expect(updated.metrics?.avgScore).toBeCloseTo(0.85, 1);
    });
  });

  describe('Template Versions', () => {
    it('should get all versions of a template', async () => {
      const template = await engine.getTemplate(AnalysisType.INCIDENT, 'investigation');

      const versions = await engine.getVersions(AnalysisType.INCIDENT, 'investigation');

      expect(versions.length).toBeGreaterThan(0);
    });
  });
});
