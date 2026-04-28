import { SensitivityLevel } from '../security/SecurityClassifier';
import { AnalysisType } from './analysis.types';

/**
 * Tipos relacionados a Security Phase 3
 */

export interface SecurityContext {
  sensitivityLevel: SensitivityLevel;
  requiresMasking: boolean;
  requiresLocalModel: boolean;
  dataPatterns: string[];
  auditRequired: boolean;
}

export interface MaskingRule {
  pattern: RegExp;
  replacement: string;
  sensitivityLevel: SensitivityLevel;
}

export interface AuditLogEntry {
  timestamp: Date;
  userId: string;
  action: 'classify' | 'mask' | 'extract' | 'route';
  analysisType: AnalysisType;
  sensitivityLevel: SensitivityLevel;
  result: 'success' | 'failed' | 'blocked';
  details?: Record<string, any>;
}

export interface LGPDComplianceReport {
  timestamp: Date;
  totalAnalyses: number;
  piiDetected: number;
  maskedCount: number;
  localModelUsageCount: number;
  complianceScore: number; // 0-1
  violations: LGPDViolation[];
}

export interface LGPDViolation {
  timestamp: Date;
  type: 'pii_exposed' | 'improper_routing' | 'audit_missing' | 'masking_failed';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedData?: string;
  recommendedAction: string;
}

export enum LocalModelType {
  OLLAMA = 'ollama',
  LLAMA_CPP = 'llama-cpp',
  MISTRAL = 'mistral',
}

export interface LocalModelConfig {
  type: LocalModelType;
  endpoint: string;
  modelName: string;
  maxTokens: number;
  temperature: number;
}

export interface SecureAnalysisResult {
  analysisId: string;
  originalSensitivity: SensitivityLevel;
  actualSensitivity: SensitivityLevel; // Após masking/sanitization
  wasMasked: boolean;
  usedLocalModel: boolean;
  qualityScore: number;
  auditLog: AuditLogEntry;
}
