/**
 * Enterprise-grade AI system types
 * Shared across routing, eval, security, memory layers
 */

// ─────────────────────────────────────────────────────────────────
// ROUTING & MODEL SELECTION
// ─────────────────────────────────────────────────────────────────

export enum AnalysisType {
  OBSERVABILITY = 'observability',
  TEST_INTELLIGENCE = 'test-intelligence',
  CICD = 'cicd',
  INCIDENT = 'incident',
  RISK = 'risk',
}

export enum Criticality {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export type ModelName = 'gpt-4o' | 'gpt-4-turbo' | 'gpt-4o-mini' | 'o1-preview' | 'local-llama2';

export interface RoutingContext {
  type: AnalysisType;
  contextSize: number;
  criticality: Criticality;
  requiresLocalModel?: boolean;
  userTier: 'free' | 'pro' | 'enterprise';
  recentCacheMissRate?: number;
}

export interface ModelDecision {
  modelId: string;
  modelName: ModelName;
  temperature: number;
  maxTokens: number;
  costEstimate: number;
  reason: string;
}

// ─────────────────────────────────────────────────────────────────
// EVALUATION
// ─────────────────────────────────────────────────────────────────

export interface EvalDatapoint {
  id: string;
  analysisType: AnalysisType;
  input: {
    contextChunks: string[];
    query: string;
  };
  expectedOutput: {
    keyPoints: string[];
    recommendedActions: string[];
    riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  };
  generatedOutput: {
    keyPoints: string[];
    recommendedActions: string[];
    riskLevel?: string;
    confidence: number;
  };
}

export interface EvalScore {
  quality: number;
  actionability: number;
  consistency: number;
  overall: number;
  breakdown: {
    rougeL: number;
    factualityCheck: boolean;
    coherence: number;
  };
  timestamp: Date;
}

// ─────────────────────────────────────────────────────────────────
// SECURITY
// ─────────────────────────────────────────────────────────────────

export enum SensitivityLevel {
  PUBLIC = 'public',
  INTERNAL = 'internal',
  CONFIDENTIAL = 'confidential',
  RESTRICTED = 'restricted',
}

export interface SecureRoutingResult {
  model: ModelDecision;
  masked: boolean;
  reason: string;
  sensitivity: SensitivityLevel;
}

// ─────────────────────────────────────────────────────────────────
// MEMORY & RETRIEVAL
// ─────────────────────────────────────────────────────────────────

export interface AnalysisMemory {
  id: string;
  analysisId: string;
  type: AnalysisType;
  query: string;
  embedding: number[];
  result: {
    keyPoints: string[];
    recommendations: string[];
    qualityScore: number;
  };
  createdAt: Date;
  accessCount: number;
  lastAccessed: Date;
}

// ─────────────────────────────────────────────────────────────────
// AGENT GRAPH (DAG)
// ─────────────────────────────────────────────────────────────────

export interface IAnalyzer {
  analyze(input: unknown): Promise<unknown>;
}

export interface AgentNode {
  id: string;
  name: string;
  type: 'analyzer' | 'filter' | 'synthesizer' | 'evaluator';
  dependencies: string[];
  analyzer: IAnalyzer;
}

export interface AgentGraphState {
  nodeResults: Map<string, unknown>;
  errors: Map<string, Error>;
  metrics: Map<string, number>;
  executionOrder: string[];
}

// ─────────────────────────────────────────────────────────────────
// PROMPT ENGINE
// ─────────────────────────────────────────────────────────────────

export interface PromptTemplate {
  id: string;
  version: number;
  type: AnalysisType;
  name: string;
  system: string;
  context: string;
  rules: string;
  examples?: string;
  createdAt: Date;
  updatedAt: Date;
  metrics?: {
    avgScore: number;
    samplesEvaluated: number;
  };
}

export interface ComposedPrompt {
  system: string;
  user: string;
  templateId: string;
  templateVersion: number;
}

// ─────────────────────────────────────────────────────────────────
// CONTEXT INTELLIGENCE
// ─────────────────────────────────────────────────────────────────

export interface ContextChunk {
  id: string;
  data: unknown;
  score: number;
  metadata?: Record<string, unknown>;
}

export interface ContextChunkWithMetadata extends ContextChunk {
  relevanceScore: number;
  successHistoryRate: number;
  recency: number;
  temporalBias?: number;
}

// ─────────────────────────────────────────────────────────────────
// METRICS & OBSERVABILITY
// ─────────────────────────────────────────────────────────────────

export interface AIMetrics {
  'ai.analysis.duration_ms': number;
  'ai.llm_call.duration_ms': number;
  'ai.context_pipeline.duration_ms': number;
  'ai.llm.tokens_used': number;
  'ai.llm.estimated_cost_usd': number;
  'ai.llm.cost_per_analysis': number;
  'ai.analysis.eval_score': number;
  'ai.analysis.quality_score': number;
  'ai.analysis.actionability_score': number;
  'ai.llm.fallback_used': boolean;
  'ai.llm.retry_count': number;
  'ai.context.chunks_dropped': number;
  'ai.router.model_selected': string;
  'ai.router.decision_reason': string;
  'ai.memory.cache_hit': boolean;
  'ai.memory.cache_hit_rate': number;
  'ai.error.type': string | null;
  'ai.error.count': number;
}

// ─────────────────────────────────────────────────────────────────
// ANALYSIS REQUEST & RESULT (Extended)
// ─────────────────────────────────────────────────────────────────

export interface EnterpriseAnalysisRequest {
  id: string;
  type: AnalysisType;
  query: string;
  context?: ContextChunk[];
  contextEstimate?: number;
  criticality?: Criticality;
  userTier?: 'free' | 'pro' | 'enterprise';
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

export interface EnterpriseAnalysisResult {
  id: string;
  type: AnalysisType;
  query: string;
  keyPoints: string[];
  recommendations: string[];
  confidence: number;
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  qualityScore: number;
  evalScores?: EvalScore;
  modelUsed: ModelName;
  costUsd: number;
  durationMs: number;
  memoryHit?: boolean;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

// ─────────────────────────────────────────────────────────────────
// GATEWAY & QUOTA
// ─────────────────────────────────────────────────────────────────

export interface QuotaConfig {
  dailyRequests: number;
  monthlyBudgetUsd: number;
  maxContextSize: number;
  maxConcurrentAnalyses: number;
  priorityLevel: 'low' | 'normal' | 'high';
}

export interface GatewayRequest {
  analysisRequest: EnterpriseAnalysisRequest;
  userId: string;
  apiKey: string;
  correlationId: string;
}

export interface GatewayResponse {
  result: EnterpriseAnalysisResult;
  quota: {
    remaining: number;
    budgetRemaining: number;
    throttled: boolean;
  };
  cached: boolean;
  correlationId: string;
}
