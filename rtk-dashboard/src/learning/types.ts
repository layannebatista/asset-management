/**
 * Type definitions for Self-Improving Learning Engine
 * Centralized types for all learning components
 */

import { FeedbackSignal } from '../types/DecisionOutput';
import { AnalysisType } from '../types/analysis.types';

// ═══════════════════════════════════════════════════════════════════
// LearningEngine Types
// ═══════════════════════════════════════════════════════════════════

export interface LearningConfig {
  type: AnalysisType;
  modelWeights: Record<string, number>;
  contextBoosts: Record<string, number>;
  promptVersions: Record<string, number>;
  reexecutionThreshold: number;
  costOptimizationEnabled: boolean;
  learningRate: number;
  confidenceCalibration: number;
  lastUpdated: Date;
}

export interface LearningSignal {
  decisionId: string;
  feedback: FeedbackSignal;
  actualOutcome: {
    resolved: boolean;
    timeToResolution: number;
    businessImpact: number;
  };
  metrics: {
    previousQuality: number;
    actualQuality: number;
    improvement: number;
    confidenceError: number;
  };
  adaptations: string[];
}

// ═══════════════════════════════════════════════════════════════════
// ModelPerformanceStore Types
// ═══════════════════════════════════════════════════════════════════

export interface ModelPerformanceRecord {
  model: string;
  analysisType: string;
  contextSize: number;
  qualityScore: number;
  latencyMs: number;
  costUsd: number;
  timestamp: Date;
}

export interface ModelPerformanceStats {
  model: string;
  analysisType: string;
  totalExecutions: number;
  avgQuality: number;
  medianQuality: number;
  p95Quality: number;
  avgLatency: number;
  p99Latency: number;
  totalCost: number;
  avgCost: number;
  costEfficiency: number;
  lastUpdated: Date;
}

export interface ModelRecommendation {
  model: string;
  score: number;
  reasons: {
    qualityAdvantage: number;
    costAdvantage: number;
    latencyAdvantage: number;
  };
  alternative: string;
  shouldMigrateFrom?: string;
}

export interface ModelComparison {
  winner: string;
  score1: number;
  score2: number;
  qualityDelta: number;
  costDelta: number;
  latencyDelta: number;
}

export interface RegressionAnalysis {
  isRegression: boolean;
  qualityTrend: number;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'none';
  recommendation: string;
}

// ═══════════════════════════════════════════════════════════════════
// PromptPerformanceTracker Types
// ═══════════════════════════════════════════════════════════════════

export interface PromptVersion {
  id: string;
  analysisType: AnalysisType;
  version: string;
  template: string;
  status: 'active' | 'inactive' | 'deprecated';
  createdAt: Date;
  updatedAt: Date;
}

export interface PromptPerformanceMetric {
  promptId: string;
  version: string;
  totalExecutions: number;
  avgQuality: number;
  avgActionability: number;
  avgConsistency: number;
  successRate: number;
  avgTokensUsed: number;
  avgTokensSaved: number;
  lastUpdated: Date;
}

export interface PromptComparison {
  version: string;
  quality: number;
  executions: number;
  trend: 'improving' | 'stable' | 'declining';
  recommendation: string;
}

export interface PromptDegradation {
  version: string;
  currentQuality: number;
  previousQuality: number;
  degradation: number;
  recommendation: 'monitor' | 'investigate' | 'deprecate';
}

export interface PromptImprovement {
  suggestion: string;
  expectedImprovement: number;
  implementationPriority: 'high' | 'medium' | 'low';
}

export interface PromptEvolution {
  date: Date;
  versionCount: number;
  avgQuality: number;
  activeVersions: number;
}

// ═══════════════════════════════════════════════════════════════════
// CostOptimizationEngine Types
// ═══════════════════════════════════════════════════════════════════

export interface CostOptimizationRecommendation {
  currentModel: string;
  currentCost: number;
  recommendedModel: string;
  recommendedCost: number;
  monthlySavings: number;
  qualityRisk: number;
  recommendation: string;
  confidence: number;
}

export interface OverprovisionedModel {
  model: string;
  cost: number;
  qualityScore: number;
  utilizationRate: number;
  wastedCost: number;
  recommendation: string;
}

export interface MigrationSimulation {
  currentMonthlyCost: number;
  projectedMonthlyCost: number;
  estimatedSavings: number;
  qualityImpact: string;
  paybackPeriod: number;
  riskAssessment: string;
}

export interface ConfidenceCalibration {
  calibratedConfidence: number;
  adjustment: number;
  justification: string;
}

export interface AnnualSavingsReport {
  currentAnnualCost: number;
  potentialAnnualSavings: number;
  savingsPercentage: number;
  optimizationOpportunities: number;
  estimatedPaybackMonths: number;
}

// ═══════════════════════════════════════════════════════════════════
// AutoReexecutionStrategy Types
// ═══════════════════════════════════════════════════════════════════

export interface ReexecutionDecision {
  shouldReexecute: boolean;
  strategy: 'different_model' | 'same_model_with_expanded_context' | 'skip_reexecution';
  newModel?: string;
  estimatedCostDelta: number;
  estimatedQualityImprovement: number;
  confidence: number;
  justification: string;
}

export interface ReexecutionSuccessAnalysis {
  totalReexecutions: number;
  successfulReexecutions: number;
  successRate: number;
  avgQualityImprovement: number;
  avgCostPerReexecution: number;
}

export interface ReexecutionStatsByType {
  analysisType: AnalysisType;
  reexecutionRate: number;
  successRate: number;
  avgCostOfReexecution: number;
  recommendation: string;
}

// ═══════════════════════════════════════════════════════════════════
// CrossDecisionIntelligence Types
// ═══════════════════════════════════════════════════════════════════

export interface AnalysisCorrelation {
  sourceType: AnalysisType;
  targetType: AnalysisType;
  correlationStrength: number;
  direction: 'positive' | 'negative';
  lag: number;
  confidence: number;
}

export interface ContextualInfluence {
  sourceDecisionId: string;
  sourceType: AnalysisType;
  targetType: AnalysisType;
  influenceScore: number;
  recommendedAdjustment: {
    criticality: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
    confidenceAdjustment: number;
    contextBoost: Record<string, number>;
  };
  reasoning: string;
}

export interface InfluenceMatrixEntry {
  source: AnalysisType;
  target: AnalysisType;
  strength: number;
  direction: string;
}

export interface DecisionChain {
  chain: Array<{
    step: number;
    type: AnalysisType;
    influence: number;
  }>;
  totalPropagation: number;
}

export interface DiscoveredCorrelation {
  sourceType: AnalysisType;
  targetType: AnalysisType;
  correlation: number;
  support: number;
  confidence: number;
  lag: number;
  recommendation: string;
}

// ═══════════════════════════════════════════════════════════════════
// LearningEngineOrchestrator Types
// ═══════════════════════════════════════════════════════════════════

export interface EnhancedContext {
  context: Record<string, any>;
  recommendedModel: string;
  modelConfidence: number;
  shouldReexecuteIfLowQuality: boolean;
  estimatedQuality: number;
  appliedEnhancements: string[];
}

export interface FeedbackProcessingResult {
  learning: {
    modelWeightUpdates: string[];
    promptOptimizations: string[];
    costReductions: number;
    confidenceCalibration: number;
  };
  nextDecisionImprovements: {
    recommendedModel: string;
    expectedQualityImprovement: number;
    expectedCostSavings: number;
    criticalityAdjustment?: string;
  };
}

export interface LearningReport {
  summary: {
    totalDecisions: number;
    averageQuality: number;
    improvementRate: number;
    costSavingsRealized: number;
    feedbackResponseRate: number;
  };
  components: {
    learningRate: number;
    modelEfficiency: number;
    decisionSuccessRate: number;
    reexecutionROI: number;
    costOptimizationPotential: number;
  };
  recommendations: string[];
  nextOptimizations: Array<{
    opportunity: string;
    estimatedImpact: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
  }>;
}

// ═══════════════════════════════════════════════════════════════════
// HistoricalSuccessTracker Types
// ═══════════════════════════════════════════════════════════════════

export interface SuccessMetric {
  analysisId: string;
  analysisType: AnalysisType;
  query: string;
  qualityScore: number;
  actionabilityScore: number;
  consistencyScore: number;
  overallScore: number;
  tokensSaved: number;
  resolutionTime: number;
  userFeedback?: 'helpful' | 'neutral' | 'unhelpful';
  timestamp: Date;
}

export interface TypeStatistics {
  avgQuality: number;
  avgActionability: number;
  avgConsistency: number;
  avgOverallScore: number;
  sampleCount: number;
  bestPerformingQueries: string[];
}

export interface QualityTrend {
  date: Date;
  avgScore: number;
  sampleCount: number;
}

export interface TypeRanking {
  type: AnalysisType;
  avgScore: number;
  sampleCount: number;
}

// ═══════════════════════════════════════════════════════════════════
// Helper Types
// ═══════════════════════════════════════════════════════════════════

export interface PreviousDecision {
  id: string;
  type: AnalysisType;
  qualityScore: number;
  model: string;
  cost: number;
  criticality: string;
  contextSize: number;
}

export interface OrchestrationComponent {
  name: string;
  version: string;
  status: 'initialized' | 'running' | 'error';
  lastUpdated: Date;
}

export interface LearningMetrics {
  learning_rate: number;
  improvement_over_time: number;
  model_efficiency: number;
  decision_success_rate: number;
  reexecution_roi: number;
  monthly_cost_savings: number;
  cost_optimization_potential: number;
  confidence_calibration_error: number;
  regression_detection_rate: number;
}
