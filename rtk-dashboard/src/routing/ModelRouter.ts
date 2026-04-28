import { Logger } from 'winston';

export interface ModelProfile {
  model_id: string;
  provider: 'openai' | 'anthropic' | 'local';
  capability: {
    reasoning: number;
    speed: number;
    cost_efficiency: number;
    json_mode: boolean;
    context_window: number;
    supports_system_prompt: boolean;
  };
  historical_scores: {
    observability: number;
    'test-intelligence': number;
    cicd: number;
    incident: number;
    risk: number;
  };
  fallback_chain: string[];
  compliance: {
    gdpr_safe: boolean;
    hipaa_safe: boolean;
    handles_pii: boolean;
    local_only_for_sensitive: boolean;
  };
}

export type AnalysisType = 'observability' | 'test-intelligence' | 'cicd' | 'incident' | 'risk';
export type Criticality = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
export type PrivacyLevel = 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED';

export interface RoutingContext {
  analysis_type: AnalysisType;
  criticality: Criticality;
  context_size: number;
  privacy_level: PrivacyLevel;
  has_pii: boolean;
  budget_tokens?: number;
  cost_sensitive?: boolean;
}

export interface RoutingDecision {
  primary_model: string;
  fallback_models: string[];
  rationale: string;
  estimated_cost: number;
  routing_metadata: Record<string, unknown>;
}

export class ModelRouter {
  private readonly logger: Logger;
  private readonly model_catalog: Map<string, ModelProfile>;

  constructor(logger: Logger, models: ModelProfile[]) {
    this.logger = logger;
    this.model_catalog = new Map(models.map((m) => [m.model_id, m]));
    this.logger.info('ModelRouter initialized', { models_count: models.length });
  }

  async route(context: RoutingContext): Promise<RoutingDecision> {
    const compliant = this.filterByCompliance(context);
    if (compliant.length === 0) return this.getEmergencyFallback();

    const scored = compliant.map((m) => ({ model: m, score: this.scoreModel(m, context) }));
    scored.sort((a, b) => b.score - a.score);

    const primary = scored[0];
    return {
      primary_model: primary.model.model_id,
      fallback_models: scored.slice(1, 3).map((m) => m.model.model_id),
      rationale: `Selected ${primary.model.model_id} based on capability match for ${context.analysis_type}`,
      estimated_cost: this.estimateCost(primary.model, context),
      routing_metadata: { routing_score: primary.score.toFixed(3) },
    };
  }

  selectStrongerFallback(current: string, type: AnalysisType): string {
    const model = this.model_catalog.get(current);
    if (!model) return 'gpt-4o';
    const idx = model.fallback_chain.indexOf(current);
    if (idx >= 0 && idx < model.fallback_chain.length - 1) {
      return model.fallback_chain[idx + 1];
    }
    return 'gpt-4o';
  }

  async getDynamicFallback(failed: string, context: RoutingContext, error: string) {
    if (error.includes('rate_limit')) {
      return { fallback_model: 'gpt-3.5-turbo', should_retry: true, strategy: 'queue_for_later' as const };
    }
    return { fallback_model: 'gpt-4o', should_retry: true, strategy: 'use_fallback' as const };
  }

  private filterByCompliance(context: RoutingContext): ModelProfile[] {
    return Array.from(this.model_catalog.values()).filter((m) => {
      if (context.privacy_level === 'RESTRICTED' && !m.compliance.local_only_for_sensitive) return false;
      if (context.has_pii && !m.compliance.handles_pii) return false;
      return true;
    });
  }

  private scoreModel(m: ModelProfile, context: RoutingContext): number {
    let score = m.historical_scores[context.analysis_type] * 0.35 || 0.175;
    if (context.criticality === 'CRITICAL') score += m.capability.reasoning * 0.3;
    if (context.context_size > 100000) score += m.capability.speed * 0.15;
    score += 0.2;
    return Math.min(score, 1.0);
  }

  private estimateCost(m: ModelProfile, context: RoutingContext): number {
    return (m.provider === 'local' ? 0 : 0.01) * Math.ceil(context.context_size / 1000);
  }

  private getEmergencyFallback(): RoutingDecision {
    return {
      primary_model: 'gpt-4o',
      fallback_models: ['gpt-4-turbo'],
      rationale: 'Emergency fallback',
      estimated_cost: 0.05,
      routing_metadata: { emergency: true },
    };
  }
}

export const DEFAULT_MODELS: ModelProfile[] = [
  {
    model_id: 'gpt-4o',
    provider: 'openai',
    capability: { reasoning: 0.95, speed: 0.7, cost_efficiency: 0.5, json_mode: true, context_window: 128000, supports_system_prompt: true },
    historical_scores: { observability: 0.91, 'test-intelligence': 0.88, cicd: 0.85, incident: 0.92, risk: 0.89 },
    fallback_chain: ['gpt-4o', 'gpt-4-turbo', 'gpt-4'],
    compliance: { gdpr_safe: true, hipaa_safe: false, handles_pii: true, local_only_for_sensitive: false },
  },
  {
    model_id: 'gpt-4-turbo',
    provider: 'openai',
    capability: { reasoning: 0.9, speed: 0.65, cost_efficiency: 0.6, json_mode: true, context_window: 128000, supports_system_prompt: true },
    historical_scores: { observability: 0.87, 'test-intelligence': 0.92, cicd: 0.88, incident: 0.85, risk: 0.9 },
    fallback_chain: ['gpt-4-turbo', 'gpt-4'],
    compliance: { gdpr_safe: true, hipaa_safe: false, handles_pii: true, local_only_for_sensitive: false },
  },
];
