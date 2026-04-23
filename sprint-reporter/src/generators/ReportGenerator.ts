import { Logger } from 'winston';
import {
  SprintReport,
  SprintPeriod,
  CollectedData,
  HealthStatus,
  SystemHealth,
  Issue,
  Insight,
  Recommendation,
  PerformanceMetrics,
  FlowMetrics,
} from '../types/report.types';

/**
 * ReportGenerator: Transforma dados agregados em um relatório estruturado
 * com insights, recomendações e status
 */
export class ReportGenerator {
  private readonly logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  generate(period: SprintPeriod, data: CollectedData): SprintReport {
    this.logger.info('Generating sprint report', {
      project: period.projectName,
      days: period.daysCount,
    });

    // Extrair métricas
    const testMetrics = this.extractTestMetrics(data);
    const testDuration = this.extractTestDuration(data);
    const performance = this.extractPerformance(data);
    const cicd = this.extractCIPipelineMetrics(data);
    const codeQuality = this.extractCodeQuality(data);
    const ai = this.extractAIMetrics(data);
    const flow = this.extractFlowMetrics(data);

    // Analisar e gerar insights
    const health = this.assessHealth(testMetrics, performance, cicd, ai);
    const issues = this.identifyIssues(testMetrics, performance, cicd, ai, flow);
    const insights = this.generateInsights(testMetrics, ai, flow, issues);
    const recommendations = this.generateRecommendations(issues, insights);

    const report: SprintReport = {
      timestamp: new Date(),
      period,
      health,
      summary: {
        status: health.status,
        totalTests: testMetrics.total,
        testPassRate: testMetrics.passRate,
        performanceStatus: this.getPerformanceStatus(performance),
        deploymentCount: cicd.totalRuns,
      },
      tests: testMetrics,
      testDuration,
      performance,
      cicd,
      codeQuality,
      ai,
      flow,
      issues,
      insights,
      recommendations,
    };

    this.logger.info('Report generated successfully', {
      status: report.health.status,
      issues: report.issues.length,
      recommendations: report.recommendations.length,
    });

    return report;
  }

  // ─── Extract Methods ──────────────────────────────────────────────────────

  private extractTestMetrics(data: CollectedData) {
    if (!data.allure?.testResults) {
      return {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        flaky: 0,
        passRate: 0,
        failureRate: 0,
        flakyRate: 0,
        byType: {
          unit: { total: 0, passed: 0, failed: 0, passRate: 0 },
          integration: { total: 0, passed: 0, failed: 0, passRate: 0 },
          e2e: { total: 0, passed: 0, failed: 0, passRate: 0 },
          performance: { total: 0, passed: 0, failed: 0, passRate: 0 },
        },
        byStatus: { passed: [], failed: [], flaky: [] },
      };
    }

    const tr = (data.allure.testResults || {}) as any;
    const typeData = (data.allure as any).byType || {};
    const statusData = (data.allure as any).byStatus || {};
    const total = tr.total || 0;
    const passed = tr.passed || 0;
    const failed = tr.failed || 0;
    const flaky = (tr as any).flaky || 0;

    return {
      total,
      passed,
      failed,
      skipped: tr.skipped || 0,
      flaky,
      passRate: total > 0 ? (passed / total) * 100 : 0,
      failureRate: total > 0 ? (failed / total) * 100 : 0,
      flakyRate: total > 0 ? (flaky / total) * 100 : 0,
      byType: {
        unit: {
          total: Number(typeData.unit?.total || 0),
          passed: Number(typeData.unit?.passed || 0),
          failed: Number(typeData.unit?.failed || 0),
          passRate: Number(typeData.unit?.passRate || 0),
        },
        integration: {
          total: Number(typeData.integration?.total || 0),
          passed: Number(typeData.integration?.passed || 0),
          failed: Number(typeData.integration?.failed || 0),
          passRate: Number(typeData.integration?.passRate || 0),
        },
        e2e: {
          total: Number(typeData.e2e?.total || 0),
          passed: Number(typeData.e2e?.passed || 0),
          failed: Number(typeData.e2e?.failed || 0),
          passRate: Number(typeData.e2e?.passRate || 0),
        },
        performance: {
          total: Number(typeData.performance?.total || 0),
          passed: Number(typeData.performance?.passed || 0),
          failed: Number(typeData.performance?.failed || 0),
          passRate: Number(typeData.performance?.passRate || 0),
        },
      },
      byStatus: {
        passed: Array.isArray(statusData.passed) ? statusData.passed : [],
        failed: Array.isArray(statusData.failed) ? statusData.failed : [],
        flaky: Array.isArray(statusData.flaky) ? statusData.flaky : [],
      },
    };
  }

  private extractTestDuration(data: CollectedData) {
    if (!data.allure?.tests || data.allure.tests.length === 0) {
      return {
        fastest: 0,
        slowest: 0,
        average: 0,
        median: 0,
        p95: 0,
        p99: 0,
      };
    }

    const durations = data.allure.tests
      .map((t: any) => (t.stop ? t.stop - t.start : 0))
      .filter((d: number) => d > 0)
      .sort((a: number, b: number) => a - b);

    if (durations.length === 0) {
      return { fastest: 0, slowest: 0, average: 0, median: 0, p95: 0, p99: 0 };
    }

    const avg = durations.reduce((a: number, b: number) => a + b, 0) / durations.length;
    const median = durations[Math.floor(durations.length / 2)];
    const p95 = durations[Math.floor(durations.length * 0.95)];
    const p99 = durations[Math.floor(durations.length * 0.99)];

    return {
      fastest: durations[0],
      slowest: durations[durations.length - 1],
      average: avg,
      median,
      p95,
      p99,
    };
  }

  private extractPerformance(data: CollectedData): PerformanceMetrics {
    if (!data.k6?.summary) {
      return {};
    }

    const s = data.k6.summary;
    return {
      k6: {
        totalRequests:     s.totalRequests,
        successfulRequests: s.successfulRequests,
        failedRequests:    s.failedRequests,
        errorRate:         s.errorRate,
        latency: {
          min: s.latency.min,
          max: s.latency.max,
          avg: s.latency.avg,
          p95: s.latency.p95,
          p99: s.latency.p99,
        },
        rps:          s.rps,
        dataReceived: s.dataReceived,
        dataSent:     s.dataSent,
        duration:     0,
      },
    };
  }

  private extractCIPipelineMetrics(data: CollectedData) {
    if (!data.github?.summary) {
      return {
        totalRuns: 0,
        successfulRuns: 0,
        failedRuns: 0,
        successRate: 0,
        totalDuration: 0,
        avgDuration: 0,
        byJob: {},
      };
    }

    const s = (data.github.summary || {}) as any;
    return {
      totalRuns: s.totalRuns || 0,
      successfulRuns: s.successfulRuns || (s.succeeded || 0),
      failedRuns: s.failedRuns || (s.failed || 0),
      successRate: (s.successRate || 0) * 100,
      totalDuration: s.totalDuration || 0,
      avgDuration: s.avgDuration || (s.totalDuration / Math.max(s.totalRuns, 1)),
      byJob: s.byJob || {},
    };
  }

  private extractCodeQuality(data: CollectedData) {
    return {
      coverage: 0,
      violations: 0,
      criticalIssues: 0,
      warnings: 0,
      staticAnalysisStatus: 'pass' as const,
    };
  }

  private extractAIMetrics(data: CollectedData) {
    // ─── Try RTK Insights Collector First ──────────────────────────────────
    const rtkApi = (data as any).rtkapi;
    if (rtkApi?.data) {
      const summary = rtkApi.data.summary || {};
      const tokenEcon = rtkApi.data.tokenEconomy || {};
      const models = rtkApi.data.models || [];
      const analyses = rtkApi.data.analyses || [];

      const modelDistribution: Record<string, number> = {};
      const totalExecutions = models.reduce((sum: number, m: any) => sum + Number(m.executions || 0), 0);

      for (const model of models) {
        const modelName = String(model.name || 'desconhecido');
        const executions = Number(model.executions || 0);
        modelDistribution[modelName] = totalExecutions > 0
          ? Number(((executions / totalExecutions) * 100).toFixed(1))
          : 0;
      }

      return {
        analysesExecuted: Number(summary.totalAnalysesExecuted || 0),
        avgQuality: Number(summary.metrics?.qualityScore || 0),
        avgConfidence: Number(summary.metrics?.qualityScore || 0),
        tokensEconomized: Number(summary.metrics?.tokensSaved || 0),
        costSaved: Number(summary.metrics?.usdSaved || 0),
        modelDistribution,
        autonomousDecisions: {
          total: analyses.length,
          successRate: analyses.length > 0
            ? (analyses.filter((a: any) => Number(a.roiPercentage || 0) > 70).length / analyses.length) * 100
            : 0,
          avgRisk: 0,
        },
      };
    }

    // ─── Fallback: Legacy AI API ──────────────────────────────────────────
    const aiApi = (data as any).aiapi;
    const dashboard = aiApi?.dashboard;
    const tokenSummary = aiApi?.tokenSavingsSummary;

    if (dashboard) {
      const modelDistribution: Record<string, number> = {};
      const allModels = dashboard?.models?.allModels ?? [];
      const totalModelExecutions = allModels.reduce((sum: number, item: any) => sum + Number(item.totalExecutions || 0), 0);

      for (const modelItem of allModels) {
        const modelName = String(modelItem.model || 'desconhecido');
        const executions = Number(modelItem.totalExecutions || 0);
        modelDistribution[modelName] = totalModelExecutions > 0
          ? Number(((executions / totalModelExecutions) * 100).toFixed(1))
          : 0;
      }

      return {
        analysesExecuted: Number(tokenSummary?.totalAnalyses || 0),
        avgQuality: Number((dashboard?.quality?.avgQualityScore || 0) * 100),
        avgConfidence: Number((dashboard?.explainability?.avgConfidenceScore || 0) * 100),
        tokensEconomized: Number(tokenSummary?.totalTokensSaved || 0),
        costSaved: Number(dashboard?.costs?.tokenSavingsUsd || 0),
        modelDistribution,
        autonomousDecisions: {
          total: Number(dashboard?.autonomousDecisions?.totalDecisions || 0),
          successRate: Number(dashboard?.autonomousDecisions?.successRate || 0),
          avgRisk: Number(dashboard?.autonomousDecisions?.avgRiskScore || 0),
        },
      };
    }

    // ─── Fallback: PostgreSQL ─────────────────────────────────────────────
    const postgres = data.postgres;
    const tokenSavings = (postgres as any)?.tokenSavings;
    const analysesSummary = (postgres as any)?.analysesSummary;
    const analysisHistory = (postgres?.analysisHistory || []) as any[];
    const totalAnalysesFromHistory = analysisHistory.reduce((sum, row) => sum + Number(row.count || 0), 0);
    const avgQualityFromHistory =
      analysisHistory.length > 0
        ? analysisHistory.reduce((sum, row) => sum + Number(row.avg_quality || 0), 0) / analysisHistory.length
        : 0;

    const decisions = (postgres?.decisions || []) as any[];
    const decisionTotal = decisions.length > 0 ? Number(decisions[0].total_decisions || 0) : 0;
    const decisionSuccessful = decisions.length > 0 ? Number(decisions[0].successful || 0) : 0;
    const decisionSuccessRate = decisionTotal > 0 ? (decisionSuccessful / decisionTotal) * 100 : 0;

    return {
      analysesExecuted: totalAnalysesFromHistory || analysesSummary?.total || 0,
      avgQuality: avgQualityFromHistory <= 1 ? avgQualityFromHistory * 100 : avgQualityFromHistory,
      avgConfidence: decisions.length > 0
        ? (Number(decisions[0].avg_confidence || 0) <= 1
          ? Number(decisions[0].avg_confidence || 0) * 100
          : Number(decisions[0].avg_confidence || 0))
        : 0,
      tokensEconomized: tokenSavings?.totalTokensSaved || 0,
      costSaved: (tokenSavings?.totalTokensSaved || 0) * 0.00001,
      modelDistribution: {},
      autonomousDecisions: {
        total: decisionTotal,
        successRate: decisionSuccessRate,
        avgRisk: decisions.length > 0 ? Number(decisions[0].avg_risk || 0) : 0,
      },
    };
  }

  private extractFlowMetrics(data: CollectedData): FlowMetrics {
    const summary = (data.github?.summary || {}) as any;
    return {
      development: { tasksCompleted: 0, avgDuration: 0 },
      testing: {
        testsExecuted: data.allure?.testResults?.total || 0,
        avgDuration: 0,
      },
      deployment: {
        deployments: summary.totalRuns || 0,
        successRate: (summary.successRate || 0) * 100,
      },
      totalCycleDays: 0,
    };
  }

  // ─── Analysis Methods ─────────────────────────────────────────────────────

  private assessHealth(testMetrics: any, performance: any, cicd: any, ai: any): SystemHealth {
    const issues: string[] = [];

    if (testMetrics.failureRate > 5) issues.push('High failure rate');
    if (testMetrics.flakyRate > 2) issues.push('Flaky tests detected');
    if (cicd.successRate < 95) issues.push('CI/CD success rate low');
    if (performance.k6?.errorRate && performance.k6.errorRate > 1) issues.push('High error rate in performance');

    let status: HealthStatus = 'excellent';
    if (issues.length >= 3) status = 'critical';
    else if (issues.length === 2) status = 'attention';
    else if (issues.length === 1) status = 'good';

    return {
      status,
      issuesCount: issues.length,
      criticalCount: status === 'critical' ? issues.length : 0,
      warningCount: status === 'attention' ? issues.length : 0,
    };
  }

  private identifyIssues(testMetrics: any, performance: any, cicd: any, ai: any, flow: any): Issue[] {
    const issues: Issue[] = [];

    if (testMetrics.failureRate > 5) {
      issues.push({
        severity: testMetrics.failureRate > 10 ? 'critical' : 'warning',
        title: 'Taxa Alta de Falhas em Testes',
        description: `${testMetrics.failureRate.toFixed(1)}% dos testes estão falhando`,
        affectedArea: 'Testes',
        recommendation: 'Revise os testes com falha e corrija as causas raiz antes da próxima sprint',
        detectedAt: new Date(),
      });
    }

    if (testMetrics.flakyRate > 2) {
      issues.push({
        severity: 'warning',
        title: 'Testes Instáveis Detectados',
        description: `${testMetrics.flakyRate.toFixed(1)}% dos testes são instáveis (inconsistentes)`,
        affectedArea: 'Testes',
        recommendation: 'Estabilize os testes instáveis para melhorar a confiabilidade do CI/CD',
        detectedAt: new Date(),
      });
    }

    if (cicd.successRate < 95) {
      issues.push({
        severity: cicd.successRate < 90 ? 'critical' : 'warning',
        title: 'Problemas no Pipeline CI/CD',
        description: `${cicd.successRate.toFixed(1)}% das execuções do pipeline têm sucesso`,
        affectedArea: 'CI/CD',
        recommendation: 'Investigue as falhas do pipeline e melhore a estabilidade da infraestrutura',
        detectedAt: new Date(),
      });
    }

    return issues;
  }

  private generateInsights(testMetrics: any, ai: any, flow: any, issues: Issue[]): Insight[] {
    const insights: Insight[] = [];

    if (testMetrics.passRate > 95) {
      insights.push({
        pattern: 'Qualidade Alta de Testes',
        description: 'Taxa de aprovação de testes excelente (>95%)',
        impact: 'Reduz o risco de bugs não detectados em produção',
        recommendation: 'Mantenha as práticas e padrões de teste atuais',
      });
    }

    if (ai.analysesExecuted > 0) {
      insights.push({
        pattern: 'Otimização de Tokens RTK Ativa',
        description: `${ai.analysesExecuted} análises executadas com ${ai.tokensEconomized?.toLocaleString()} tokens economizados`,
        impact: `Economizou $${ai.costSaved.toFixed(2)} mantendo qualidade de ${ai.avgQuality.toFixed(1)}%`,
        recommendation: 'Continue monitorando a economia de tokens para otimizar custos de IA',
      });
    }

    return insights;
  }

  private generateRecommendations(issues: Issue[], insights: Insight[]): Recommendation[] {
    const recommendations: Recommendation[] = [];

    for (const issue of issues) {
      recommendations.push({
        priority: issue.severity === 'critical' ? 'high' : 'medium',
        action: issue.recommendation,
        rationale: issue.description,
        expectedImpact: `Improve ${issue.affectedArea} reliability`,
        effort: 'medium',
      });
    }

    return recommendations;
  }

  private getPerformanceStatus(performance: any): 'healthy' | 'degraded' | 'critical' {
    if (performance.k6?.errorRate && performance.k6.errorRate > 5) return 'critical';
    if (performance.k6?.errorRate && performance.k6.errorRate > 1) return 'degraded';
    return 'healthy';
  }
}
