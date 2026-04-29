/**
 * Decision Contract V2 - Padronização Enterprise
 *
 * Garante:
 * - Consistência entre todos os tipos de análise
 * - Facilidade de consumo por frontend e backend
 * - Suporte a auditoria e explainability
 * - UX otimizada para decisão
 */

// ═══════════════════════════════════════════════════════════════════
// TIPOS CORE
// ═══════════════════════════════════════════════════════════════════

export enum ExecutionMode {
  AUTO = 'auto',                           // Executa automaticamente
  APPROVAL_REQUIRED = 'approval_required', // Requer aprovação
  BLOCKED = 'blocked'                      // Bloqueado
}

export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum DecisionStatus {
  PENDING = 'pending',
  EXECUTING = 'executing',
  EXECUTED = 'executed',
  FAILED = 'failed',
  BLOCKED = 'blocked'
}

// ═══════════════════════════════════════════════════════════════════
// DECISION CONTRACT (resposta padronizada)
// ═══════════════════════════════════════════════════════════════════

export interface DecisionResponse {
  // Identificação
  decisionId: string;
  timestamp: Date;

  // Decisão Principal
  decision: {
    recommendation: string;        // O que fazer (imperative)
    reasoning: string;             // Por que (causa raiz, padrão)
    confidence: number;            // 0-1 (confiança nesta decisão)
  };

  // Ações Priorizadas (para execução)
  actions: Action[];

  // Explicabilidade
  explanation: Explanation;

  // Controle de Autonomia
  execution: {
    mode: ExecutionMode;
    reason?: string;               // Por que este modo
    requiresApprovalFrom?: string; // 'manager' | 'director' | null
  };

  // Contexto de Risco
  risk: {
    level: RiskLevel;
    factors: string[];
    estimatedImpact?: string;
  };

  // Qualidade
  metrics: {
    quality_score: number;        // 0-1
    confidence_score: number;     // 0-1
    actionability_score?: number; // 0-1
  };

  // UX - Frontend Display
  ui: {
    priority: 'P0' | 'P1' | 'P2';  // Urgência visível
    icon: string;                  // Emoji ou icon key
    color: 'success' | 'warning' | 'danger'; // Cor para exibição
    summary: string;               // Uma frase para card
  };

  // Auditoria
  audit: {
    type: string;                  // observability | test | cicd | incident | risk
    criticality: string;           // LOW | NORMAL | HIGH | CRITICAL
    user?: string;                 // Quem pediu
    models_used: string[];         // Quais modelos
  };

  // Metadados
  metadata: {
    execution_time_ms: number;
    cached: boolean;
    version: string;              // Contract version
  };
}

// ═══════════════════════════════════════════════════════════════════
// COMPONENTES DO CONTRACT
// ═══════════════════════════════════════════════════════════════════

export interface Action {
  id: string;
  priority: 'P0' | 'P1' | 'P2';
  title: string;
  description: string;            // Ação concreta
  command?: string;               // Se aplicável (kubectl, curl, etc)
  estimatedImpact: 'high' | 'medium' | 'low';
  estimatedEffort: 'XS' | 'S' | 'M' | 'L';
  reversible: boolean;            // Pode ser desfeita?
  confidence: number;             // Confiança nesta ação
}

export interface Explanation {
  summary: string;                          // Resumo em 1 parágrafo
  factors: DecisionFactor[];                // O que influenciou
  rejected_alternatives: RejectedOption[]; // Por que não fez X?
  confidence_justification: string;         // Por que confio neste resultado
}

export interface DecisionFactor {
  name: string;
  value: string | number;
  impact: 'positive' | 'negative' | 'neutral';
  weight: number; // 0-1 (importância desta factor)
}

export interface RejectedOption {
  option: string;
  reason: string;
  confidence_penalty?: number;
}

// ═══════════════════════════════════════════════════════════════════
// AUTONOMY CONTROL (simples mas poderoso)
// ═══════════════════════════════════════════════════════════════════

export interface AutonomyDecision {
  mode: ExecutionMode;
  reason: string;
  requiresApprovalFrom?: 'manager' | 'director' | null;
}

export function determineExecutionMode(
  qualityScore: number,
  riskLevel: RiskLevel,
  criticality: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL'
): AutonomyDecision {
  // Regra 1: Qualidade muito baixa = bloqueado sempre
  if (qualityScore < 0.50) {
    return {
      mode: ExecutionMode.BLOCKED,
      reason: 'Quality score too low (< 0.50)'
    };
  }

  // Regra 2: Risco crítico = bloqueado sempre
  if (riskLevel === RiskLevel.CRITICAL) {
    return {
      mode: ExecutionMode.BLOCKED,
      reason: 'Risk level is CRITICAL'
    };
  }

  // Regra 3: Critical severity + medium/high risk = requer aprovação
  if (criticality === 'CRITICAL' && (riskLevel === RiskLevel.HIGH || riskLevel === RiskLevel.MEDIUM)) {
    return {
      mode: ExecutionMode.APPROVAL_REQUIRED,
      reason: 'CRITICAL severity with high/medium risk',
      requiresApprovalFrom: riskLevel === RiskLevel.HIGH ? 'director' : 'manager'
    };
  }

  // Regra 4: HIGH severity + HIGH risk = requer aprovação
  if (criticality === 'HIGH' && riskLevel === RiskLevel.HIGH) {
    return {
      mode: ExecutionMode.APPROVAL_REQUIRED,
      reason: 'HIGH severity with HIGH risk',
      requiresApprovalFrom: 'manager'
    };
  }

  // Regra 5: Qualidade OK + risco baixo/médio = auto
  if (qualityScore >= 0.70 && riskLevel !== RiskLevel.HIGH) {
    return {
      mode: ExecutionMode.AUTO,
      reason: 'Quality and risk acceptable for autonomous execution'
    };
  }

  // Default: aprovação
  return {
    mode: ExecutionMode.APPROVAL_REQUIRED,
    reason: 'Requires review before execution'
  };
}

// ═══════════════════════════════════════════════════════════════════
// LOGGING STRATEGY (não excessivo)
// ═══════════════════════════════════════════════════════════════════

export enum LogLevel {
  DEBUG = 'debug',   // Detalhes internos (apenas dev)
  INFO = 'info',     // Eventos normais
  WARN = 'warn',     // Situações inesperadas mas recuveráveis
  ERROR = 'error'    // Falhas que requerem ação
}

export const LogStrategy = {
  // LOG: Sempre
  ALWAYS_LOG: [
    'decision_made',       // Decisão tomada
    'decision_executed',   // Ação executada
    'execution_failed',    // Ação falhou
    'quality_low',         // Qualidade baixa
    'risk_high'            // Risco alto
  ],

  // NÃO LOG: Dados sensíveis
  NEVER_LOG: [
    'user_pii',           // Dados de usuário
    'api_keys',           // Credenciais
    'customer_data',      // Dados sensíveis
    'passwords'           // Senhas
  ],

  // LOG LEVELS por situação
  DECISION_MADE: LogLevel.INFO,
  MODEL_USED: LogLevel.DEBUG,
  CACHE_HIT: LogLevel.DEBUG,
  EXECUTION_STARTED: LogLevel.INFO,
  EXECUTION_FAILED: LogLevel.ERROR,
  QUALITY_WARNING: LogLevel.WARN,
  RISK_HIGH: LogLevel.WARN,
  RISK_CRITICAL: LogLevel.ERROR
};

// ═══════════════════════════════════════════════════════════════════
// ERROR HANDLING (padrão de fallback seguro)
// ═══════════════════════════════════════════════════════════════════

export enum ErrorType {
  MODEL_FAILURE = 'model_failure',
  TIMEOUT = 'timeout',
  INVALID_RESPONSE = 'invalid_response',
  INCONSISTENCY = 'inconsistency',
  RATE_LIMIT = 'rate_limit'
}

export interface ErrorRecoveryStrategy {
  errorType: ErrorType;
  fallback: {
    useCache: boolean;              // Tentar cache antigo?
    useFallbackModel: boolean;      // Usar modelo mais simples?
    returnPartialResult: boolean;   // Retornar resultado parcial?
    blockExecution: boolean;        // Bloquear automáticamente?
  };
  log: boolean;
  alertOncall: boolean;
}

export const ErrorRecoveryMap: Record<ErrorType, ErrorRecoveryStrategy> = {
  [ErrorType.MODEL_FAILURE]: {
    errorType: ErrorType.MODEL_FAILURE,
    fallback: { useCache: true, useFallbackModel: true, returnPartialResult: false, blockExecution: true },
    log: true,
    alertOncall: true
  },

  [ErrorType.TIMEOUT]: {
    errorType: ErrorType.TIMEOUT,
    fallback: { useCache: true, useFallbackModel: false, returnPartialResult: false, blockExecution: true },
    log: true,
    alertOncall: false
  },

  [ErrorType.INVALID_RESPONSE]: {
    errorType: ErrorType.INVALID_RESPONSE,
    fallback: { useCache: true, useFallbackModel: true, returnPartialResult: false, blockExecution: true },
    log: true,
    alertOncall: true
  },

  [ErrorType.INCONSISTENCY]: {
    errorType: ErrorType.INCONSISTENCY,
    fallback: { useCache: false, useFallbackModel: false, returnPartialResult: false, blockExecution: true },
    log: true,
    alertOncall: true
  },

  [ErrorType.RATE_LIMIT]: {
    errorType: ErrorType.RATE_LIMIT,
    fallback: { useCache: true, useFallbackModel: false, returnPartialResult: true, blockExecution: false },
    log: false,
    alertOncall: false
  }
};

// ═══════════════════════════════════════════════════════════════════
// GOVERNANCE (trilha de decisão, sem burocracia)
// ═══════════════════════════════════════════════════════════════════

export interface DecisionAuditRecord {
  decisionId: string;
  timestamp: Date;
  userId?: string;
  type: string;                 // analysis type
  criticality: string;          // severity
  riskLevel: RiskLevel;
  qualityScore: number;
  recommendation: string;
  executionMode: ExecutionMode;
  status: DecisionStatus;
  executedAt?: Date;
  result?: 'success' | 'failed';
  feedback?: string;            // Feedback do usuário depois

  // Retenção: 90 dias por padrão, 1 ano para CRITICAL
  expiresAt: Date;
}

export const GovernanceRules = {
  // Retenção de dados
  RETENTION_DAYS_DEFAULT: 90,
  RETENTION_DAYS_CRITICAL: 365,
  RETENTION_DAYS_FAILED: 180,

  // Acesso
  READ_AUDIT: ['self', 'admin', 'compliance'],
  MODIFY_AUDIT: ['admin_only'],

  // Relatórios (compliance)
  COMPLIANCE_REPORT_FREQUENCY: 'weekly'
};

// ═══════════════════════════════════════════════════════════════════
// ANTI-OVERENGINEERING RULES
// ═══════════════════════════════════════════════════════════════════

export const AntiOverengineeringRules = {
  // Não fazer
  DONT: [
    'Criar abstrações para code que aparece 1x',
    'Adicionar componentes "para o futuro"',
    'Fazer sistema extensível indefinidamente',
    'Implementar padrão sem razão clara',
    'Abstrair antes de ter 3 casos de uso similares',
    'Caching para dados que não mudam frequentemente',
    'Redundância sem fallback real'
  ],

  // Focar em
  DO: [
    'Simplicidade > Flexibilidade',
    'Pronto para hoje > Preparado para amanhã',
    'Código óbvio > Código clever',
    'Menos arquivos > Mais arquivos',
    'Funções simples > Padrões complexos',
    'Real problems > Theoretical problems'
  ]
};

// ═══════════════════════════════════════════════════════════════════
// PRODUCTION CHECKLIST
// ═══════════════════════════════════════════════════════════════════

export const ProductionChecklist = {
  API: {
    'Contract padronizado': true,
    'Resposta consistente': true,
    'Explainability clara': true,
    'UX otimizada': true
  },

  Comportamento: {
    'AUTO/APPROVAL/BLOCKED determinado': true,
    'Autonomy rules claras': true,
    'Fallback definido': true,
    'Timeout configurado': true
  },

  Controle: {
    'Logging apropriado': true,
    'Error handling real': true,
    'Auditoria simples': true,
    'Monitoramento básico': true
  },

  Segurança: {
    'LGPD compliance': true,
    'PII masking': true,
    'Acesso auditado': true,
    'Rate limit': true
  },

  Deploy: {
    'Testes passando': true,
    'Documentação pronta': true,
    'Fallback testado': true,
    'On-call aware': true
  }
};
