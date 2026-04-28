import { Logger } from 'winston';
import {
  SecurityClassifier,
  SensitivityLevel,
  ClassificationResult,
} from './SecurityClassifier';
import { ModelRouter } from '../routing/ModelRouter';
import { AnalysisType } from '../types/analysis.types';

export interface SecureRoutingDecision {
  model: {
    modelName: string;
    costEstimate: number;
  };
  sensitivity: SensitivityLevel;
  masked: boolean;
  maskedContext: string;
  reason: string;
  auditLog: {
    timestamp: Date;
    classification: ClassificationResult;
    decision: string;
  };
}

/**
 * SecureRouter: Roteia de forma segura considerando sensibilidade de dados
 *
 * Lógica:
 * - RESTRICTED (PII/LGPD): Usa modelo local (se disponível) + máscara
 * - CONFIDENTIAL: Máscara antes de cloud model
 * - INTERNAL/PUBLIC: Permite cloud model normal
 */
export class SecureRouter {
  private readonly classifier: SecurityClassifier;
  private readonly modelRouter: ModelRouter;
  private readonly logger: Logger;

  constructor(
    classifier: SecurityClassifier,
    modelRouter: ModelRouter,
    logger: Logger,
  ) {
    this.classifier = classifier;
    this.modelRouter = modelRouter;
    this.logger = logger;
  }

  /**
   * Rotear de forma segura considerando sensibilidade
   */
  async routeSecurely(
    analysisType: AnalysisType,
    context: string,
    contextSize: number,
  ): Promise<SecureRoutingDecision> {
    // ── Step 1: Classificar sensibilidade
    const classification = await this.classifier.classify(context);
    const sensitivity = classification.level;

    // ── Step 2: Determinar se precisa mascarar/usar modelo local
    let requiresLocalModel = false;
    let shouldMask = false;
    let decisionReason = '';

    switch (sensitivity) {
      case SensitivityLevel.RESTRICTED:
        requiresLocalModel = true;
        shouldMask = true;
        decisionReason =
          'Dados PII/LGPD detectados: roteando para modelo local com masking';
        break;

      case SensitivityLevel.CONFIDENTIAL:
        shouldMask = true;
        decisionReason =
          'Dados confidenciais detectados: mascarando antes de enviar para cloud LLM';
        break;

      case SensitivityLevel.INTERNAL:
      case SensitivityLevel.PUBLIC:
        // OK para cloud LLM
        decisionReason = `Dados ${sensitivity}: permitido modelo cloud padrão`;
        break;
    }

    // ── Step 3: Mascarar contexto se necessário
    const maskedContext = shouldMask ? this.classifier.mask(context, sensitivity) : context;

    // ── Step 4: Rotear modelo
    const routingAnalysisType = analysisType === 'multi-agent' ? 'observability' : analysisType;
    const privacyLevel: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED' =
      sensitivity === SensitivityLevel.RESTRICTED
        ? 'RESTRICTED'
        : sensitivity === SensitivityLevel.CONFIDENTIAL
          ? 'CONFIDENTIAL'
          : sensitivity === SensitivityLevel.INTERNAL
            ? 'INTERNAL'
            : 'PUBLIC';

    const routingContext = {
      analysis_type: routingAnalysisType,
      criticality: 'NORMAL' as const,
      context_size: contextSize || maskedContext.length,
      privacy_level: privacyLevel,
      has_pii: sensitivity === SensitivityLevel.RESTRICTED || sensitivity === SensitivityLevel.CONFIDENTIAL,
    };

    const modelDecision = await this.modelRouter.route(routingContext);

    this.logger.info('Decisão de roteamento seguro', {
      analysisType,
      sensitivity,
      model: modelDecision.primary_model,
      masked: shouldMask,
      requiresLocalModel,
      reason: decisionReason,
    });

    return {
      model: {
        modelName: modelDecision.primary_model,
        costEstimate: modelDecision.estimated_cost,
      },
      sensitivity,
      masked: shouldMask,
      maskedContext,
      reason: decisionReason,
      auditLog: {
        timestamp: new Date(),
        classification,
        decision: decisionReason,
      },
    };
  }

  /**
   * Extrair dados sensíveis encontrados em contexto
   * (útil para auditoria e alertas)
   */
  extractSensitiveData(context: string): {
    level: SensitivityLevel;
    count: number;
    examples: string[];
  }[] {
    const extracted = this.classifier.extract(context);

    return extracted.map((e) => ({
      level: e.level,
      count: e.matches.length,
      examples: e.matches.slice(0, 3), // Primeiros 3 exemplos
    }));
  }

  /**
   * Validar se contexto é seguro para enviar para modelo específico
   */
  isSafeFor(
    context: string,
    modelName: string,
    userTier: string,
  ): { safe: boolean; reason: string } {
    // Modelos locais aceitam tudo
    if (modelName === 'local-llm') {
      return {
        safe: true,
        reason: 'Modelo local aceita todos os níveis de sensibilidade',
      };
    }

    // Cloud models: rejeitar RESTRICTED, aceitar outros
    const classification = this.classifier.extract(context);
    const hasRestricted = classification.some((c) => c.level === SensitivityLevel.RESTRICTED);

    if (hasRestricted) {
      return {
        safe: false,
        reason: `Dados RESTRICTED (PII/LGPD) não permitidos em modelo cloud "${modelName}". Use modelo local.`,
      };
    }

    return {
      safe: true,
      reason: `Contexto seguro para modelo cloud "${modelName}"`,
    };
  }

  /**
   * Adicionar auditoria de acesso a dados sensíveis
   */
  auditAccess(
    userId: string,
    analysisType: AnalysisType,
    sensitivity: SensitivityLevel,
    action: 'classify' | 'mask' | 'extract',
  ): void {
    this.logger.warn('Auditoria de acesso a dados sensíveis', {
      userId,
      analysisType,
      sensitivity,
      action,
      timestamp: new Date().toISOString(),
    });

    // Em produção, isso seria enviado para um audit log centralizado
    // por exemplo, um sistema de auditoria LGPD dedicado
  }
}
