/**
 * Value Enrichment Service — Enriquecer decisões com inteligência de negócio
 *
 * Adiciona métricas de impacto, valor e ROI a cada resposta de decisão.
 * Integra ValueIntelligenceLayer no pipeline de decisão.
 */

import { DecisionResponse, RiskLevel } from './DecisionContractV2';
import {
  ImpactCalculator,
  ValueScoreCalculator,
  BeforeAfterCalculator,
  ValueScore,
  DecisionImpact,
  BeforeAfterComparison
} from './ValueIntelligenceLayer';

// ═══════════════════════════════════════════════════════════════════
// ENRICHED DECISION RESPONSE
// ═══════════════════════════════════════════════════════════════════

export interface EnrichedDecisionResponse extends DecisionResponse {
  value: {
    // Impacto mensurável
    impact: DecisionImpact;

    // Score de negócio
    value_score: ValueScore;

    // Comparação antes/depois (se feedback disponível)
    before_after?: BeforeAfterComparison[];

    // Resumo executivo não-técnico
    executive_summary: {
      business_impact: string;      // Ex: "Saved $1.2K and 2.5 hours of engineering time"
      roi_justification: string;    // Ex: "Prevents 1 incident, saves $1.2K per execution"
      risk_assessment: string;      // Ex: "Low risk action, easily reversible"
      user_impact: string;          // Ex: "Improves experience for 5,000+ users"
    };

    // Metadata
    metadata: {
      calculated_at: Date;
      based_on_feedback: boolean;   // true = métricas reais, false = estimadas
      feedback_data_points: number; // Quantos feedbacks foram usados
    };
  };
}

// ═══════════════════════════════════════════════════════════════════
// VALUE ENRICHMENT SERVICE
// ═══════════════════════════════════════════════════════════════════

export class ValueEnrichmentService {
  /**
   * Enriquecer resposta de decisão com inteligência de valor
   */
  static enrich(
    decision: DecisionResponse,
    context: any,
    feedback?: any
  ): EnrichedDecisionResponse {
    // ────────────────────────────────────────────────────────────────────
    // CALCULAR IMPACTO
    // ────────────────────────────────────────────────────────────────────
    const impact = ImpactCalculator.calculateImpact(
      decision.decision,
      context,
      feedback
    );

    // ────────────────────────────────────────────────────────────────────
    // CALCULAR VALUE SCORE
    // ────────────────────────────────────────────────────────────────────
    const valueScore = ValueScoreCalculator.calculateValueScore(
      impact,
      decision.audit.criticality
    );

    // ────────────────────────────────────────────────────────────────────
    // COMPARAÇÃO ANTES/DEPOIS (se temos feedback)
    // ────────────────────────────────────────────────────────────────────
    let beforeAfter: BeforeAfterComparison[] | undefined;
    let basedOnFeedback = false;
    let feedbackDataPoints = 0;

    if (feedback && feedback.actual_outcome) {
      beforeAfter = BeforeAfterCalculator.compare(
        context,
        decision.decision,
        feedback
      );
      basedOnFeedback = true;
      feedbackDataPoints = Object.keys(feedback.actual_outcome).length;
    }

    // ────────────────────────────────────────────────────────────────────
    // GERAR RESUMO EXECUTIVO (não-técnico, orientado a negócio)
    // ────────────────────────────────────────────────────────────────────
    const executiveSummary = this.generateExecutiveSummary(
      impact,
      valueScore,
      decision,
      context
    );

    // ────────────────────────────────────────────────────────────────────
    // MONTAR RESPOSTA ENRIQUECIDA
    // ────────────────────────────────────────────────────────────────────
    const enriched: EnrichedDecisionResponse = {
      ...decision,
      value: {
        impact,
        value_score: valueScore,
        before_after: beforeAfter,
        executive_summary: executiveSummary,
        metadata: {
          calculated_at: new Date(),
          based_on_feedback: basedOnFeedback,
          feedback_data_points: feedbackDataPoints
        }
      }
    };

    return enriched;
  }

  /**
   * Gerar resumo executivo em linguagem de negócio
   * Sem jargão técnico, foco em impacto mensurável
   */
  private static generateExecutiveSummary(
    impact: DecisionImpact,
    _valueScore: ValueScore,
    decision: DecisionResponse,
    _context: any
  ): EnrichedDecisionResponse['value']['executive_summary'] {
    // ────────────────────────────────────────────────────────────────────
    // IMPACTO DE NEGÓCIO
    // ────────────────────────────────────────────────────────────────────
    const timeSavedHours = Math.round(impact.time_saved_minutes / 60 * 10) / 10;
    const costSaved = impact.cost_saved_usd;
    const incidentsPrevented = impact.incidents_prevented;
    const userCount = impact.users_affected_positively;

    let businessImpact = '';
    if (costSaved > 0 && timeSavedHours > 0) {
      businessImpact = `Saves $${costSaved} and ${timeSavedHours}h of engineering time`;
    } else if (costSaved > 0) {
      businessImpact = `Saves $${costSaved}`;
    } else if (timeSavedHours > 0) {
      businessImpact = `Saves ${timeSavedHours}h of engineering time`;
    } else {
      businessImpact = 'Improves operational efficiency';
    }

    if (incidentsPrevented > 0) {
      businessImpact += ` and prevents ${incidentsPrevented} incident${incidentsPrevented > 1 ? 's' : ''}`;
    }

    // ────────────────────────────────────────────────────────────────────
    // JUSTIFICATIVA ROI
    // ────────────────────────────────────────────────────────────────────
    let roiJustification = `Per execution: saves $${costSaved}`;

    if (incidentsPrevented > 0) {
      roiJustification += ` and prevents ${incidentsPrevented} incident${incidentsPrevented > 1 ? 's' : ''}`;
    }

    if (impact.performance_improvement_pct > 0) {
      roiJustification += ` with ${impact.performance_improvement_pct}% performance gain`;
    }

    // ────────────────────────────────────────────────────────────────────
    // AVALIAÇÃO DE RISCO
    // ────────────────────────────────────────────────────────────────────
    let riskAssessment = '';

    if (decision.risk.level === RiskLevel.LOW) {
      riskAssessment = 'Low risk action';
    } else if (decision.risk.level === RiskLevel.MEDIUM) {
      riskAssessment = 'Medium risk action';
    } else if (decision.risk.level === RiskLevel.HIGH) {
      riskAssessment = 'High risk action';
    } else {
      riskAssessment = 'Risk assessment pending';
    }

    if (decision.execution.mode === 'auto') {
      riskAssessment += ', auto-approved for execution';
    } else if (decision.execution.mode === 'approval_required') {
      riskAssessment += ', requires review';
    } else if (decision.execution.mode === 'blocked') {
      riskAssessment += ', blocked for execution';
    }

    // ────────────────────────────────────────────────────────────────────
    // IMPACTO EM USUÁRIOS
    // ────────────────────────────────────────────────────────────────────
    let userImpact = '';

    if (userCount > 0) {
      if (userCount > 100000) {
        userImpact = `Improves experience for ${Math.round(userCount / 1000)}K+ users`;
      } else if (userCount > 1000) {
        userImpact = `Improves experience for ${Math.round(userCount / 1000)}K users`;
      } else {
        userImpact = `Improves experience for ${userCount} users`;
      }
    } else {
      userImpact = 'Improves operational reliability';
    }

    return {
      business_impact: businessImpact,
      roi_justification: roiJustification,
      risk_assessment: riskAssessment,
      user_impact: userImpact
    };
  }

  /**
   * Enriquecer múltiplas decisões (para dashboards/relatórios)
   */
  static enrichBatch(
    decisions: DecisionResponse[],
    contexts: Record<string, any>,
    feedbacks: Record<string, any>
  ): EnrichedDecisionResponse[] {
    return decisions.map(decision => {
      const context = contexts[decision.decisionId] || {};
      const feedback = feedbacks[decision.decisionId];

      return this.enrich(decision, context, feedback);
    });
  }

  /**
   * Extrair apenas a seção de valor (para APIs minimalistas)
   */
  static extractValueSection(enriched: EnrichedDecisionResponse) {
    return enriched.value;
  }
}
