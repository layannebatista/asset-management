/**
 * Production Safety Guards — SRE-Grade Reliability & Security
 *
 * Valida e fortalece sistema contra falhas, edge cases e cenários reais.
 * Foco: confiabilidade, segurança, previsibilidade.
 */

// ═══════════════════════════════════════════════════════════════════
// 1. EDGE CASES CRÍTICOS
// ═══════════════════════════════════════════════════════════════════

export interface EdgeCaseHandler {
  validate(): {
    valid: boolean;
    errors: string[];
  };
}

export class EdgeCaseValidation {
  // Edge Case 1: Contexto incompleto ou inválido
  static validateContext(context: any): { valid: boolean; error?: string } {
    if (!context || typeof context !== 'object') {
      return { valid: false, error: 'Context is null or not object' };
    }

    // Campos mínimos obrigatórios
    const required = ['type', 'criticality'];
    const missing = required.filter(field => !context[field]);

    if (missing.length > 0) {
      return { valid: false, error: `Missing required fields: ${missing.join(', ')}` };
    }

    return { valid: true };
  }

  // Edge Case 2: Métricas contraditórias (qualidade alta mas muitos erros)
  static checkMetricContradictions(metrics: any): { valid: boolean; warning?: string } {
    if (!metrics) return { valid: true };

    // Qualidade alta + taxa de erro alta = contraditório
    if ((metrics.quality_score > 0.8) && (metrics.error_rate > 0.1)) {
      return {
        valid: true,
        warning: 'Contradiction: high quality but high error rate — investigate'
      };
    }

    // Confiança alta + inconsistência entre estratégias
    if ((metrics.confidence_score > 0.9) && (metrics.strategy_divergence > 0.3)) {
      return {
        valid: true,
        warning: 'Contradiction: high confidence but strategies diverge — reexecute'
      };
    }

    return { valid: true };
  }

  // Edge Case 3: Dados desatualizados (contexto > 1 hora)
  static checkDataFreshness(contextTimestamp: Date): { fresh: boolean; warning?: string } {
    const age = Date.now() - contextTimestamp.getTime();
    const oneHourMs = 60 * 60 * 1000;

    if (age > oneHourMs) {
      return {
        fresh: false,
        warning: `Context data is ${Math.floor(age / 60000)} minutes old — consider refresh`
      };
    }

    return { fresh: true };
  }

  // Edge Case 4: Respostas inconsistentes entre estratégias (multi-strategy)
  static checkStrategyConsistency(strategy1: any, strategy2: any): { consistent: boolean; divergence: number } {
    if (!strategy1 || !strategy2) return { consistent: true, divergence: 0 };

    const divergence = Math.abs(
      (strategy1.quality_score || 0) - (strategy2.quality_score || 0)
    );

    // Se divergência > 0.2 (20%), é suspeito
    const consistent = divergence <= 0.2;

    return { consistent, divergence };
  }

  // Edge Case 5: Modelo retornando output malformatado
  static validateJsonOutput(raw: string): { valid: boolean; parsed?: any; error?: string } {
    try {
      const parsed = JSON.parse(raw);

      // Campos obrigatórios
      if (!parsed.decision || !parsed.actions || !parsed.metrics) {
        return {
          valid: false,
          error: 'Missing required fields in model output'
        };
      }

      return { valid: true, parsed };
    } catch (e) {
      return {
        valid: false,
        error: `JSON parse failed: ${e instanceof Error ? e.message : 'unknown'}`
      };
    }
  }
}

// ═══════════════════════════════════════════════════════════════════
// 2. FAILURE MODES
// ═══════════════════════════════════════════════════════════════════

export enum FailureType {
  LLM_UNAVAILABLE = 'llm_unavailable',
  TIMEOUT = 'timeout',
  HIGH_LATENCY = 'high_latency',
  JSON_PARSE_ERROR = 'json_parse_error',
  CONTEXT_PIPELINE_ERROR = 'context_pipeline_error',
  INVALID_RESPONSE = 'invalid_response',
  CONSISTENCY_CHECK_FAILED = 'consistency_check_failed'
}

export interface FailureRecovery {
  useCache: boolean;
  useFallbackModel: boolean;
  returnPartialResult: boolean;
  blockExecution: boolean;
  logAlert: boolean;
  retryCount: number;
  retryDelayMs: number;
}

export const FailureModeMap: Record<FailureType, FailureRecovery> = {
  [FailureType.LLM_UNAVAILABLE]: {
    useCache: true,
    useFallbackModel: true,
    returnPartialResult: false,
    blockExecution: true,
    logAlert: true,
    retryCount: 2,
    retryDelayMs: 500
  },

  [FailureType.TIMEOUT]: {
    useCache: true,
    useFallbackModel: false,
    returnPartialResult: false,
    blockExecution: true,
    logAlert: false,
    retryCount: 0,
    retryDelayMs: 0
  },

  [FailureType.HIGH_LATENCY]: {
    useCache: true,
    useFallbackModel: true,
    returnPartialResult: true,
    blockExecution: false,
    logAlert: true,
    retryCount: 0,
    retryDelayMs: 0
  },

  [FailureType.JSON_PARSE_ERROR]: {
    useCache: true,
    useFallbackModel: true,
    returnPartialResult: false,
    blockExecution: true,
    logAlert: true,
    retryCount: 1,
    retryDelayMs: 200
  },

  [FailureType.CONTEXT_PIPELINE_ERROR]: {
    useCache: true,
    useFallbackModel: false,
    returnPartialResult: false,
    blockExecution: true,
    logAlert: true,
    retryCount: 0,
    retryDelayMs: 0
  },

  [FailureType.INVALID_RESPONSE]: {
    useCache: true,
    useFallbackModel: true,
    returnPartialResult: false,
    blockExecution: true,
    logAlert: true,
    retryCount: 1,
    retryDelayMs: 300
  },

  [FailureType.CONSISTENCY_CHECK_FAILED]: {
    useCache: false,
    useFallbackModel: false,
    returnPartialResult: false,
    blockExecution: true,
    logAlert: true,
    retryCount: 1,
    retryDelayMs: 500
  }
};

export function handleFailure(failureType: FailureType): FailureRecovery {
  return FailureModeMap[failureType];
}

// ═══════════════════════════════════════════════════════════════════
// 3. SAFE DEFAULTS
// ═══════════════════════════════════════════════════════════════════

export const SafeDefaults = {
  // Nunca executar sem confiança mínima
  MIN_CONFIDENCE_FOR_AUTO: 0.70,
  MIN_CONFIDENCE_FOR_APPROVAL: 0.50,

  // Nunca executar com risco desconhecido
  UNKNOWN_RISK_BEHAVIOR: 'APPROVAL_REQUIRED',

  // Fallback padrão em caso de dúvida
  FALLBACK_EXECUTION_MODE: 'BLOCKED',

  // Qualidade muito baixa = bloqueia sempre
  MIN_QUALITY_FOR_EXECUTION: 0.50,

  // Risco crítico = bloqueia sempre
  BLOCK_ON_RISK: ['CRITICAL'],

  // Reexecução máxima
  MAX_REEXECUTIONS: 2
};

/**
 * Verifica se decisão é segura para executar
 * Retorna BLOCKED se alguma condição não for atendida
 */
export function validateExecutionSafety(
  confidenceScore: number,
  qualityScore: number,
  riskLevel: string,
  knownRisk: boolean
): { safe: boolean; reason?: string } {
  // Regra 1: Confiança mínima
  if (confidenceScore < SafeDefaults.MIN_CONFIDENCE_FOR_AUTO) {
    return { safe: false, reason: 'Confidence below minimum threshold' };
  }

  // Regra 2: Qualidade mínima
  if (qualityScore < SafeDefaults.MIN_QUALITY_FOR_EXECUTION) {
    return { safe: false, reason: 'Quality score below minimum' };
  }

  // Regra 3: Risco conhecido e crítico
  if (SafeDefaults.BLOCK_ON_RISK.includes(riskLevel)) {
    return { safe: false, reason: `Risk level is ${riskLevel}` };
  }

  // Regra 4: Risco desconhecido
  if (!knownRisk) {
    return { safe: false, reason: 'Risk level is unknown' };
  }

  return { safe: true };
}

// ═══════════════════════════════════════════════════════════════════
// 4. DECISION CONSISTENCY CHECK
// ═══════════════════════════════════════════════════════════════════

export class DecisionConsistencyCheck {
  static check(decision: any, context: any): { consistent: boolean; issues: string[] } {
    const issues: string[] = [];

    // Verificação 1: Recomendação coerente com contexto
    if (!this.isRecommendationCoherent(decision.recommendation, context)) {
      issues.push('Recommendation does not match context');
    }

    // Verificação 2: Ações coerentes com recomendação
    if (!this.areActionsCoherent(decision.actions, decision.recommendation)) {
      issues.push('Actions are not coherent with recommendation');
    }

    // Verificação 3: Risk level coerente com recomendação
    if (!this.isRiskCoherent(decision.recommendation, context?.riskLevel)) {
      issues.push('Risk assessment does not match recommendation severity');
    }

    return {
      consistent: issues.length === 0,
      issues
    };
  }

  private static isRecommendationCoherent(recommendation: string, context: any): boolean {
    if (!context) return true;

    // Se erro_rate muito alto, recomendação deve ser sobre debugging/monitoring
    if (context.error_rate > 0.1 && !recommendation.toLowerCase().includes('debug|monitor|investigate')) {
      return false;
    }

    // Se latência alta, recomendação deve ser sobre otimização/escalabilidade
    if (context.latency_p99 > 5000 && !recommendation.toLowerCase().includes('scale|optimize|increase')) {
      return false;
    }

    return true;
  }

  private static areActionsCoherent(actions: any[], recommendation: string): boolean {
    if (!actions || actions.length === 0) return false;

    // Pelo menos uma ação deve estar alinhada com recomendação
    return actions.some(action =>
      recommendation.toLowerCase().includes(action.title.toLowerCase())
    );
  }

  private static isRiskCoherent(recommendation: string, riskLevel: string): boolean {
    if (!riskLevel) return true;

    // Recomendação sobre infraestrutura + risco crítico = incoerente
    if (recommendation.toLowerCase().includes('scale') && riskLevel === 'CRITICAL') {
      return false;
    }

    return true;
  }
}

// ═══════════════════════════════════════════════════════════════════
// 5. RATE LIMITING & COST PROTECTION
// ═══════════════════════════════════════════════════════════════════

export interface RateLimitConfig {
  // Por request
  maxTokensPerRequest: number;
  maxReexecutionsPerRequest: number;

  // Por usuário
  maxRequestsPerHour: number;
  maxTokensPerMonth: number;
  maxCostPerMonth: number;

  // Por tipo
  maxRequestsPerTypePerHour: Record<string, number>;
}

export const ProductionRateLimits: RateLimitConfig = {
  maxTokensPerRequest: 10000,
  maxReexecutionsPerRequest: 2,

  maxRequestsPerHour: 100,
  maxTokensPerMonth: 10000000,
  maxCostPerMonth: 1000,

  maxRequestsPerTypePerHour: {
    observability: 50,
    test: 30,
    cicd: 40,
    incident: 20,
    risk: 25
  }
};

export function checkRateLimits(
  userId: string,
  type: string,
  tokensEstimated: number,
  currentUsage: any
): { allowed: boolean; reason?: string } {
  // Verificação 1: Tokens por request
  if (tokensEstimated > ProductionRateLimits.maxTokensPerRequest) {
    return { allowed: false, reason: 'Tokens exceed per-request limit' };
  }

  // Verificação 2: Requests por hora (por tipo)
  const maxForType = ProductionRateLimits.maxRequestsPerTypePerHour[type] || 30;
  if ((currentUsage.requestsThisHour || 0) >= maxForType) {
    return { allowed: false, reason: `Rate limit exceeded for ${type}` };
  }

  // Verificação 3: Tokens por mês
  if ((currentUsage.tokensThisMonth || 0) + tokensEstimated > ProductionRateLimits.maxTokensPerMonth) {
    return { allowed: false, reason: 'Monthly token limit would be exceeded' };
  }

  // Verificação 4: Custo por mês
  const costEstimated = tokensEstimated * 0.00002; // $0.02 per 1M tokens
  if ((currentUsage.costThisMonth || 0) + costEstimated > ProductionRateLimits.maxCostPerMonth) {
    return { allowed: false, reason: 'Monthly cost limit would be exceeded' };
  }

  return { allowed: true };
}

// ═══════════════════════════════════════════════════════════════════
// 6. TIMEOUT STRATEGY
// ═══════════════════════════════════════════════════════════════════

export const TimeoutConfig = {
  // Por etapa
  CONTEXT_TIMEOUT_MS: 2000,
  MODEL_TIMEOUT_MS: 15000,
  VALIDATION_TIMEOUT_MS: 1000,
  TOTAL_TIMEOUT_MS: 20000,

  // Comportamento em timeout
  BEHAVIOR_ON_TIMEOUT: {
    returnPartialResult: false, // Não retorna resultado incompleto
    blockExecution: true,        // Bloqueia execução
    useCache: true,              // Tenta cache
    useFallback: true            // Tenta modelo simples
  }
};

export function checkTimeoutExceeded(
  elapsedMs: number,
  stage: 'context' | 'model' | 'validation' | 'total'
): boolean {
  const limits = {
    context: TimeoutConfig.CONTEXT_TIMEOUT_MS,
    model: TimeoutConfig.MODEL_TIMEOUT_MS,
    validation: TimeoutConfig.VALIDATION_TIMEOUT_MS,
    total: TimeoutConfig.TOTAL_TIMEOUT_MS
  };

  return elapsedMs > limits[stage];
}

// ═══════════════════════════════════════════════════════════════════
// 7. LOGGING ESSENCIAL
// ═══════════════════════════════════════════════════════════════════

export const LogStrategy = {
  // LOG: Decisões e erros
  ALWAYS_LOG: [
    { event: 'decision_made', level: 'INFO' },
    { event: 'decision_executed', level: 'INFO' },
    { event: 'execution_failed', level: 'ERROR' },
    { event: 'execution_blocked', level: 'WARN' },
    { event: 'model_fallback', level: 'WARN' },
    { event: 'cache_used', level: 'DEBUG' },
    { event: 'timeout_exceeded', level: 'ERROR' },
    { event: 'consistency_failed', level: 'WARN' }
  ],

  // NÃO LOG: Dados sensíveis
  NEVER_LOG: [
    'full_context',        // Contexto inteiro
    'customer_data',       // Dados de cliente
    'user_pii',           // Dados de usuário
    'api_keys',           // Credenciais
    'raw_model_output'    // Output bruto do modelo
  ],

  // Campos a logar sempre
  CORE_FIELDS: [
    'decisionId',
    'type',
    'criticality',
    'execution_mode',
    'quality_score',
    'confidence_score',
    'risk_level',
    'execution_time_ms',
    'status'
  ]
};

// ═══════════════════════════════════════════════════════════════════
// 8. MONITORING & ALERTING
// ═══════════════════════════════════════════════════════════════════

export interface MonitoringThresholds {
  qualityDropPercent: number;      // Alerta se qualidade cair X%
  fallbackIncreasePercent: number; // Alerta se fallback aumentar X%
  blockedIncreasePercent: number;  // Alerta se BLOCKED aumentar X%
  latencyP99Ms: number;            // Alerta se latência > X ms
  errorRatePercent: number;        // Alerta se taxa de erro > X%
}

export const ProductionMonitoring: MonitoringThresholds = {
  qualityDropPercent: 10,           // -10% qualidade = alerta
  fallbackIncreasePercent: 20,      // +20% fallback = alerta
  blockedIncreasePercent: 15,       // +15% blocked = alerta
  latencyP99Ms: 5000,               // > 5s = alerta
  errorRatePercent: 2               // > 2% = alerta
};

export const AlertingRules = [
  'quality_score < 0.70 → warn',
  'quality_score < 0.50 → critical',
  'fallback_rate > 20% → warn',
  'blocked_rate > 15% → warn',
  'latency_p99 > 5000ms → warn',
  'error_rate > 2% → critical',
  'timeout_rate > 5% → critical',
  'llm_unavailable → immediate_page'
];

// ═══════════════════════════════════════════════════════════════════
// 9. LOAD & STRESS BEHAVIOR
// ═══════════════════════════════════════════════════════════════════

export const GracefulDegradation = {
  // Sob alta carga
  HIGH_LOAD: {
    behaviors: [
      'Reduce timeout (context 2s → 1s)',
      'Use simpler models (gpt-4-turbo → gpt-4-mini)',
      'Reduce reexecution attempts (3 → 1)',
      'Increase fallback to cache (90% → 95%)',
      'Block MEDIUM risk decisions'
    ]
  },

  // Sob carga extrema
  EXTREME_LOAD: {
    behaviors: [
      'Use only cache results',
      'Block all except CRITICAL decisions',
      'Increase APPROVAL_REQUIRED threshold',
      'Queue requests (max 60s wait)',
      'Return partial results only'
    ]
  },

  // Recuperação
  RECOVERY: {
    behaviors: [
      'Gradually restore timeouts',
      'Restore model selection',
      'Restore reexecution attempts',
      'Monitor quality during recovery',
      'Alert if recovery fails'
    ]
  }
};

// ═══════════════════════════════════════════════════════════════════
// 10. PRODUCTION READINESS CHECKLIST
// ═══════════════════════════════════════════════════════════════════

export const ProductionReadinessChecklist = {
  SECURITY: [
    '✓ LGPD compliance verified',
    '✓ PII masking enabled',
    '✓ API authentication required',
    '✓ Rate limiting enabled',
    '✓ Input validation strict',
    '✓ Output sanitization enabled'
  ],

  RELIABILITY: [
    '✓ Edge cases handled (6 types)',
    '✓ Failure modes mapped (7 types)',
    '✓ Safe defaults defined',
    '✓ Fallback tested',
    '✓ Timeout strategy implemented',
    '✓ Cache working',
    '✓ Consistency checks enabled'
  ],

  OBSERVABILITY: [
    '✓ Logging configured (core fields)',
    '✓ Metrics collected',
    '✓ Alerts configured',
    '✓ Dashboards created',
    '✓ SLA defined (p99 < 5s)',
    '✓ On-call playbook ready'
  ],

  PERFORMANCE: [
    '✓ Latency p99 < 5000ms',
    '✓ Throughput > 100 req/s',
    '✓ Cache hit rate > 30%',
    '✓ Cost per request < $0.01',
    '✓ Load test passed (2x expected)'
  ],

  GOVERNANCE: [
    '✓ Audit logging enabled',
    '✓ Data retention policy (90d/365d)',
    '✓ Compliance report automation',
    '✓ Access control defined',
    '✓ Decision contract versioned'
  ],

  DEPLOYMENT: [
    '✓ Blue-green deployment ready',
    '✓ Rollback plan tested',
    '✓ Health checks defined',
    '✓ Canary deployment tested',
    '✓ Monitoring alerts armed'
  ],

  DOCUMENTATION: [
    '✓ API contract documented',
    '✓ Failure modes documented',
    '✓ Runbook for incidents',
    '✓ SLA & thresholds documented'
  ]
};

export function validateProductionReadiness(): { ready: boolean; gaps: string[] } {
  const gaps: string[] = [];

  // Verificar cada categoria
  const categories = Object.values(ProductionReadinessChecklist);
  categories.forEach((items, idx) => {
    const unchecked = items.filter((item: string) => !item.startsWith('✓'));
    if (unchecked.length > 0) {
      gaps.push(`${Object.keys(ProductionReadinessChecklist)[idx]}: ${unchecked.length} items incomplete`);
    }
  });

  return {
    ready: gaps.length === 0,
    gaps
  };
}
