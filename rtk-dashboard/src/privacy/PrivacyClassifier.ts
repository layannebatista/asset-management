import { Logger } from 'winston';
import * as crypto from 'crypto';

export type SensitivityLevel = 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED';
export type DataType = 'user_id' | 'email' | 'phone' | 'ip_address' | 'credit_card' | 'medical' | 'financial' | 'location' | 'biometric' | 'other';

export interface DataClassification {
  level: SensitivityLevel;
  detected_data_types: DataType[];
  pii_detected: boolean;
  compliance_requirement: 'GDPR' | 'HIPAA' | 'PCI-DSS' | 'CCPA' | 'LGPD' | null;
  requires_masking: boolean;
  requires_local_processing: boolean;
  rationale: string;
}

export interface MaskingConfig {
  data_types_to_mask: DataType[];
  masking_strategy: 'redact' | 'hash' | 'tokenize' | 'replace_with_placeholder';
  preserve_structure: boolean;
}

export class PrivacyClassifier {
  private readonly logger: Logger;
  private detection_patterns: Record<DataType | 'other', RegExp> = {
    user_id: /\b(user_?id|uid|user_number|userid)\b/i,
    email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,
    phone: /(\+\d{1,3}[-.\s]?)?(\(?\d{2,4}\)?[-.\s]?)?(\d{3,4}[-.\s]?\d{3,4})/,
    ip_address: /(\d{1,3}\.){3}\d{1,3}/,
    credit_card: /\b(?:\d{4}[-\s]?){3}\d{4}\b/,
    medical: /\b(diagnosis|medication|patient_?id|health_record|medical_history)\b/i,
    financial: /\b(salary|revenue|profit|account_number|bank|invoice|ssn)\b/i,
    location: /\b(latitude|longitude|zipcode|postal_code|geolocation)\b/i,
    biometric: /\b(fingerprint|face_id|retina|dna|iris)\b/i,
    other: /./,
  };

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Classifica sensibilidade do contexto
   */
  classify(context: Record<string, unknown>): DataClassification {
    const context_str = JSON.stringify(context);
    const detected_types: DataType[] = [];

    // Detectar tipos de dados sensíveis
    for (const [data_type, pattern] of Object.entries(this.detection_patterns)) {
      if (data_type === 'other') continue;
      if (pattern.test(context_str)) {
        detected_types.push(data_type as DataType);
      }
    }

    // Determinar nível de sensibilidade
    const level = this.determineSensitivityLevel(detected_types);

    // Determinar requisito compliance
    const compliance = this.determineComplianceRequirement(detected_types);

    // Decidir sobre masking
    const requires_masking = detected_types.length > 0;
    const requires_local_processing = level === 'RESTRICTED' || compliance === 'HIPAA';

    const rationale = this.generateRationale(detected_types, level, compliance);

    this.logger.info('Privacy classification', {
      level,
      detected_types_count: detected_types.length,
      detected_types: detected_types.slice(0, 5),
      pii_detected: detected_types.length > 0,
      requires_masking,
      requires_local_processing,
      compliance,
    });

    return {
      level,
      detected_data_types: detected_types,
      pii_detected: detected_types.length > 0,
      compliance_requirement: compliance,
      requires_masking,
      requires_local_processing,
      rationale,
    };
  }

  /**
   * Aplica masking automático
   */
  mask(context: Record<string, unknown>, config: MaskingConfig): Record<string, unknown> {
    const masked = JSON.parse(JSON.stringify(context));

    const maskValue = (value: string, data_type: DataType): string => {
      switch (config.masking_strategy) {
        case 'redact':
          return '[REDACTED]';

        case 'hash':
          const hash = crypto.createHash('sha256').update(value).digest('hex');
          return `[HASH:${hash.slice(0, 8)}]`;

        case 'tokenize':
          return `[${data_type.toUpperCase()}_TOKEN]`;

        case 'replace_with_placeholder':
          if (data_type === 'email' && config.preserve_structure) {
            const [local] = value.split('@');
            return `${local.charAt(0)}***@***.***`;
          }
          return `[${data_type.toUpperCase()}]`;

        default:
          return value;
      }
    };

    // Aplicar masking recursivamente
    const applyMasking = (obj: any, depth = 0): any => {
      if (depth > 10) return obj;  // Prevenir recursão infinita
      if (typeof obj !== 'object' || obj === null) return obj;

      const result = Array.isArray(obj) ? [...obj] : { ...obj };

      for (const key in result) {
        const value = result[key];
        const value_str = String(value);

        // Checar se o valor contém dados sensíveis
        for (const data_type of config.data_types_to_mask) {
          const pattern = this.detection_patterns[data_type];
          if (pattern && pattern.test(value_str)) {
            result[key] = maskValue(value_str, data_type);
            this.logger.debug('Value masked', { field: key, data_type, depth });
            break;
          }
        }

        // Recursão para nested objects
        if (typeof result[key] === 'object' && result[key] !== null) {
          result[key] = applyMasking(result[key], depth + 1);
        }
      }

      return result;
    };

    return applyMasking(masked);
  }

  /**
   * Decide se deve usar modelo local
   */
  shouldUseLocalModel(classification: DataClassification): boolean {
    return classification.requires_local_processing || classification.level === 'RESTRICTED';
  }

  // ──────────────────────────────────────────────────────────────────

  private determineSensitivityLevel(detected_types: DataType[]): SensitivityLevel {
    const critical_types: DataType[] = ['credit_card', 'medical', 'biometric'];
    const has_critical = detected_types.some((t) => critical_types.includes(t));

    if (has_critical) return 'RESTRICTED';
    if (detected_types.length > 3) return 'CONFIDENTIAL';
    if (detected_types.length > 0) return 'INTERNAL';
    return 'PUBLIC';
  }

  private determineComplianceRequirement(
    detected_types: DataType[]
  ): 'GDPR' | 'HIPAA' | 'PCI-DSS' | 'CCPA' | 'LGPD' | null {
    if (detected_types.includes('medical')) return 'HIPAA';
    if (detected_types.includes('credit_card')) return 'PCI-DSS';
    if (detected_types.includes('user_id') || detected_types.includes('email')) return 'GDPR';
    return null;
  }

  private generateRationale(detected_types: DataType[], level: SensitivityLevel, compliance: string | null): string {
    const reasons: string[] = [];

    if (detected_types.length > 0) {
      reasons.push(`Found ${detected_types.length} sensitive data type(s): ${detected_types.join(', ')}`);
    }

    if (level === 'RESTRICTED') {
      reasons.push(`Critical sensitivity → local processing required`);
    }

    if (compliance) {
      reasons.push(`Compliance requirement: ${compliance}`);
    }

    return reasons.join('; ') || 'No sensitive data detected';
  }
}
