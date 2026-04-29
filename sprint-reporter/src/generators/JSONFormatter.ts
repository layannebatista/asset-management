import { SprintReport } from '../types/report.types';

/**
 * JSONFormatter: Formata relatório em JSON estruturado
 */
export class JSONFormatter {
  static format(report: SprintReport): string {
    return JSON.stringify(report, null, 2);
  }

  static parse(json: string): SprintReport {
    return JSON.parse(json) as SprintReport;
  }
}
