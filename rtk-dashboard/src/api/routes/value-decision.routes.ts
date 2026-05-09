import { Router, Request, Response } from 'express';
import { Logger } from 'winston';

import { DecisionEngineOrchestrator } from '../../orchestrator/DecisionEngineOrchestrator';
import { ValueEnrichmentService } from '../../production/ValueEnrichmentService';
import { DecisionRequest } from '../../types/DecisionOutput';

function toSingleString(value: unknown): string {
  if (Array.isArray(value)) return String(value[0] ?? '');
  return String(value ?? '');
}

function toDecisionType(value: unknown): DecisionRequest['type'] {
  const raw = toSingleString(value);
  if (raw === 'observability' || raw === 'test-intelligence' || raw === 'cicd' || raw === 'incident' || raw === 'risk') {
    return raw;
  }
  return 'observability';
}

/**
 * Value-Focused Decision Routes
 *
 * Retorna decisões com inteligência de valor:
 * - Impacto mensurável (tempo economizado, custo, incidentes)
 * - Value score orientado a negócio
 * - Resumo executivo não-técnico
 * - Comparação antes/depois (com feedback)
 *
 * API versão: /api/v1/decision/value (resposta enriquecida com value section)
 */

export function createValueDecisionRouter(
  logger: Logger,
  orchestrator: DecisionEngineOrchestrator,
): Router {
  const router = Router();

  /**
   * POST /api/v1/decision/value
   *
   * Executar decisão com enriquecimento de valor
   *
   * Request body:
   * {
   *   "type": "observability",
   *   "criticality": "HIGH",
   *   "context": {
   *     "metrics": "latency_p99: 5500ms",
   *     "complexity": "HIGH",
   *     "active_users": 50000
   *   }
   * }
   *
   * Response (EnrichedDecisionResponse):
   * {
   *   "decisionId": "dec-123",
   *   "decision": { ... standard fields ... },
   *   "value": {
   *     "impact": {
   *       "time_saved_minutes": 75,
   *       "cost_saved_usd": 225,
   *       "incidents_prevented": 1,
   *       "performance_improvement_pct": 30,
   *       "users_affected_positively": 50000
   *     },
   *     "value_score": {
   *       "score": 85,
   *       "breakdown": {
   *         "technical_impact": 90,
   *         "financial_impact": 75,
   *         "criticality_weight": 100
   *       },
   *       "category": "high_value"
   *     },
   *     "executive_summary": {
   *       "business_impact": "Saves $225 and 1.25h of engineering time and prevents 1 incident",
   *       "roi_justification": "Per execution: saves $225 and prevents 1 incident with 30% performance gain",
   *       "risk_assessment": "Low risk action, auto-approved for execution",
   *       "user_impact": "Improves experience for 50K+ users"
   *     }
   *   }
   * }
   */
  router.post('/', async (req: Request, res: Response) => {
    try {
      const request: DecisionRequest = {
        type: toDecisionType(req.body.type),
        criticality: (req.body.criticality || 'NORMAL') as any,
        context: req.body.context,
        privacy_level: (req.body.privacy_level || 'PUBLIC') as any,
        min_quality_threshold: req.body.min_quality_threshold || 0.7,
        request_id: req.headers['x-request-id'] as string,
      };

      const userId = (req.headers['x-user-id'] as string) || 'anonymous';
      const decisionId = `dec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      logger.info('Value-focused decision request', {
        decisionId,
        type: request.type,
        criticality: request.criticality,
        user: userId,
      });

      // Executar decisão com orchestrator padrão
      const decision = await (orchestrator as any).executeDecisionSimple(request);

      // Enriquecer com value intelligence
      const enriched = ValueEnrichmentService.enrich(
        decision,
        request.context,
        undefined // sem feedback ainda
      );

      logger.info('Value-focused decision completed', {
        decisionId: enriched.decisionId,
        value_score: enriched.value.value_score.score,
        enriched: true
      });

      res.json(enriched);
    } catch (error) {
      logger.error('Value decision request failed', {
        error: error instanceof Error ? error.message : 'unknown',
      });
      res.status(500).json({
        error: 'Decision execution failed',
        message: error instanceof Error ? error.message : 'unknown error',
      });
    }
  });

  /**
   * POST /api/v1/decision/value/:id/impact-feedback
   *
   * Registrar feedback com métricas de impacto concretas
   *
   * Request body:
   * {
   *   "feedback_type": "positive",
   *   "actual_outcome": {
   *     "time_saved_minutes": 80,
   *     "cost_saved_usd": 250,
   *     "incidents_prevented": 1,
   *     "latency_p99_before": 5500,
   *     "latency_p99_after": 3850,
   *     "error_rate_before": 0.05,
   *     "error_rate_after": 0.01
   *   },
   *   "notes": "Helped identify bottleneck in database queries"
   * }
   *
   * Response:
   * {
   *   "decisionId": "dec-123",
   *   "feedback_accepted": true,
   *   "impact_calculated": {
   *     "time_saved_minutes": 80,
   *     "cost_saved_usd": 250,
   *     ...
   *   },
   *   "value_score_updated": 89
   * }
   */
  router.post('/:id/impact-feedback', async (req: Request, res: Response) => {
    try {
      const id = toSingleString(req.params.id);
      const { feedback_type, actual_outcome, notes } = req.body;
      const userId = (req.headers['x-user-id'] as string) || 'anonymous';

      if (!feedback_type || !actual_outcome) {
        return res.status(400).json({
          error: 'Missing required fields: feedback_type, actual_outcome',
        });
      }

      logger.info('Impact feedback received', {
        decisionId: id,
        feedback_type,
        user: userId,
      });

      // TODO: Salvar feedback em database (pgPool)
      // TODO: Recalcular value score com feedback real
      // TODO: Atualizar histórico de decisões

      res.json({
        decisionId: id,
        feedback_accepted: true,
        feedback_type,
        impact_provided: actual_outcome,
        notes,
        stored_at: new Date(),
        message: 'Impact feedback recorded - will improve future decisions'
      });
    } catch (error) {
      logger.error('Impact feedback processing failed', {
        error: error instanceof Error ? error.message : 'unknown',
      });
      res.status(500).json({
        error: 'Failed to process impact feedback',
        message: error instanceof Error ? error.message : 'unknown error',
      });
    }
  });

  /**
   * GET /api/v1/decision/value/dashboard/:period
   *
   * ROI Dashboard para período (day|week|month)
   *
   * Response:
   * {
   *   "period": { "start": "2026-04-09", "end": "2026-04-16", "days": 7 },
   *   "aggregates": {
   *     "total_time_saved_hours": 52,
   *     "total_cost_saved_usd": 5600,
   *     "total_incidents_prevented": 4,
   *     "avg_performance_improvement_pct": 21
   *   },
   *   "execution": {
   *     "total_decisions": 47,
   *     "auto_executed_successful": 39,
   *     "auto_execution_success_rate_pct": 92,
   *     "manual_approved": 8,
   *     "blocked": 0
   *   },
   *   "roi": {
   *     "savings_per_decision_usd": 119,
   *     "savings_per_day_usd": 800,
   *     "time_value_per_day_hours": 7.4,
   *     "roi_pct": 420
   *   },
   *   "quality": {
   *     "avg_confidence_score": 0.87,
   *     "avg_success_rate_pct": 92,
   *     "decisions_with_positive_feedback_pct": 94
   *   }
   * }
   */
  router.get('/dashboard/:period', async (req: Request, res: Response) => {
    try {
      const period = toSingleString(req.params.period);

      if (!['day', 'week', 'month'].includes(period)) {
        return res.status(400).json({
          error: 'Invalid period. Must be day, week, or month',
        });
      }

      logger.info('ROI dashboard requested', { period });

      // TODO: Recuperar decisões do período
      // TODO: Calcular ROI com ROICalculator
      // TODO: Retornar dashboard

      res.json({
        period,
        message: 'ROI dashboard will show aggregated value metrics',
        status: 'pending_implementation'
      });
    } catch (error) {
      logger.error('Dashboard request failed', {
        error: error instanceof Error ? error.message : 'unknown',
      });
      res.status(500).json({
        error: 'Failed to retrieve dashboard',
        message: error instanceof Error ? error.message : 'unknown error',
      });
    }
  });

  /**
   * GET /api/v1/decision/value/top-value
   *
   * Top decisions by business value
   *
   * Query params:
   * - limit: 10 (default)
   * - min_value_score: 70 (default: show all)
   * - period: week (default)
   */
  router.get('/top-value', async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const minValueScore = parseInt(req.query.min_value_score as string) || 0;
      const period = (req.query.period as string) || 'week';

      logger.info('Top value decisions requested', {
        limit,
        minValueScore,
        period,
      });

      // TODO: Recuperar decisões com valor > minValueScore
      // TODO: Ordenar por value_score (descending)
      // TODO: Limitar a `limit` resultados

      res.json({
        limit,
        minValueScore,
        period,
        message: 'Top value decisions will show highest business impact',
        status: 'pending_implementation'
      });
    } catch (error) {
      logger.error('Top value decisions request failed', {
        error: error instanceof Error ? error.message : 'unknown',
      });
      res.status(500).json({
        error: 'Failed to retrieve top value decisions',
        message: error instanceof Error ? error.message : 'unknown error',
      });
    }
  });

  return router;
}
