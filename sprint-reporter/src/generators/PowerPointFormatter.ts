import PptxGenJS from 'pptxgenjs';
import { SprintReport } from '../types/report.types';
import { writeFileSync, readFileSync, unlinkSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

export class PowerPointFormatter {
  private prs: any;
  private slideNum: number = 0;

  static format(report: SprintReport): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const formatter = new PowerPointFormatter();
        formatter.generatePresentation(report)
          .then(resolve)
          .catch(reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  private async generatePresentation(report: SprintReport): Promise<Buffer> {
    this.prs = new (PptxGenJS as any)();

    // Configuração global
    this.prs.defineLayout({ name: 'DEFAULT', width: 10, height: 5.625 });
    this.prs.defineLayout({ name: 'BLANK', width: 10, height: 5.625 });

    // Gerar slides
    this.addTitleSlide(report);
    this.addExecutiveSummary(report);
    this.addTestMetrics(report);
    this.addCIPipeline(report);
    this.addAIMetrics(report);
    this.addPerformance(report);
    this.addHealthStatus(report);
    this.addIssuesSlide(report);
    this.addRecommendations(report);
    this.addInsights(report);

    // Salvar em arquivo temporário
    return new Promise((resolve, reject) => {
      const tmpFile = join(tmpdir(), `relatorio-sprint-${Date.now()}.pptx`);
      this.prs.writeFile({ fileName: tmpFile })
        .then(() => {
          try {
            const buffer = readFileSync(tmpFile);
            unlinkSync(tmpFile);
            resolve(buffer);
          } catch (err) {
            reject(err);
          }
        })
        .catch((err: any) => {
          try { unlinkSync(tmpFile); } catch {}
          reject(err);
        });
    });
  }

  private addTitleSlide(report: SprintReport): void {
    const slide = this.prs.addSlide();

    // Fundo degradado
    slide.background = {
      fill: '1F4E78'  // Azul profundo
    };

    // Overlay decorativo no topo
    slide.addShape('rect', {
      x: 0, y: 0, w: 10, h: 1.5,
      fill: { color: '2E5DA0' },
      line: { type: 'none' }
    });

    // Linha decorativa
    slide.addShape('rect', {
      x: 0, y: 1.5, w: 10, h: 0.08,
      fill: { color: '00B050' },
      line: { type: 'none' }
    });

    // Título principal
    slide.addText('RELATÓRIO DE SPRINT', {
      x: 0.5, y: 0.4, w: 9, h: 0.6,
      fontSize: 48, bold: true, color: 'FFFFFF',
      align: 'center', fontFace: 'Calibri'
    });

    // Projeto e período
    slide.addText(`${report.period.projectName.toUpperCase()}`, {
      x: 0.5, y: 2.0, w: 9, h: 0.5,
      fontSize: 32, bold: true, color: '00B050',
      align: 'center', fontFace: 'Calibri'
    });

    slide.addText(
      `${this.formatDate(report.period.startDate)} a ${this.formatDate(report.period.endDate)}`,
      {
        x: 0.5, y: 2.6, w: 9, h: 0.4,
        fontSize: 20, color: 'E8E8E8',
        align: 'center', fontFace: 'Calibri'
      }
    );

    // Status badge grande
    const healthColor = this.getHealthColor(report.health.status);
    const statusLabel = this.getStatusLabel(report.health.status);

    slide.addShape('rect', {
      x: 3.5, y: 3.5, w: 3, h: 0.8,
      fill: { color: healthColor },
      line: { type: 'none' },
      shadow: { type: 'outer', blur: 8, offset: 3, angle: 45, color: '000000', opacity: 0.3 }
    });

    slide.addText(statusLabel, {
      x: 3.5, y: 3.5, w: 3, h: 0.8,
      fontSize: 28, bold: true, color: 'FFFFFF',
      align: 'center', valign: 'middle', fontFace: 'Calibri'
    });

    // Footer
    slide.addText(`Gerado em ${this.formatDate(report.timestamp)}`, {
      x: 0.5, y: 5.0, w: 9, h: 0.4,
      fontSize: 12, color: 'AAAAAA', italic: true,
      align: 'center', fontFace: 'Calibri'
    });
  }

  private addExecutiveSummary(report: SprintReport): void {
    const slide = this.prs.addSlide();
    this.addHeader(slide, '📊 RESUMO EXECUTIVO');

    const summary = report.summary;
    const health = report.health;
    const sourceStatus = ((report as any).sourceStatus || {}) as Record<string, boolean>;

    // Linha 1: Status principal
    let y = 1.4;

    slide.addText('STATUS GERAL', {
      x: 0.5, y: y, w: 2, h: 0.3,
      fontSize: 12, bold: true, color: '1F4E78', fontFace: 'Calibri'
    });

    const healthColor = this.getHealthColor(summary.status);
    slide.addShape('rect', {
      x: 0.5, y: y + 0.35, w: 2, h: 0.45,
      fill: { color: healthColor },
      line: { type: 'none' }
    });
    slide.addText(this.getStatusLabel(summary.status), {
      x: 0.5, y: y + 0.35, w: 2, h: 0.45,
      fontSize: 18, bold: true, color: 'FFFFFF',
      align: 'center', valign: 'middle', fontFace: 'Calibri'
    });

    // Métricas em cards
    const metrics = [
      { label: '✓ Testes', value: summary.totalTests?.toString() || '0', x: 3, color: '2E5DA0' },
      { label: '✓ Taxa Sucesso', value: `${summary.testPassRate?.toFixed(0) || 0}%`, x: 5.2, color: '00B050' },
      { label: '✓ Deployments', value: summary.deploymentCount?.toString() || '0', x: 7.4, color: '4472C4' },
    ];

    for (const metric of metrics) {
      slide.addShape('rect', {
        x: metric.x, y: y, w: 2, h: 0.8,
        fill: { color: metric.color },
        line: { type: 'none' },
        shadow: { type: 'outer', blur: 4, offset: 2, angle: 45, color: '000000', opacity: 0.15 }
      });

      slide.addText(metric.label, {
        x: metric.x, y: y + 0.05, w: 2, h: 0.25,
        fontSize: 10, bold: true, color: 'FFFFFF',
        align: 'center', fontFace: 'Calibri'
      });

      slide.addText(metric.value, {
        x: metric.x, y: y + 0.3, w: 2, h: 0.35,
        fontSize: 22, bold: true, color: 'FFFFFF',
        align: 'center', fontFace: 'Calibri'
      });
    }

    // Problemas detectados
    y = 2.2;
    slide.addText('PROBLEMAS DETECTADOS', {
      x: 0.5, y: y, w: 4.5, h: 0.3,
      fontSize: 12, bold: true, color: '1F4E78', fontFace: 'Calibri'
    });

    const issueLabels = [
      { label: '🔴 Críticos', value: health.criticalCount || 0, color: 'C00000' },
      { label: '🟡 Avisos', value: health.warningCount || 0, color: 'FFC000' },
    ];

    let issueX = 0.5;
    for (const issue of issueLabels) {
      slide.addShape('rect', {
        x: issueX, y: y + 0.35, w: 2.2, h: 0.55,
        fill: { color: 'F5F5F5' },
        line: { color: issue.color, width: 2 }
      });

      slide.addText(issue.label, {
        x: issueX, y: y + 0.38, w: 1.2, h: 0.25,
        fontSize: 11, bold: true, color: issue.color,
        fontFace: 'Calibri'
      });

      slide.addText(issue.value.toString(), {
        x: issueX + 1.2, y: y + 0.38, w: 1, h: 0.25,
        fontSize: 18, bold: true, color: issue.color,
        align: 'center', fontFace: 'Calibri'
      });

      issueX += 2.35;
    }

    // Qualidade das fontes (API, testes, performance)
    y = 3.3;
    slide.addText('QUALIDADE DAS FONTES DE DADOS', {
      x: 5.2, y: y, w: 4.3, h: 0.3,
      fontSize: 12, bold: true, color: '1F4E78', fontFace: 'Calibri'
    });

    const sources = [
      { label: 'Allure', ok: sourceStatus.allure !== false },
      { label: 'CI/CD API', ok: sourceStatus.github !== false },
      { label: 'IA Metrics API', ok: sourceStatus.aiapi !== false },
      { label: 'K6', ok: sourceStatus.k6 !== false },
    ];

    let sy = y + 0.35;
    for (const source of sources) {
      const color = source.ok ? '00B050' : 'C00000';
      const label = source.ok ? 'OK' : 'INDISP.';

      slide.addShape('rect', {
        x: 5.2, y: sy, w: 1.2, h: 0.26,
        fill: { color },
        line: { type: 'none' }
      });

      slide.addText(label, {
        x: 5.2, y: sy, w: 1.2, h: 0.26,
        fontSize: 9, bold: true, color: 'FFFFFF',
        align: 'center', valign: 'middle', fontFace: 'Calibri'
      });

      slide.addText(source.label, {
        x: 6.5, y: sy, w: 2.8, h: 0.26,
        fontSize: 10, color: '333333', fontFace: 'Calibri'
      });

      sy += 0.3;
    }

    // Recomendações rápidas
    y = 3.3;
    slide.addText('AÇÕES RECOMENDADAS', {
      x: 0.5, y: y, w: 9, h: 0.3,
      fontSize: 12, bold: true, color: '1F4E78', fontFace: 'Calibri'
    });

    let recY = y + 0.4;
    const recommendations = report.recommendations?.slice(0, 3) || [];
    for (const rec of recommendations) {
      const priorityColor = this.getPriorityColor(rec.priority);
      const priorityLabel = rec.priority === 'high' ? '🔴' : rec.priority === 'medium' ? '🟡' : '🟢';

      slide.addText(`${priorityLabel} ${rec.action}`, {
        x: 0.7, y: recY, w: 8.6, h: 0.3,
        fontSize: 11, color: '333333',
        fontFace: 'Calibri'
      });

      recY += 0.35;
    }
  }

  private addTestMetrics(report: SprintReport): void {
    const slide = this.prs.addSlide();
    this.addHeader(slide, '🧪 MÉTRICAS DE TESTES');

    const tests = report.tests;
    if (!tests) return;

    let y = 1.5;

    // Cards principais
    const mainMetrics = [
      { label: 'Total de Testes', value: tests.total || 0, color: '2E5DA0' },
      { label: 'Taxa de Sucesso', value: `${tests.passRate?.toFixed(1) || 0}%`, color: '00B050' },
      { label: 'Testes Falhando', value: tests.failed || 0, color: 'C00000' },
      { label: 'Testes Instáveis', value: tests.flaky || 0, color: 'FFC000' },
    ];

    let x = 0.5;
    for (const metric of mainMetrics) {
      slide.addShape('rect', {
        x: x, y: y, w: 2.2, h: 1.0,
        fill: { color: 'F5F5F5' },
        line: { color: metric.color, width: 3 }
      });

      slide.addText(metric.label, {
        x: x + 0.1, y: y + 0.1, w: 2, h: 0.3,
        fontSize: 10, color: '666666',
        fontFace: 'Calibri'
      });

      slide.addText(metric.value.toString(), {
        x: x + 0.1, y: y + 0.45, w: 2, h: 0.5,
        fontSize: 32, bold: true, color: metric.color,
        align: 'center', fontFace: 'Calibri'
      });

      x += 2.35;
    }

    // Gráfico de distribuição
    y = 2.8;
    slide.addText('Distribuição por Tipo', {
      x: 0.5, y: y, w: 9, h: 0.25,
      fontSize: 11, bold: true, color: '1F4E78', fontFace: 'Calibri'
    });

    y += 0.35;
    const testTypes = tests.byType || {} as any;
    const totalTests = tests.total || 1;

    const types = [
      { name: '📌 Unitários', count: (testTypes.unit as any)?.total || 0, color: '4472C4' },
      { name: '🔗 Integração', count: (testTypes.integration as any)?.total || 0, color: '70AD47' },
      { name: '🌐 E2E', count: (testTypes.e2e as any)?.total || 0, color: 'FFC000' },
      { name: '⚡ Performance', count: (testTypes.performance as any)?.total || 0, color: 'C00000' },
    ];

    for (const type of types) {
      const percentage = ((type.count / totalTests) * 100).toFixed(0);
      const barWidth = (type.count / totalTests) * 8;

      slide.addText(type.name, {
        x: 0.5, y: y, w: 1.5, h: 0.25,
        fontSize: 10, color: '333333', fontFace: 'Calibri'
      });

      slide.addShape('rect', {
        x: 2, y: y + 0.02, w: barWidth, h: 0.2,
        fill: { color: type.color },
        line: { type: 'none' }
      });

      slide.addText(`${percentage}%`, {
        x: 2 + barWidth + 0.1, y: y, w: 0.8, h: 0.25,
        fontSize: 10, bold: true, color: type.color, fontFace: 'Calibri'
      });

      y += 0.35;
    }

    // Testes instáveis
    y = 4.6;
    if (tests.byStatus?.flaky && tests.byStatus.flaky.length > 0) {
      slide.addText('⚠️ Testes Instáveis Detectados', {
        x: 0.5, y: y, w: 9, h: 0.25,
        fontSize: 11, bold: true, color: 'C00000', fontFace: 'Calibri'
      });

      y += 0.3;
      for (const test of tests.byStatus.flaky.slice(0, 2)) {
        slide.addText(`• ${test}`, {
          x: 0.7, y: y, w: 8.6, h: 0.22,
          fontSize: 10, color: '666666', fontFace: 'Calibri'
        });
        y += 0.25;
      }
    }
  }

  private addCIPipeline(report: SprintReport): void {
    const slide = this.prs.addSlide();
    this.addHeader(slide, '🔄 PIPELINE CI/CD');

    const cicd = report.cicd;
    if (!cicd) return;

    let y = 1.5;

    // Cards principais
    const metrics = [
      { label: 'Total de Execuções', value: cicd.totalRuns || 0, color: '2E5DA0' },
      { label: 'Taxa de Sucesso', value: `${cicd.successRate?.toFixed(1) || 0}%`, color: '00B050' },
      { label: 'Execuções Falhadas', value: cicd.failedRuns || 0, color: 'C00000' },
      { label: 'Tempo Médio', value: `${(cicd.avgDuration || 0).toFixed(0)}s`, color: '4472C4' },
    ];

    let x = 0.5;
    for (const metric of metrics) {
      slide.addShape('rect', {
        x: x, y: y, w: 2.2, h: 1.0,
        fill: { color: 'F5F5F5' },
        line: { color: metric.color, width: 3 }
      });

      slide.addText(metric.label, {
        x: x + 0.1, y: y + 0.1, w: 2, h: 0.3,
        fontSize: 10, color: '666666', fontFace: 'Calibri'
      });

      slide.addText(metric.value.toString(), {
        x: x + 0.1, y: y + 0.45, w: 2, h: 0.5,
        fontSize: 32, bold: true, color: metric.color,
        align: 'center', fontFace: 'Calibri'
      });

      x += 2.35;
    }

    // Tabela de jobs
    y = 2.8;
    slide.addText('Status dos Jobs', {
      x: 0.5, y: y, w: 9, h: 0.25,
      fontSize: 11, bold: true, color: '1F4E78', fontFace: 'Calibri'
    });

    y += 0.35;
    const headers = ['Job', 'Execuções', 'Taxa Sucesso', 'Tempo Médio'];
    const headerX = [0.5, 3.5, 6, 8];

    for (let i = 0; i < headers.length; i++) {
      slide.addText(headers[i], {
        x: headerX[i], y: y, w: 2, h: 0.25,
        fontSize: 10, bold: true, color: 'FFFFFF',
        fill: { color: '2E5DA0' }, fontFace: 'Calibri'
      });
    }

    y += 0.3;
    const jobs = Object.entries((cicd.byJob as any) || {}).slice(0, 4);
    for (const [jobName, jobData] of jobs) {
      const jobDat = jobData as any;
      const successPct = jobDat.runs > 0 ? ((jobDat.succeeded / jobDat.runs) * 100).toFixed(0) : '0';

      const rowData = [
        jobName.substring(0, 15),
        jobDat.runs?.toString() || '0',
        `${successPct}%`,
        `${(jobDat.avgDuration || 0).toFixed(0)}s`,
      ];

      for (let i = 0; i < rowData.length; i++) {
        const bgColor = i === 0 ? 'F5F5F5' : 'FFFFFF';
        const borderColor = successPct === '100' ? '00B050' : successPct > '90' ? 'FFC000' : 'C00000';

        slide.addShape('rect', {
          x: headerX[i], y: y, w: 2, h: 0.25,
          fill: { color: bgColor },
          line: { color: borderColor, width: 1 }
        });

        slide.addText(rowData[i], {
          x: headerX[i] + 0.05, y: y, w: 1.9, h: 0.25,
          fontSize: 10, color: '333333',
          align: i === 0 ? 'left' : 'center', valign: 'middle',
          fontFace: 'Calibri'
        });
      }

      y += 0.3;
    }
  }

  private addAIMetrics(report: SprintReport): void {
    const slide = this.prs.addSlide();
    this.addHeader(slide, '🤖 INTELIGÊNCIA ARTIFICIAL');

    const ai = report.ai;
    if (!ai) return;

    let y = 1.5;

    // Cards principais
    const metrics = [
      { label: 'Análises Executadas', value: ai.analysesExecuted || 0, color: '4472C4' },
      { label: 'Qualidade Média', value: `${(ai.avgQuality || 0).toFixed(0)}%`, color: '00B050' },
      { label: 'Confiança Média', value: `${(ai.avgConfidence || 0).toFixed(0)}%`, color: '70AD47' },
      { label: 'Economia de Tokens', value: (ai.tokensEconomized || 0).toLocaleString(), color: 'FFC000' },
    ];

    let x = 0.5;
    for (const metric of metrics) {
      slide.addShape('rect', {
        x: x, y: y, w: 2.2, h: 1.0,
        fill: { color: 'F5F5F5' },
        line: { color: metric.color, width: 3 }
      });

      slide.addText(metric.label, {
        x: x + 0.1, y: y + 0.1, w: 2, h: 0.3,
        fontSize: 10, color: '666666', fontFace: 'Calibri'
      });

      slide.addText(metric.value.toString(), {
        x: x + 0.1, y: y + 0.45, w: 2, h: 0.5,
        fontSize: 28, bold: true, color: metric.color,
        align: 'center', fontFace: 'Calibri'
      });

      x += 2.35;
    }

    // Decisões autônomas
    y = 2.8;
    slide.addText('Decisões Autônomas', {
      x: 0.5, y: y, w: 9, h: 0.25,
      fontSize: 11, bold: true, color: '1F4E78', fontFace: 'Calibri'
    });

    y += 0.35;
    const autonomous = (ai.autonomousDecisions || {}) as any;

    slide.addShape('rect', {
      x: 0.5, y: y, w: 4, h: 0.6,
      fill: { color: '4472C4' },
      line: { type: 'none' }
    });
    slide.addText(`${autonomous.total || 0} Decisões Tomadas`, {
      x: 0.7, y: y + 0.15, w: 3.6, h: 0.3,
      fontSize: 14, bold: true, color: 'FFFFFF', fontFace: 'Calibri'
    });

    slide.addShape('rect', {
      x: 5.5, y: y, w: 4, h: 0.6,
      fill: { color: '70AD47' },
      line: { type: 'none' }
    });
    slide.addText(`${(autonomous.successRate || 0).toFixed(0)}% Taxa de Sucesso`, {
      x: 5.7, y: y + 0.15, w: 3.6, h: 0.3,
      fontSize: 14, bold: true, color: 'FFFFFF', fontFace: 'Calibri'
    });

    // Economia financeira
    y = 3.8;
    const costSaved = ai.costSaved || 0;
    slide.addShape('rect', {
      x: 1.5, y: y, w: 7, h: 1.3,
      fill: { color: '00B050' },
      line: { type: 'none' },
      shadow: { type: 'outer', blur: 8, offset: 4, angle: 45, color: '000000', opacity: 0.2 }
    });

    slide.addText('💰 ECONOMIA ESTIMADA (RTK + IA)', {
      x: 1.7, y: y + 0.15, w: 6.6, h: 0.3,
      fontSize: 12, bold: true, color: 'FFFFFF', fontFace: 'Calibri'
    });

    slide.addText(`US$ ${costSaved.toFixed(2)}`, {
      x: 1.7, y: y + 0.5, w: 6.6, h: 0.6,
      fontSize: 40, bold: true, color: 'FFFFFF',
      align: 'center', fontFace: 'Calibri'
    });
  }

  private addPerformance(report: SprintReport): void {
    const slide = this.prs.addSlide();
    this.addHeader(slide, '⚡ PERFORMANCE');

    const perf = report.performance;
    if (!perf) return;

    let y = 1.5;

    const k6 = (perf as any).k6;
    if (k6) {
      const metrics = [
        { label: 'Total de Requisições', value: k6.totalRequests || 0, color: '2E5DA0' },
        { label: 'Taxa de Erro', value: `${(k6.errorRate || 0).toFixed(2)}%`, color: k6.errorRate > 1 ? 'C00000' : '00B050' },
        { label: 'Latência Média', value: `${((k6.latency as any)?.avg || 0).toFixed(0)}ms`, color: '4472C4' },
        { label: 'Taxa de Transferência', value: `${(k6.rps || 0).toFixed(1)} req/s`, color: '70AD47' },
      ];

      let x = 0.5;
      for (const metric of metrics) {
        slide.addShape('rect', {
          x: x, y: y, w: 2.2, h: 1.0,
          fill: { color: 'F5F5F5' },
          line: { color: metric.color, width: 3 }
        });

        slide.addText(metric.label, {
          x: x + 0.1, y: y + 0.1, w: 2, h: 0.3,
          fontSize: 10, color: '666666', fontFace: 'Calibri'
        });

        slide.addText(metric.value.toString(), {
          x: x + 0.1, y: y + 0.45, w: 2, h: 0.5,
          fontSize: 28, bold: true, color: metric.color,
          align: 'center', fontFace: 'Calibri'
        });

        x += 2.35;
      }

      // Percentis de latência
      y = 2.8;
      slide.addText('Distribuição de Latência', {
        x: 0.5, y: y, w: 9, h: 0.25,
        fontSize: 11, bold: true, color: '1F4E78', fontFace: 'Calibri'
      });

      y += 0.35;
      const latencyPercentiles = [
        { name: 'Mín', value: k6.latency?.min || 0, color: '70AD47' },
        { name: 'Média', value: k6.latency?.avg || 0, color: '4472C4' },
        { name: 'P95', value: k6.latency?.p95 || 0, color: 'FFC000' },
        { name: 'P99', value: k6.latency?.p99 || 0, color: 'C00000' },
        { name: 'Máx', value: k6.latency?.max || 0, color: 'C00000' },
      ];

      let latX = 0.5;
      for (const percentile of latencyPercentiles) {
        slide.addText(percentile.name, {
          x: latX, y: y, w: 1.8, h: 0.25,
          fontSize: 10, bold: true, color: 'FFFFFF',
          fill: { color: percentile.color },
          align: 'center', fontFace: 'Calibri'
        });

        slide.addText(`${percentile.value.toFixed(0)}ms`, {
          x: latX, y: y + 0.3, w: 1.8, h: 0.3,
          fontSize: 12, bold: true, color: percentile.color,
          align: 'center', fontFace: 'Calibri'
        });

        latX += 1.9;
      }
    }

    const pw = (perf as any).playwritght;
    if (pw) {
      y = 4.2;

      slide.addText('Testes Playwright', {
        x: 0.5, y: y, w: 9, h: 0.25,
        fontSize: 11, bold: true, color: '1F4E78', fontFace: 'Calibri'
      });

      y += 0.35;
      slide.addShape('rect', {
        x: 0.5, y: y, w: 2.2, h: 0.7,
        fill: { color: '70AD47' },
        line: { type: 'none' }
      });
      slide.addText(`${pw.passedSteps || 0} Passos OK`, {
        x: 0.7, y: y + 0.15, w: 1.8, h: 0.4,
        fontSize: 14, bold: true, color: 'FFFFFF',
        align: 'center', fontFace: 'Calibri'
      });

      slide.addShape('rect', {
        x: 2.9, y: y, w: 2.2, h: 0.7,
        fill: { color: 'C00000' },
        line: { type: 'none' }
      });
      slide.addText(`${pw.failedSteps || 0} Passos Falhados`, {
        x: 3.1, y: y + 0.15, w: 1.8, h: 0.4,
        fontSize: 14, bold: true, color: 'FFFFFF',
        align: 'center', fontFace: 'Calibri'
      });

      slide.addShape('rect', {
        x: 5.3, y: y, w: 4.2, h: 0.7,
        fill: { color: '4472C4' },
        line: { type: 'none' }
      });
      slide.addText(`Duração Média: ${(pw.avgDuration || 0).toFixed(0)}ms`, {
        x: 5.5, y: y + 0.15, w: 3.8, h: 0.4,
        fontSize: 14, bold: true, color: 'FFFFFF',
        align: 'center', fontFace: 'Calibri'
      });
    }
  }

  private addHealthStatus(report: SprintReport): void {
    const slide = this.prs.addSlide();
    this.addHeader(slide, '💚 SAÚDE DA SPRINT');

    const health = report.health;
    let y = 1.5;

    // Gauge visual de saúde
    const statusColor = this.getHealthColor(health.status);
    const statusLabel = this.getStatusLabel(health.status);

    slide.addShape('rect', {
      x: 2, y: y, w: 6, h: 1.2,
      fill: { color: statusColor },
      line: { type: 'none' },
      shadow: { type: 'outer', blur: 8, offset: 4, angle: 45, color: '000000', opacity: 0.2 }
    });

    slide.addText('STATUS GERAL', {
      x: 2.2, y: y + 0.15, w: 5.6, h: 0.25,
      fontSize: 12, bold: true, color: 'FFFFFF', fontFace: 'Calibri'
    });

    slide.addText(statusLabel, {
      x: 2.2, y: y + 0.45, w: 5.6, h: 0.6,
      fontSize: 48, bold: true, color: 'FFFFFF',
      align: 'center', fontFace: 'Calibri'
    });

    // Indicadores de problemas
    y = 3.0;
    slide.addText('Problemas Detectados', {
      x: 0.5, y: y, w: 9, h: 0.25,
      fontSize: 11, bold: true, color: '1F4E78', fontFace: 'Calibri'
    });

    y += 0.35;
    const issueTypes = [
      { icon: '🔴', label: 'Críticos', count: health.criticalCount || 0, color: 'C00000' },
      { icon: '🟡', label: 'Avisos', count: health.warningCount || 0, color: 'FFC000' },
      { icon: 'ℹ️', label: 'Info', count: (health as any).infoCount || 0, color: '4472C4' },
    ];

    let issueX = 0.5;
    for (const issue of issueTypes) {
      slide.addShape('rect', {
        x: issueX, y: y, w: 2.8, h: 0.65,
        fill: { color: 'F5F5F5' },
        line: { color: issue.color, width: 2 }
      });

      slide.addText(issue.label, {
        x: issueX + 0.15, y: y + 0.1, w: 2.5, h: 0.2,
        fontSize: 11, bold: true, color: issue.color, fontFace: 'Calibri'
      });

      slide.addText(issue.count.toString(), {
        x: issueX + 0.15, y: y + 0.35, w: 2.5, h: 0.25,
        fontSize: 28, bold: true, color: issue.color,
        align: 'center', fontFace: 'Calibri'
      });

      issueX += 3.0;
    }

    // Checklist de saúde
    y = 4.3;
    slide.addText('Checklist de Qualidade', {
      x: 0.5, y: y, w: 9, h: 0.25,
      fontSize: 11, bold: true, color: '1F4E78', fontFace: 'Calibri'
    });

    y += 0.35;
    const healthChecks = [
      { item: '✓ Taxa de testes aceitável', status: (report.summary.testPassRate || 0) >= 85, score: report.summary.testPassRate || 0 },
      { item: '✓ Pipeline estável', status: (report.cicd?.successRate || 0) >= 90, score: report.cicd?.successRate || 0 },
      { item: '✓ Sem testes críticos falhando', status: (report.tests?.failed || 0) === 0, score: report.tests?.failed === 0 ? 100 : 0 },
    ];

    for (const check of healthChecks) {
      const icon = check.status ? '✓' : '✗';
      const color = check.status ? '00B050' : 'C00000';

      slide.addText(icon, {
        x: 0.6, y: y, w: 0.3, h: 0.25,
        fontSize: 16, bold: true, color: color, fontFace: 'Calibri'
      });

      slide.addText(check.item, {
        x: 1.0, y: y, w: 6, h: 0.25,
        fontSize: 11, color: '333333', fontFace: 'Calibri'
      });

      slide.addText(`${check.score.toFixed(0)}%`, {
        x: 7.5, y: y, w: 2, h: 0.25,
        fontSize: 11, bold: true, color: color,
        align: 'right', fontFace: 'Calibri'
      });

      y += 0.3;
    }
  }

  private addIssuesSlide(report: SprintReport): void {
    const slide = this.prs.addSlide();
    this.addHeader(slide, '⚠️ PROBLEMAS IDENTIFICADOS');

    if (!report.issues || report.issues.length === 0) {
      const y = 2.5;
      slide.addShape('rect', {
        x: 1.5, y: y, w: 7, h: 1.2,
        fill: { color: '00B050' },
        line: { type: 'none' },
        shadow: { type: 'outer', blur: 8, offset: 4, angle: 45, color: '000000', opacity: 0.2 }
      });

      slide.addText('✓ Nenhum problema detectado!', {
        x: 1.7, y: y + 0.25, w: 6.6, h: 0.3,
        fontSize: 18, bold: true, color: 'FFFFFF',
        align: 'center', fontFace: 'Calibri'
      });

      slide.addText('A sprint está funcionando bem!', {
        x: 1.7, y: y + 0.65, w: 6.6, h: 0.25,
        fontSize: 12, color: 'FFFFFF',
        align: 'center', fontFace: 'Calibri'
      });

      return;
    }

    let y = 1.5;
    for (const issue of report.issues.slice(0, 5)) {
      const severityColor = issue.severity === 'critical' ? 'C00000' : 'FFC000';
      const severityLabel = issue.severity === 'critical' ? '🔴 CRÍTICO' : '🟡 AVISO';

      slide.addShape('rect', {
        x: 0.5, y: y, w: 9, h: 0.6,
        fill: { color: 'F5F5F5' },
        line: { color: severityColor, width: 2 }
      });

      slide.addText(severityLabel, {
        x: 0.7, y: y + 0.08, w: 1.5, h: 0.2,
        fontSize: 10, bold: true, color: severityColor, fontFace: 'Calibri'
      });

      slide.addText(issue.title, {
        x: 2.3, y: y + 0.08, w: 7, h: 0.2,
        fontSize: 11, bold: true, color: '333333', fontFace: 'Calibri'
      });

      slide.addText(issue.description, {
        x: 0.7, y: y + 0.32, w: 8.6, h: 0.23,
        fontSize: 9, color: '666666', fontFace: 'Calibri'
      });

      y += 0.75;
    }
  }

  private addRecommendations(report: SprintReport): void {
    const slide = this.prs.addSlide();
    this.addHeader(slide, '💡 RECOMENDAÇÕES');

    if (!report.recommendations || report.recommendations.length === 0) {
      const y = 2.5;
      slide.addText('Nenhuma recomendação no momento.', {
        x: 0.5, y: y, w: 9, h: 0.5,
        fontSize: 14, color: '666666',
        align: 'center', fontFace: 'Calibri'
      });

      return;
    }

    let y = 1.5;
    for (const rec of report.recommendations.slice(0, 4)) {
      const priorityColor = rec.priority === 'high' ? 'C00000' : rec.priority === 'medium' ? 'FFC000' : '00B050';
      const priorityLabel = rec.priority === 'high' ? '🔴 ALTA' : rec.priority === 'medium' ? '🟡 MÉDIA' : '🟢 BAIXA';
      const effortLabel = rec.effort === 'high' ? 'Alto' : rec.effort === 'medium' ? 'Médio' : 'Baixo';

      slide.addShape('rect', {
        x: 0.5, y: y, w: 9, h: 0.68,
        fill: { color: 'F5F5F5' },
        line: { color: priorityColor, width: 2 }
      });

      slide.addText(priorityLabel, {
        x: 0.7, y: y + 0.08, w: 1.2, h: 0.2,
        fontSize: 10, bold: true, color: priorityColor, fontFace: 'Calibri'
      });

      slide.addText(rec.action, {
        x: 2.0, y: y + 0.08, w: 6.2, h: 0.2,
        fontSize: 11, bold: true, color: '333333', fontFace: 'Calibri'
      });

      slide.addText(rec.rationale, {
        x: 0.7, y: y + 0.32, w: 8.0, h: 0.32,
        fontSize: 9, color: '666666', fontFace: 'Calibri'
      });

      slide.addText(`Esforço: ${effortLabel}`, {
        x: 8.0, y: y + 0.32, w: 1.4, h: 0.16,
        fontSize: 9, italic: true, color: '999999',
        align: 'right', fontFace: 'Calibri'
      });

      y += 0.8;
    }
  }

  private addInsights(report: SprintReport): void {
    const slide = this.prs.addSlide();
    this.addHeader(slide, '📈 INSIGHTS PRINCIPAIS');

    if (!report.insights || report.insights.length === 0) {
      const y = 2.5;
      slide.addText('Nenhum insight disponível.', {
        x: 0.5, y: y, w: 9, h: 0.5,
        fontSize: 14, color: '666666',
        align: 'center', fontFace: 'Calibri'
      });

      return;
    }

    let y = 1.5;
    for (const insight of report.insights.slice(0, 4)) {
      const categoryColor = this.getCategoryColor(insight.pattern);

      slide.addShape('rect', {
        x: 0.5, y: y, w: 9, h: 0.75,
        fill: { color: 'F5F5F5' },
        line: { color: categoryColor, width: 2 }
      });

      slide.addText(`📌 ${insight.pattern}`, {
        x: 0.7, y: y + 0.08, w: 8.6, h: 0.22,
        fontSize: 11, bold: true, color: categoryColor, fontFace: 'Calibri'
      });

      slide.addText(insight.description, {
        x: 0.7, y: y + 0.32, w: 8.6, h: 0.38,
        fontSize: 10, color: '666666', fontFace: 'Calibri'
      });

      y += 0.9;
    }
  }

  private addHeader(slide: any, title: string): void {
    slide.background = { color: 'FFFFFF' };

    // Header bar
    slide.addShape('rect', {
      x: 0, y: 0, w: 10, h: 0.9,
      fill: { color: '1F4E78' },
      line: { type: 'none' }
    });

    // Green accent line
    slide.addShape('rect', {
      x: 0, y: 0.9, w: 10, h: 0.08,
      fill: { color: '00B050' },
      line: { type: 'none' }
    });

    // Title
    slide.addText(title, {
      x: 0.5, y: 0.2, w: 9, h: 0.5,
      fontSize: 32, bold: true, color: 'FFFFFF',
      fontFace: 'Calibri', valign: 'middle'
    });
  }

  private getHealthColor(status: string): string {
    switch (status) {
      case 'excellent':
      case 'good':
        return '#00B050';
      case 'attention':
        return '#FFC000';
      case 'critical':
        return '#C00000';
      default:
        return '#4472C4';
    }
  }

  private getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      excellent: '✓ EXCELENTE',
      good: '✓ BOM',
      attention: '⚠️ ATENÇÃO',
      critical: '✗ CRÍTICO',
    };
    return labels[status] || 'DESCONHECIDO';
  }

  private getPriorityColor(priority: string): string {
    switch (priority) {
      case 'high':
        return '#C00000';
      case 'medium':
        return '#FFC000';
      case 'low':
        return '#00B050';
      default:
        return '#4472C4';
    }
  }

  private getCategoryColor(category: string): string {
    const colors: Record<string, string> = {
      quality: '#4472C4',
      performance: '#FF6B6B',
      security: '#C00000',
      testing: '#70AD47',
      deployment: '#00B050',
    };
    return colors[category.toLowerCase()] || '#4472C4';
  }

  private formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }
}
