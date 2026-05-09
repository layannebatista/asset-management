import { Logger } from 'winston';
import { PrivacyClassifier, MaskingConfig } from '../privacy/PrivacyClassifier';
import { ModelRouter, RoutingContext } from '../routing/ModelRouter';
import { FeedbackProcessor } from '../feedback/FeedbackProcessor';
import { AIMetricsCollector } from '../observability/AIMetricsCollector';
import { AgentGraphExecutor, AgentNode } from '../agents/AgentGraphExecutor';
import { DecisionOutput, DecisionRequest, DecisionMetrics, FeedbackSignal } from '../types/DecisionOutput';
import { v4 as uuidv4 } from 'uuid';

export class DecisionEngineOrchestrator {
  private readonly logger: Logger;
  private readonly privacyClassifier: PrivacyClassifier;
  private readonly modelRouter: ModelRouter;
  private readonly feedbackProcessor: FeedbackProcessor;
  private readonly metricsCollector: AIMetricsCollector;
  private readonly agentExecutor: AgentGraphExecutor;

  constructor(
    logger: Logger,
    privacyClassifier: PrivacyClassifier,
    modelRouter: ModelRouter,
    feedbackProcessor: FeedbackProcessor,
    metricsCollector: AIMetricsCollector,
    agentExecutor: AgentGraphExecutor
  ) {
    this.logger = logger;
    this.privacyClassifier = privacyClassifier;
    this.modelRouter = modelRouter;
    this.feedbackProcessor = feedbackProcessor;
    this.metricsCollector = metricsCollector;
    this.agentExecutor = agentExecutor;
  }

  /**
   * Fluxo principal com todas as guardrails
   */
  async executeDecision(request: DecisionRequest): Promise<DecisionOutput> {
    const start = Date.now();
    const request_id = request.request_id || uuidv4();
    const decision_id = `dec-${request.type}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    this.logger.info('Decision request received', {
      request_id,
      decision_id,
      type: request.type,
      criticality: request.criticality,
    });

    try {
      // 1. CLASSIFICAR SENSIBILIDADE
      const classification = this.privacyClassifier.classify(request.context);

      // 2. APLICAR MASKING SE NECESSÁRIO
      let context_to_process = request.context;
      if (classification.requires_masking) {
        context_to_process = this.privacyClassifier.mask(request.context, {
          data_types_to_mask: classification.detected_data_types,
          masking_strategy: 'hash',
          preserve_structure: true,
        });
        this.logger.info('Context masked before processing', {
          decision_id,
          original_size_chars: JSON.stringify(request.context).length,
          masked_size_chars: JSON.stringify(context_to_process).length,
        });
      }

      // 3. ROTEAR MODELO
      const routing_context: RoutingContext = {
        analysis_type: request.type,
        criticality: request.criticality,
        context_size: JSON.stringify(context_to_process).length,
        privacy_level: classification.level,
        has_pii: classification.pii_detected,
      };

      const routing = await this.modelRouter.route(routing_context);

      this.logger.info('Model routed', {
        decision_id,
        primary_model: routing.primary_model,
        privacy_level: classification.level,
        requires_local: this.privacyClassifier.shouldUseLocalModel(classification),
      });

      // 4. EXECUTAR COM AGENTES (se disponível)
      const agent_results = await this.agentExecutor.execute(context_to_process);

      // 5. CRIAR DECISÃO (mockada aqui - integraria com LLM real)
      const decision = this.createMockDecision(
        decision_id,
        request_id,
        request,
        routing,
        agent_results.execution_trace.length,
        JSON.stringify(context_to_process).length
      );

      // 6. REGISTRAR MÉTRICA
      const execution_time = Date.now() - start;
      this.metricsCollector.recordDecision(decision, execution_time, routing.estimated_cost);

      // 7. VERIFICAR SE PRECISA REPROCESSAR
      if (decision.metrics.quality_score < (request.min_quality_threshold || 0.7)) {
        this.logger.warn('Quality below threshold, would trigger reprocess', {
          decision_id,
          quality: decision.metrics.quality_score,
          threshold: request.min_quality_threshold || 0.7,
        });
      }

      return decision;
    } catch (error) {
      this.logger.error('Decision execution failed', {
        request_id,
        decision_id,
        error: String(error),
      });
      throw error;
    }
  }

  /**
   * Processa feedback de usuário
   */
  async processFeedback(decision_id: string, feedback: FeedbackSignal): Promise<void> {
    // Em produção, buscaria decisão do DB
    this.logger.info('Feedback processed', {
      decision_id,
      feedback_type: feedback.feedback_type,
      business_impact: feedback.actual_outcome?.business_impact_score,
    });

    this.feedbackProcessor.emit('feedback_recorded', { decision_id, feedback });
  }

  /**
   * Exporta métricas
   */
  getMetrics() {
    return this.metricsCollector.getMetricsSummary();
  }

  logMetricsSummary() {
    this.metricsCollector.logSummary();
  }

  // ──────────────────────────────────────────────────────────────────

  private createMockDecision(
    decision_id: string,
    request_id: string,
    request: DecisionRequest,
    routing: any,
    agents_executed: number,
    context_size: number
  ): DecisionOutput {
    const metrics: DecisionMetrics = {
      quality_score: 0.85,
      actionability_score: 0.88,
      consistency_score: 0.82,
      confidence_score: 0.84,
    };

    return {
      decision: {
        recommendation: `[MOCK] Recomendação para ${request.type}`,
        reasoning: 'This is a mock decision for demonstration purposes',
        actions: [
          {
            priority: 'P0',
            title: 'Mock Action 1',
            description: 'Example action',
            estimated_impact: 'high',
            estimated_effort: 'M',
            confidence: 0.85,
          },
        ],
      },
      metrics,
      metadata: {
        analysisId: decision_id,
        type: request.type,
        criticality: request.criticality,
        model_used: routing.primary_model,
        execution_time_ms: Math.random() * 5000,
        context_tokens_used: Math.ceil(context_size / 4),
        cached: false,
        evaluation_count: 1,
        privacy_level: request.privacy_level,
      },
      tracing: {
        request_id,
        agent_chain: Array(agents_executed).fill('agent'),
        memory_hits: [],
        model_routing_rationale: routing.rationale,
        timestamp: new Date(),
      },
      feedback_eligible: true,
    };
  }
}
