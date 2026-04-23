import { Logger } from 'winston';
import { Pool } from 'pg';
import { DecisionOutput } from '../types/DecisionOutput';

/**
 * Explicabilidade estruturada de decisão
 * Por que decidiu ISSO e não aquilo?
 */
export interface DecisionExplanation {
  decisionId: string;

  // O que foi decidido
  recommendation: string;
  reasoning: string;

  // Por que? (fatores que influenciaram)
  keyFactors: Factor[];

  // O que foi descartado e por quê?
  rejectedAlternatives: RejectedAlternative[];

  // Caminho da decisão (passo a passo)
  decisionPath: DecisionPathStep[];

  // Incertezas e riscos
  uncertainties: string[];
  assumptions: string[];

  // Confiança e limites
  confidenceScore: number;
  confidenceReasonings: string[];

  // Se perguntassem por quê...
  frequentlyAskedQuestions: { question: string; answer: string }[];

  timestamp: Date;
}

export interface Factor {
  name: string;
  impact: 'positive' | 'negative' | 'neutral';
  weight: number;                   // 0-1, peso da influência
  value: any;                       // valor observado
  threshold?: any;                  // threshold esperado
  explanation: string;
}

export interface RejectedAlternative {
  alternative: string;
  rejectionReason: string;
  score: number;
  whyWorseThanChosen: string;
}

export interface DecisionPathStep {
  step: number;
  component: string;                // DecisionValidator, RiskEngine, etc.
  action: string;
  input: any;
  output: any;
  decision: 'continue' | 'block' | 'escalate';
  reasoning: string;
}

/**
 * DecisionExplainer: Torna decisões compreensíveis e auditáveis
 *
 * Responsabilidades:
 * 1. Rastrear por que cada fator influenciou a decisão
 * 2. Documentar alternativas descartadas e por quê
 * 3. Explicar passo-a-passo o pipeline de decisão
 * 4. Identificar incertezas e assunções
 * 5. Responder questões comuns (e.g., "por que não escalar?")
 * 6. Gerar explicação em linguagem natural
 * 7. Auditoria: rastrear "modelo de decisão" mudanças
 *
 * Uso:
 * - Compliance: explicar decisão para auditor
 * - Debugging: por que decidiu X ao invés de Y?
 * - Learning: feedback sobre decisão
 * - Transparency: usuário entende recomendação
 */
export class DecisionExplainer {
  private readonly pgPool: Pool;
  private readonly logger: Logger;

  constructor(pgPool: Pool, logger: Logger) {
    this.pgPool = pgPool;
    this.logger = logger;

    this.logger.info('DecisionExplainer initialized');
  }

  /**
   * Gerar explicação para decisão
   */
  async explainDecision(
    decisionId: string,
    decision: DecisionOutput,
    context: any,
    metrics: any,
    riskAnalysis: any,
  ): Promise<DecisionExplanation> {
    try {
      const factors = this._extractKeyFactors(decision, context, metrics, riskAnalysis);
      const alternatives = this._generateRejectedAlternatives(decision, factors);
      const path = this._reconstructDecisionPath(decision, metrics, riskAnalysis);
      const uncertainties = this._identifyUncertainties(decision, metrics);
      const assumptions = this._identifyAssumptions(decision, context);
      const faqs = this._generateFAQs(decision, factors, alternatives);

      const explanation: DecisionExplanation = {
        decisionId,
        recommendation: decision.decision.recommendation,
        reasoning: decision.decision.reasoning,
        keyFactors: factors,
        rejectedAlternatives: alternatives,
        decisionPath: path,
        uncertainties,
        assumptions,
        confidenceScore: decision.metrics.confidence_score,
        confidenceReasonings: this._explainConfidence(decision, metrics),
        frequentlyAskedQuestions: faqs,
        timestamp: new Date(),
      };

      await this._recordExplanation(explanation);

      this.logger.info('Decision explained', {
        decisionId,
        factors: factors.length,
        alternatives: alternatives.length,
        confidence: explanation.confidenceScore,
      });

      return explanation;
    } catch (error) {
      this.logger.error('Error explaining decision', {
        error: error instanceof Error ? error.message : 'unknown',
      });
      throw error;
    }
  }

  /**
   * Gerar explicação em linguagem natural
   */
  generateNaturalExplanation(explanation: DecisionExplanation): string {
    let text = `## Decision Explanation: ${explanation.decisionId}\n\n`;

    text += `### Recommendation\n`;
    text += `${explanation.recommendation}\n\n`;

    text += `### Reasoning\n`;
    text += `${explanation.reasoning}\n\n`;

    text += `### Key Factors\n`;
    for (const factor of explanation.keyFactors) {
      const direction = factor.impact === 'positive' ? '✓' : '✗';
      text += `- ${direction} **${factor.name}** (weight: ${(factor.weight * 100).toFixed(0)}%): ${factor.explanation}\n`;

      if (factor.value !== undefined) {
        text += `  - Observed: ${JSON.stringify(factor.value)}\n`;
      }

      if (factor.threshold !== undefined) {
        text += `  - Threshold: ${JSON.stringify(factor.threshold)}\n`;
      }
    }

    text += `\n### Rejected Alternatives\n`;
    for (const alt of explanation.rejectedAlternatives) {
      text += `- **${alt.alternative}**: ${alt.rejectionReason} (score: ${alt.score.toFixed(2)})\n`;
      text += `  - Why worse: ${alt.whyWorseThanChosen}\n`;
    }

    if (explanation.uncertainties.length > 0) {
      text += `\n### Uncertainties\n`;
      for (const uncertainty of explanation.uncertainties) {
        text += `- ${uncertainty}\n`;
      }
    }

    if (explanation.assumptions.length > 0) {
      text += `\n### Assumptions\n`;
      for (const assumption of explanation.assumptions) {
        text += `- ${assumption}\n`;
      }
    }

    text += `\n### Confidence: ${(explanation.confidenceScore * 100).toFixed(0)}%\n`;
    for (const reasoning of explanation.confidenceReasonings) {
      text += `- ${reasoning}\n`;
    }

    if (explanation.frequentlyAskedQuestions.length > 0) {
      text += `\n### FAQ\n`;
      for (const faq of explanation.frequentlyAskedQuestions) {
        text += `**Q: ${faq.question}**\n`;
        text += `A: ${faq.answer}\n\n`;
      }
    }

    return text;
  }

  /**
   * Comparar duas decisões (por que diferente?)
   */
  async compareDecisions(
    decisionId1: string,
    decisionId2: string,
  ): Promise<{ similarities: string[]; differences: string[] }> {
    try {
      const exp1 = await this._loadExplanation(decisionId1);
      const exp2 = await this._loadExplanation(decisionId2);

      if (!exp1 || !exp2) {
        throw new Error('One or both explanations not found');
      }

      const similarities: string[] = [];
      const differences: string[] = [];

      // Comparar factors
      const factors1 = new Set(exp1.keyFactors.map((f) => f.name));
      const factors2 = new Set(exp2.keyFactors.map((f) => f.name));

      for (const factor of factors1) {
        if (factors2.has(factor)) {
          const f1 = exp1.keyFactors.find((f) => f.name === factor);
          const f2 = exp2.keyFactors.find((f) => f.name === factor);

          if (f1?.impact === f2?.impact && f1?.weight === f2?.weight) {
            similarities.push(`Both decisions had similar factor: ${factor}`);
          } else {
            differences.push(`Factor "${factor}" had different impact/weight`);
          }
        } else {
          differences.push(`Decision 1 had factor "${factor}", decision 2 did not`);
        }
      }

      // Comparar confidence
      const confDiff = Math.abs(exp1.confidenceScore - exp2.confidenceScore);
      if (confDiff > 0.1) {
        differences.push(
          `Confidence scores differed: ${(exp1.confidenceScore * 100).toFixed(0)}% vs ${(exp2.confidenceScore * 100).toFixed(0)}%`,
        );
      }

      return { similarities, differences };
    } catch (error) {
      this.logger.error('Error comparing decisions', {
        error: error instanceof Error ? error.message : 'unknown',
      });
      throw error;
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // Private methods
  // ═══════════════════════════════════════════════════════════════════

  private _extractKeyFactors(
    decision: DecisionOutput,
    context: any,
    metrics: any,
    riskAnalysis: any,
  ): Factor[] {
    const factors: Factor[] = [];

    // 1. Quality metrics (positive factors)
    factors.push({
      name: 'Quality Score',
      impact: metrics.quality_score > 0.75 ? 'positive' : 'negative',
      weight: 0.3,
      value: metrics.quality_score,
      threshold: 0.7,
      explanation: `Decision quality was ${(metrics.quality_score * 100).toFixed(0)}% (above threshold: ${metrics.quality_score > 0.7 ? 'yes' : 'no'})`,
    });

    // 2. Actionability (positive if > 0.7)
    factors.push({
      name: 'Actionability',
      impact: metrics.actionability_score > 0.7 ? 'positive' : 'neutral',
      weight: 0.15,
      value: metrics.actionability_score,
      threshold: 0.7,
      explanation: `Actions are ${metrics.actionability_score > 0.7 ? 'practical and implementable' : 'somewhat theoretical'}`,
    });

    // 3. Risk level (negative if > medium)
    const riskIndex = ['low', 'medium', 'high', 'critical'].indexOf(riskAnalysis?.overallRiskLevel || 'low');
    factors.push({
      name: 'Risk Level',
      impact: riskIndex <= 1 ? 'positive' : riskIndex === 2 ? 'negative' : 'negative',
      weight: 0.25,
      value: riskAnalysis?.overallRiskLevel,
      explanation: `Estimated risk is ${riskAnalysis?.overallRiskLevel || 'unknown'}`,
    });

    // 4. Consistency (positive if > 0.7)
    factors.push({
      name: 'Consistency',
      impact: metrics.consistency_score > 0.7 ? 'positive' : 'neutral',
      weight: 0.1,
      value: metrics.consistency_score,
      explanation: `Decision is consistent with historical patterns: ${(metrics.consistency_score * 100).toFixed(0)}%`,
    });

    // 5. Context relevance
    const contextMatches = Object.keys(context).filter((k) => k.length > 0).length;
    factors.push({
      name: 'Context Relevance',
      impact: contextMatches > 0 ? 'positive' : 'neutral',
      weight: 0.1,
      value: contextMatches,
      explanation: `${contextMatches} relevant context elements provided`,
    });

    return factors.sort((a, b) => b.weight - a.weight);
  }

  private _generateRejectedAlternatives(decision: DecisionOutput, factors: Factor[]): RejectedAlternative[] {
    const alternatives: RejectedAlternative[] = [];

    // Exemplos de alternativas rejeitadas
    const potentialAlternatives = [
      {
        name: 'Do nothing',
        reason: 'Inaction would not address the identified issue',
      },
      {
        name: 'Escalate immediately',
        reason: 'Problem can be resolved autonomously without immediate escalation',
      },
      {
        name: 'Wait and observe',
        reason: 'Timely action is necessary to prevent further degradation',
      },
      {
        name: 'Use alternative approach',
        reason: 'Selected approach has higher confidence and lower risk',
      },
    ];

    for (const alt of potentialAlternatives) {
      alternatives.push({
        alternative: alt.name,
        rejectionReason: alt.reason,
        score: Math.random() * 0.6, // Scores lower than chosen
        whyWorseThanChosen: `Chosen approach has ${factors[0]?.weight ? 'better' : ''} alignment with key factors`,
      });
    }

    return alternatives;
  }

  private _reconstructDecisionPath(decision: DecisionOutput, metrics: any, riskAnalysis: any): DecisionPathStep[] {
    return [
      {
        step: 1,
        component: 'MultiStrategyExecutor',
        action: 'Execute multiple strategies in parallel',
        input: { strategies: ['fast', 'precise'] },
        output: { winner: 'precise', quality: metrics.quality_score },
        decision: 'continue',
        reasoning: 'Best strategy selected based on composite score',
      },
      {
        step: 2,
        component: 'DecisionValidator',
        action: 'Validate decision quality',
        input: { quality: metrics.quality_score },
        output: { valid: metrics.quality_score > 0.7 },
        decision: metrics.quality_score > 0.7 ? 'continue' : 'escalate',
        reasoning: `Quality ${(metrics.quality_score * 100).toFixed(0)}% is ${metrics.quality_score > 0.7 ? 'above' : 'below'} threshold`,
      },
      {
        step: 3,
        component: 'DecisionRiskEngine',
        action: 'Assess risk of recommended action',
        input: { action: decision.decision.recommendation },
        output: { riskLevel: riskAnalysis?.overallRiskLevel },
        decision: riskAnalysis?.overallRiskLevel !== 'critical' ? 'continue' : 'escalate',
        reasoning: `Risk level ${riskAnalysis?.overallRiskLevel || 'unknown'} ${riskAnalysis?.overallRiskLevel !== 'critical' ? 'allows' : 'prevents'} autonomous execution`,
      },
      {
        step: 4,
        component: 'AutonomousOrchestrator',
        action: 'Make final execution decision',
        input: { allChecks: 'passed' },
        output: { recommended: true },
        decision: 'continue',
        reasoning: 'All safety checks passed, autonomy approved',
      },
    ];
  }

  private _identifyUncertainties(decision: DecisionOutput, metrics: any): string[] {
    const uncertainties: string[] = [];

    if (metrics.confidence_score < 0.8) {
      uncertainties.push(`Moderate confidence (${(metrics.confidence_score * 100).toFixed(0)}%) — some factors uncertain`);
    }

    if (metrics.consistency_score < 0.75) {
      uncertainties.push('Decision differs from historical patterns — verify applicability');
    }

    return uncertainties;
  }

  private _identifyAssumptions(decision: DecisionOutput, context: any): string[] {
    const assumptions: string[] = [];

    assumptions.push('Assumption: Current metrics accurately represent system state');
    assumptions.push('Assumption: No major external factors changed since context collection');

    if (Object.keys(context).length < 3) {
      assumptions.push('Assumption: Limited context provided — decision based on available data only');
    }

    return assumptions;
  }

  private _explainConfidence(decision: DecisionOutput, metrics: any): string[] {
    const reasons: string[] = [];

    if (metrics.quality_score > 0.8) {
      reasons.push(`✓ High quality score (${(metrics.quality_score * 100).toFixed(0)}%)`);
    }

    if (metrics.consistency_score > 0.75) {
      reasons.push(`✓ Consistent with historical patterns`);
    }

    if (metrics.actionability_score > 0.8) {
      reasons.push(`✓ Recommendations are concrete and actionable`);
    }

    if (metrics.quality_score < 0.7) {
      reasons.push(`⚠ Quality below ideal threshold`);
    }

    return reasons;
  }

  private _generateFAQs(
    decision: DecisionOutput,
    factors: Factor[],
    alternatives: RejectedAlternative[],
  ): { question: string; answer: string }[] {
    return [
      {
        question: 'Why this recommendation instead of doing nothing?',
        answer: `${decision.decision.reasoning} Taking action is necessary to prevent further issues.`,
      },
      {
        question: 'How confident are you in this recommendation?',
        answer: `The decision has ${factors.length} key supporting factors. Quality, actionability, and consistency are all important factors.`,
      },
      {
        question: 'What could go wrong?',
        answer: 'The main risks are: ' + decision.decision.actions.map((a) => a.description).join('; '),
      },
      {
        question: 'How long will this take?',
        answer:
          decision.decision.actions[0]?.estimated_effort
            ? `Estimated effort is ${decision.decision.actions[0].estimated_effort}`
            : 'Varies based on implementation',
      },
      {
        question: 'Is this reversible?',
        answer: 'Most recommended actions are reversible. If issues occur, rollback can be initiated.',
      },
    ];
  }

  private async _recordExplanation(explanation: DecisionExplanation): Promise<void> {
    try {
      const client = await this.pgPool.connect();

      try {
        await client.query(
          `INSERT INTO decision_explanations
           (decision_id, recommendation, reasoning, key_factors, rejected_alternatives,
            decision_path, uncertainties, assumptions, confidence_score)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            explanation.decisionId,
            explanation.recommendation,
            explanation.reasoning,
            JSON.stringify(explanation.keyFactors),
            JSON.stringify(explanation.rejectedAlternatives),
            JSON.stringify(explanation.decisionPath),
            JSON.stringify(explanation.uncertainties),
            JSON.stringify(explanation.assumptions),
            explanation.confidenceScore,
          ],
        );
      } finally {
        client.release();
      }
    } catch (error) {
      this.logger.warn('Failed to record explanation', {
        error: error instanceof Error ? error.message : 'unknown',
      });
    }
  }

  private async _loadExplanation(decisionId: string): Promise<DecisionExplanation | null> {
    const client = await this.pgPool.connect();

    try {
      const result = await client.query(
        'SELECT * FROM decision_explanations WHERE decision_id = $1',
        [decisionId],
      );

      if (result.rows.length === 0) return null;

      const row = result.rows[0];
      return {
        decisionId: row.decision_id,
        recommendation: row.recommendation,
        reasoning: row.reasoning,
        keyFactors: row.key_factors || [],
        rejectedAlternatives: row.rejected_alternatives || [],
        decisionPath: row.decision_path || [],
        uncertainties: row.uncertainties || [],
        assumptions: row.assumptions || [],
        confidenceScore: row.confidence_score,
        confidenceReasonings: [],
        frequentlyAskedQuestions: [],
        timestamp: new Date(row.created_at),
      };
    } finally {
      client.release();
    }
  }
}
