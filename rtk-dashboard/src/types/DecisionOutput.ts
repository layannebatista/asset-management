/**
 * DecisionOutput – Novo contrato de resposta do AI Decision Engine
 * Substitui "AnalysisResult" e adiciona confidence, metrics detalhadas, feedback loop
 */

export interface DecisionMetrics {
  quality_score: number;        // 0-1: correlação com ground truth
  actionability_score: number;  // 0-1: quão prática a decisão é
  consistency_score: number;    // 0-1: coerência interna + histórico
  confidence_score: number;     // 0-1: incerteza do modelo + contexto
}

export interface DecisionAction {
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  title: string;
  description: string;
  estimated_impact: 'high' | 'medium' | 'low';
  estimated_effort: 'XS' | 'S' | 'M' | 'L' | 'XL';
  confidence: number;
  prerequisites?: string[];
}

export interface Decision {
  recommendation: string;
  reasoning: string;
  actions: DecisionAction[];
  alternative_approaches?: string[];
}

export interface DecisionMetadata {
  analysisId: string;
  type: 'observability' | 'test-intelligence' | 'cicd' | 'incident' | 'risk';
  criticality: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
  model_used: string;
  model_fallback?: string;
  execution_time_ms: number;
  context_tokens_used: number;
  cached: boolean;
  evaluation_count: number;  // reexecuções
  privacy_level?: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED';
  data_masked?: boolean;
}

export interface DecisionTracing {
  request_id: string;
  agent_chain: string[];     // agentes executados
  memory_hits: string[];     // padrões encontrados
  model_routing_rationale: string;
  timestamp: Date;
}

export interface DecisionOutput {
  // Decisão principal
  decision: Decision;

  // Métricas 3D
  metrics: DecisionMetrics;

  // Contexto + tracing
  metadata: DecisionMetadata;
  tracing: DecisionTracing;

  // Feedback loop
  feedback_eligible: boolean;
  next_actions_if_negative_feedback?: {
    reprocess_with_model: string;
    alternative_approach: string;
  };
}

export interface DecisionRequest {
  type: 'observability' | 'test-intelligence' | 'cicd' | 'incident' | 'risk';
  criticality: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
  context: Record<string, unknown>;
  privacy_level?: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED';
  min_quality_threshold?: number;  // default 0.7
  request_id?: string;
}

export interface FeedbackSignal {
  decision_id: string;
  feedback_type: 'positive' | 'negative' | 'partial';
  user_id: string;
  actual_outcome?: {
    resolved: boolean;
    time_to_resolution_minutes: number;
    business_impact_score: number;  // 0-10
  };
  notes?: string;
  timestamp: Date;
}
