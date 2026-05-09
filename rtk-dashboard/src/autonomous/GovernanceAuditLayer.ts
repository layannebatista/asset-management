import { Logger } from 'winston';
import { Pool } from 'pg';
import { DecisionOutput, FeedbackSignal } from '../types/DecisionOutput';
import { AnalysisType } from '../types/analysis.types';

/**
 * Registro de auditoria de decisão
 */
export interface DecisionAuditRecord {
  decisionId: string;
  timestamp: Date;
  type: AnalysisType;
  criticality: string;
  userId: string;
  model: string;
  promptVersion: string;
  contextSize: number;
  qualityScore: number;
  actions: string[];
  riskLevel?: string;
  validationResult?: string;
  executed: boolean;
  executionTime?: Date;
  executionStatus?: 'success' | 'failed' | 'rolled_back';
  feedbackReceived?: boolean;
  feedbackAt?: Date;
}

/**
 * Rastreamento de alteração (versioning)
 */
export interface ChangeTracker {
  modelUsed: {
    version: string;
    changedAt: Date;
    reason: string;
  };
  promptVersion: {
    version: string;
    changedAt: Date;
    reason: string;
  };
  thresholds: {
    quality: number;
    consistency: number;
    changedAt: Date;
  };
}

/**
 * Relatório de compliance
 */
export interface ComplianceReport {
  period: { start: Date; end: Date };
  totalDecisions: number;
  decisionsByRisk: Record<string, number>;
  decisionsByType: Record<string, number>;
  executedDecisions: number;
  failedDecisions: number;
  auditTrail: DecisionAuditRecord[];
  complianceStatus: 'compliant' | 'warning' | 'non_compliant';
  issues: string[];
}

/**
 * GovernanceAuditLayer: Auditoria completa e rastreabilidade
 *
 * Responsabilidades:
 * 1. Registrar cada decisão tomada
 * 2. Rastrear modelo/prompt/contexto usado
 * 3. Rastrear aprovações e execução
 * 4. Manter trilha de auditoria completa
 * 5. Gerar relatórios de compliance
 * 6. Detectar anomalias de auditoria
 *
 * Dados rastreados:
 * - Quem: userId
 * - O quê: tipo análise, ações recomendadas
 * - Quando: timestamp, execução
 * - Por quê: risco, validação, feedback
 * - Como: modelo, prompt, contexto
 * - Resultado: qualidade, execução status
 */
export class GovernanceAuditLayer {
  private readonly pgPool: Pool;
  private readonly logger: Logger;

  constructor(pgPool: Pool, logger: Logger) {
    this.pgPool = pgPool;
    this.logger = logger;
  }

  /**
   * Registrar decisão para auditoria
   */
  async auditDecision(
    decision: DecisionOutput,
    userId: string,
    validationResult?: { isValid: boolean; violations: any[] },
  ): Promise<void> {
    try {
      const client = await this.pgPool.connect();

      try {
        const record: DecisionAuditRecord = {
          decisionId: decision.metadata.analysisId,
          timestamp: new Date(),
          type: decision.metadata.type,
          criticality: decision.metadata.criticality,
          userId,
          model: decision.metadata.model_used,
          promptVersion: 'v1.0', // TODO: obter real
          contextSize: decision.metadata.context_tokens_used,
          qualityScore: decision.metrics.quality_score,
          actions: decision.decision.actions.map((a) => a.title),
          validationResult: validationResult ? (validationResult.isValid ? 'valid' : 'invalid') : undefined,
          executed: false,
        };

        await client.query(
          `INSERT INTO decision_audit_log
          (decision_id, timestamp, analysis_type, criticality, user_id, model_used,
           prompt_version, context_size, quality_score, actions, validation_result, executed)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [
            record.decisionId,
            record.timestamp,
            record.type,
            record.criticality,
            record.userId,
            record.model,
            record.promptVersion,
            record.contextSize,
            record.qualityScore,
            JSON.stringify(record.actions),
            record.validationResult,
            record.executed,
          ],
        );

        this.logger.debug('Decision audited', {
          decisionId: decision.metadata.analysisId,
          user: userId,
          type: decision.metadata.type,
        });
      } finally {
        client.release();
      }
    } catch (error) {
      this.logger.error('Error auditing decision', {
        error: error instanceof Error ? error.message : 'unknown',
      });
      throw error;
    }
  }

  /**
   * Registrar execução de ação
   */
  async auditExecution(
    decisionId: string,
    executionStatus: 'success' | 'failed' | 'rolled_back',
    details: string,
  ): Promise<void> {
    try {
      const client = await this.pgPool.connect();

      try {
        await client.query(
          `UPDATE decision_audit_log
          SET executed = true,
              execution_time = NOW(),
              execution_status = $1,
              execution_details = $2
          WHERE decision_id = $3`,
          [executionStatus, details, decisionId],
        );

        this.logger.info('Execution audited', {
          decisionId,
          status: executionStatus,
        });
      } finally {
        client.release();
      }
    } catch (error) {
      this.logger.error('Error auditing execution', {
        error: error instanceof Error ? error.message : 'unknown',
      });
    }
  }

  /**
   * Registrar feedback recebido
   */
  async auditFeedback(feedback: FeedbackSignal): Promise<void> {
    try {
      const client = await this.pgPool.connect();

      try {
        await client.query(
          `UPDATE decision_audit_log
          SET feedback_received = true,
              feedback_at = NOW(),
              feedback_type = $1,
              feedback_details = $2
          WHERE decision_id = $3`,
          [
            feedback.feedback_type,
            JSON.stringify({
              resolved: feedback.actual_outcome?.resolved,
              impact: feedback.actual_outcome?.business_impact_score,
              notes: feedback.notes,
            }),
            feedback.decision_id,
          ],
        );

        this.logger.debug('Feedback audited', {
          decisionId: feedback.decision_id,
          type: feedback.feedback_type,
        });
      } finally {
        client.release();
      }
    } catch (error) {
      this.logger.error('Error auditing feedback', {
        error: error instanceof Error ? error.message : 'unknown',
      });
    }
  }

  /**
   * Obter trilha de auditoria para uma decisão
   */
  async getAuditTrail(decisionId: string): Promise<DecisionAuditRecord | null> {
    const client = await this.pgPool.connect();

    try {
      const result = await client.query(
        `SELECT * FROM decision_audit_log WHERE decision_id = $1`,
        [decisionId],
      );

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        decisionId: row.decision_id,
        timestamp: new Date(row.timestamp),
        type: row.analysis_type,
        criticality: row.criticality,
        userId: row.user_id,
        model: row.model_used,
        promptVersion: row.prompt_version,
        contextSize: row.context_size,
        qualityScore: row.quality_score,
        actions: row.actions || [],
        riskLevel: row.risk_level,
        validationResult: row.validation_result,
        executed: row.executed,
        executionTime: row.execution_time ? new Date(row.execution_time) : undefined,
        executionStatus: row.execution_status,
        feedbackReceived: row.feedback_received,
        feedbackAt: row.feedback_at ? new Date(row.feedback_at) : undefined,
      };
    } finally {
      client.release();
    }
  }

  /**
   * Gerar relatório de compliance
   */
  async generateComplianceReport(startDate: Date, endDate: Date): Promise<ComplianceReport> {
    const client = await this.pgPool.connect();

    try {
      // Contar decisões
      const countResult = await client.query(
        `SELECT
          COUNT(*) as total,
          analysis_type,
          criticality,
          CASE WHEN execution_status = 'failed' THEN 1 ELSE 0 END as failed
        FROM decision_audit_log
        WHERE timestamp BETWEEN $1 AND $2
        GROUP BY analysis_type, criticality, execution_status`,
        [startDate, endDate],
      );

      const decisionsByType: Record<string, number> = {};
      const decisionsByRisk: Record<string, number> = {};
      let totalDecisions = 0;
      let failedDecisions = 0;
      let executedDecisions = 0;

      for (const row of countResult.rows) {
        totalDecisions += parseInt(row.total);
        if (row.failed) failedDecisions += parseInt(row.failed);
        if (row.executed) executedDecisions += parseInt(row.total);
        decisionsByType[row.analysis_type] = (decisionsByType[row.analysis_type] || 0) + parseInt(row.total);
        decisionsByRisk[row.criticality] = (decisionsByRisk[row.criticality] || 0) + parseInt(row.total);
      }

      // Obter auditoria
      const auditResult = await client.query(
        `SELECT * FROM decision_audit_log
        WHERE timestamp BETWEEN $1 AND $2
        ORDER BY timestamp DESC`,
        [startDate, endDate],
      );

      const auditTrail = auditResult.rows.map((row) => ({
        decisionId: row.decision_id,
        timestamp: new Date(row.timestamp),
        type: row.analysis_type,
        criticality: row.criticality,
        userId: row.user_id,
        model: row.model_used,
        promptVersion: row.prompt_version,
        contextSize: row.context_size,
        qualityScore: row.quality_score,
        actions: row.actions || [],
        executed: row.executed,
        executionStatus: row.execution_status,
      }));

      // Detectar problemas de compliance
      const issues: string[] = [];

      if (failedDecisions / totalDecisions > 0.05) {
        issues.push(`High failure rate: ${((failedDecisions / totalDecisions) * 100).toFixed(1)}%`);
      }

      if (!auditTrail.every((a) => a.userId)) {
        issues.push('Some decisions missing user attribution');
      }

      const complianceStatus = issues.length === 0 ? 'compliant' : issues.length <= 2 ? 'warning' : 'non_compliant';

      return {
        period: { start: startDate, end: endDate },
        totalDecisions,
        decisionsByRisk,
        decisionsByType,
        executedDecisions,
        failedDecisions,
        auditTrail,
        complianceStatus,
        issues,
      };
    } finally {
      client.release();
    }
  }

  /**
   * Exportar auditoria em formato seguro
   */
  async exportAuditLog(startDate: Date, endDate: Date, format: 'json' | 'csv' = 'json'): Promise<string> {
    const client = await this.pgPool.connect();

    try {
      const result = await client.query(
        `SELECT
          decision_id,
          timestamp,
          analysis_type,
          criticality,
          user_id,
          model_used,
          prompt_version,
          quality_score,
          executed,
          execution_status,
          feedback_received
        FROM decision_audit_log
        WHERE timestamp BETWEEN $1 AND $2
        ORDER BY timestamp ASC`,
        [startDate, endDate],
      );

      if (format === 'csv') {
        const headers = [
          'Decision ID',
          'Timestamp',
          'Type',
          'Criticality',
          'User',
          'Model',
          'Prompt Version',
          'Quality',
          'Executed',
          'Status',
          'Feedback',
        ];

        const rows = result.rows.map((row) =>
          [
            row.decision_id,
            row.timestamp,
            row.analysis_type,
            row.criticality,
            row.user_id,
            row.model_used,
            row.prompt_version,
            row.quality_score,
            row.executed,
            row.execution_status,
            row.feedback_received,
          ].join(','),
        );

        return [headers.join(','), ...rows].join('\n');
      }

      return JSON.stringify(result.rows, null, 2);
    } finally {
      client.release();
    }
  }

  /**
   * Detectar anomalias de auditoria
   */
  async detectAuditAnomalies(analysisType: AnalysisType, days: number = 30): Promise<
    Array<{
      anomalyType: string;
      severity: 'low' | 'medium' | 'high';
      description: string;
      affectedCount: number;
    }>
  > {
    const anomalies: Array<{
      anomalyType: string;
      severity: 'low' | 'medium' | 'high';
      description: string;
      affectedCount: number;
    }> = [];

    const client = await this.pgPool.connect();

    try {
      // Detectar decisões sem feedback (can indicate disengagement)
      const noFeedbackResult = await client.query(
        `SELECT COUNT(*) as count
        FROM decision_audit_log
        WHERE analysis_type = $1
        AND timestamp > NOW() - INTERVAL '${days} days'
        AND executed = true
        AND feedback_received = false`,
        [analysisType],
      );

      if (noFeedbackResult.rows[0].count > 10) {
        anomalies.push({
          anomalyType: 'Low feedback rate',
          severity: 'medium',
          description: `${noFeedbackResult.rows[0].count} executed decisions without feedback`,
          affectedCount: noFeedbackResult.rows[0].count,
        });
      }

      // Detectar baixa qualidade consistente
      const lowQualityResult = await client.query(
        `SELECT COUNT(*) as count
        FROM decision_audit_log
        WHERE analysis_type = $1
        AND timestamp > NOW() - INTERVAL '${days} days'
        AND quality_score < 0.6`,
        [analysisType],
      );

      if (lowQualityResult.rows[0].count > 20) {
        anomalies.push({
          anomalyType: 'Consistently low quality',
          severity: 'high',
          description: `${lowQualityResult.rows[0].count} decisions below quality threshold`,
          affectedCount: lowQualityResult.rows[0].count,
        });
      }

      return anomalies;
    } finally {
      client.release();
    }
  }
}
