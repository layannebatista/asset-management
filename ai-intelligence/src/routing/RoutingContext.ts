/**
 * Routing context types and enums
 */

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
  contextSize: number; // estimated tokens
  criticality: Criticality;
  requiresLocalModel?: boolean;
  userTier: 'free' | 'pro' | 'enterprise';
  recentCacheMissRate?: number; // 0-1
}

export interface ModelDecision {
  modelId: string;
  modelName: ModelName;
  temperature: number;
  maxTokens: number;
  costEstimate: number;
  reason: string;
}

export interface RoutingStats {
  totalDecisions: number;
  successRate: number;
  costAverage: number;
  modelDistribution: Record<ModelName, number>;
}
