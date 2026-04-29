import { Router, Request, Response } from 'express';
import { Logger } from 'winston';
import { Pool } from 'pg';
import { Redis } from 'ioredis';
import { ProductionDecisionOrchestrator } from '../../production/ProductionDecisionOrchestrator';
import { DecisionOutput } from '../../types/DecisionOutput';

/**
 * Production Decision Routes - Demonstra orquestração completa de todos os 10 componentes
 *
 * Pipeline:
 * 1. AutonomyPolicyEngine - Verificar autonomia
 * 2. RateLimitingEngine - Verificar quotas
 * 3. BlastRadiusAnalyzer - Estimar impacto
 * 4. AnomalyGuard - Detectar anomalias
 * 5. DecisionExplainer - Gerar explicação
 * 6. SLOMonitor - Verificar SLOs
 * 7. SafeExecutionLayer - Executar com safeguards
 * 8. RollbackManager - Preparar rollback
 * 9. ShadowModeExecutor - Validar em shadow
 * 10. ChaosTestValidator - Validar resiliência
 */

export function createProductionDecisionRouter(
  pgPool: Pool,
  redis: Redis,
  logger: Logger,
  orchestrator: ProductionDecisionOrchestrator,
): Router {
  const router = Router();

  /**
   * POST /api/v1/production-decision/execute
   *
   * Orquestrar decisão completa com todos os safeguards
   *
   * Request body:
   * {
   *   "decisionId": "dec-12345",
   *   "decision": {
   *     "metadata": {
   *       "type": "observability",
   *       "criticality": "HIGH",
   *       "context": "production",
   *       "estimated_cost": 10.5
   *     },
   *     "decision": {
   *       "recommendation": "Increase monitoring thresholds by 10%"
   *     },
   *     "metrics": {
   *       "quality_score": 0.92,
   *       "risk_level": "LOW"
   *     }
   *   },
   *   "context": {
   *     "affectedServices": ["monitoring", "alerting"],
   *     "isDataModifying": false
   *   },
   *   "userId": "user-123",
   *   "executionFn": null  // Se null, não executa ação (apenas valida)
   * }
   *
   * Response:
   * {
   *   "decisionId": "dec-12345",
   *   "approved": true,
   *   "autonomyCheck": {
   *     "allowed": true,
   *     "warnings": []
   *   },
   *   "blastRadius": {
   *     "severity": "LOW",
   *     "reversible": true,
   *     "affectedUsers": 50
   *   },
   *   "anomalyDetection": {
   *     "isAnomaly": false,
   *     "anomalyScore": 0.15,
   *     "suggestedAction": "approve"
   *   },
   *   "rateLimit": {
   *     "allowed": true,
   *     "quotaRemaining": {
   *       "requestsPerHour": 85,
   *       "costPerHour": "$89.50",
   *       "tokensPerMonth": 9985000
   *     }
   *   },
   *   "execution": {
   *     "status": "completed",
   *     "result": { ... }
   *   },
   *   "sloImpact": {
   *     "meetsTargets": true,
   *     "compliancePercentage": 98.5
   *   },
   *   "shadowMode": {
   *     "executed": true,
   *     "matches": true
   *   },
   *   "warnings": [],
   *   "timestamp": "2026-04-16T10:30:00Z"
   * }
   */
  router.post('/execute', async (req: Request, res: Response) => {
    try {
      const { decisionId, decision, context, userId } = req.body;

      if (!decisionId || !decision) {
        return res.status(400).json({
          error: 'Missing required fields: decisionId, decision',
        });
      }

      logger.info('Production decision orchestration requested', {
        decisionId,
        type: decision.metadata?.type,
        criticality: decision.metadata?.criticality,
        userId,
      });

      // Orquestrar com todos os 10 componentes
      const orchestrated = await orchestrator.orchestrateDecision(
        decisionId,
        decision as DecisionOutput,
        context || {},
        userId || 'unknown',
      );

      res.json(orchestrated);
    } catch (error) {
      logger.error('Error orchestrating decision', {
        error: error instanceof Error ? error.message : 'unknown',
      });

      res.status(500).json({
        error: 'Failed to orchestrate decision',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * GET /api/v1/production-decision/validate-before-deploy/:environment
   *
   * Validar sistema antes de deploy (chaos tests + shadow mode)
   *
   * Response:
   * {
   *   "canDeploy": true,
   *   "chaosResults": {
   *     "canProceed": true,
   *     "overallScore": 0.88,
   *     "results": [ ... ],
   *     "blockers": []
   *   },
   *   "shadowHealth": {
   *     "healthScore": 0.92,
   *     "matchRate": 0.95,
   *     "errorRate": 0.02,
   *     "recommendation": "safe"
   *   },
   *   "recommendations": []
   * }
   */
  router.get('/validate-before-deploy/:environment', async (req: Request, res: Response) => {
    try {
      const { environment } = req.params;

      if (environment !== 'staging' && environment !== 'production') {
        return res.status(400).json({
          error: 'Invalid environment. Must be staging or production',
        });
      }

      logger.info('Pre-deploy validation requested', { environment });

      const validation = await orchestrator.validateBeforeDeploy(environment);

      res.json(validation);
    } catch (error) {
      logger.error('Error validating before deploy', {
        error: error instanceof Error ? error.message : 'unknown',
      });

      res.status(500).json({
        error: 'Failed to validate before deploy',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * GET /api/v1/production-decision/component/:componentName
   *
   * Acessar um componente específico para debugging/troubleshooting
   *
   * Components disponíveis:
   * - autonomyPolicyEngine
   * - blastRadiusAnalyzer
   * - safeExecutionLayer
   * - rollbackManager
   * - decisionExplainer
   * - anomalyGuard
   * - rateLimitingEngine
   * - sloMonitor
   * - chaosTestValidator
   * - shadowModeExecutor
   */
  router.get('/component/:componentName', async (req: Request, res: Response) => {
    try {
      const componentName = Array.isArray(req.params.componentName)
        ? req.params.componentName[0]
        : req.params.componentName;

      const component = orchestrator.getComponent(componentName);

      if (!component) {
        return res.status(404).json({
          error: `Component not found: ${componentName}`,
          availableComponents: [
            'autonomyPolicyEngine',
            'blastRadiusAnalyzer',
            'safeExecutionLayer',
            'rollbackManager',
            'decisionExplainer',
            'anomalyGuard',
            'rateLimitingEngine',
            'sloMonitor',
            'chaosTestValidator',
            'shadowModeExecutor',
          ],
        });
      }

      res.json({
        component: componentName,
        initialized: true,
      });
    } catch (error) {
      logger.error('Error accessing component', {
        error: error instanceof Error ? error.message : 'unknown',
      });

      res.status(500).json({
        error: 'Failed to access component',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * POST /api/v1/production-decision/validate-decision
   *
   * Validar decisão sem executar (apenas verificação de policies e anomalias)
   *
   * Request body:
   * {
   *   "decision": { ... },
   *   "context": { ... },
   *   "userId": "user-123"
   * }
   *
   * Response: OrchestratedDecision (sem execution step)
   */
  router.post('/validate-decision', async (req: Request, res: Response) => {
    try {
      const { decision, context, userId } = req.body;

      if (!decision) {
        return res.status(400).json({
          error: 'Missing required field: decision',
        });
      }

      // Orquestrar SEM executar
      const validated = await orchestrator.orchestrateDecision(
        `validate-${Date.now()}`,
        decision as DecisionOutput,
        context || {},
        userId || 'unknown',
        undefined, // Sem executionFn
      );

      res.json(validated);
    } catch (error) {
      logger.error('Error validating decision', {
        error: error instanceof Error ? error.message : 'unknown',
      });

      res.status(500).json({
        error: 'Failed to validate decision',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  return router;
}
