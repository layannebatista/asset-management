import { Logger } from 'winston';
import { LLMClient } from '../clients/LLMClient';

export enum SensitivityLevel {
  PUBLIC = 'public',              // OK para modelo cloud
  INTERNAL = 'internal',          // Empresa, não confidencial
  CONFIDENTIAL = 'confidential',  // NDA/propriedade
  RESTRICTED = 'restricted',      // PII/LGPD/segurança
}

export interface ClassificationResult {
  level: SensitivityLevel;
  method: 'rule' | 'llm';
  confidence: number;
  patterns: string[];
}

/**
 * SecurityClassifier: Detecta dados sensíveis (PII, LGPD) usando padrões + LLM
 *
 * Padrões cobertos:
 * - CPF/CNPJ (Brazilian ID)
 * - Email, telefone
 * - Senhas, tokens, chaves
 * - Números de cartão
 * - Dados confidenciais
 */
export class SecurityClassifier {
  private readonly llm: LLMClient;
  private readonly logger: Logger;
  private patterns: Map<SensitivityLevel, RegExp[]> = new Map();
  private readonly patternNames: Map<string, string> = new Map();

  constructor(llm: LLMClient, logger: Logger) {
    this.llm = llm;
    this.logger = logger;
    this._initPatterns();
  }

  /**
   * Classificar sensibilidade de um texto
   * Tenta padrões primeiro (rápido), depois LLM se ambíguo
   */
  async classify(text: string): Promise<ClassificationResult> {
    // ── Step 1: Tentar padrões (fast path)
    for (const [level, regexps] of this.patterns) {
      const matches = regexps.filter((r) => r.test(text));
      if (matches.length > 0) {
        this.logger.debug('Classified by rule', {
          level,
          patternCount: matches.length,
        });

        return {
          level,
          method: 'rule',
          confidence: 0.95,
          patterns: this.patternNames
            .entries()
            .filter(([_, re]) => matches.includes(re as RegExp))
            .map(([name]) => name)
            .slice(0, 3),
        };
      }
    }

    // ── Step 2: LLM para casos ambíguos (slow path)
    try {
      const response = await this.llm.call({
        systemPrompt: `You are a security classifier for LGPD compliance.
Classify the sensitivity level of this text.
Respond with JSON: { "level": "public" | "internal" | "confidential" | "restricted" }`,
        userPrompt: `Text to classify:\n${text.substring(0, 2000)}`,
      });

      const parsed = JSON.parse(response.content);
      const level = parsed.level as SensitivityLevel;

      this.logger.debug('Classified by LLM', {
        level,
        textLength: text.length,
      });

      return {
        level,
        method: 'llm',
        confidence: 0.7,
        patterns: ['LLM_BASED'],
      };
    } catch (error) {
      // Default to conservative
      this.logger.warn('Classification failed, defaulting to RESTRICTED', {
        error: error instanceof Error ? error.message : 'unknown',
      });

      return {
        level: SensitivityLevel.RESTRICTED,
        method: 'rule',
        confidence: 0.5,
        patterns: ['DEFAULT_CONSERVATIVE'],
      };
    }
  }

  /**
   * Mascarar dados sensíveis em um texto
   */
  mask(text: string, level: SensitivityLevel = SensitivityLevel.RESTRICTED): string {
    if (level === SensitivityLevel.PUBLIC) {
      return text;
    }

    let masked = text;

    // Aplicar masking para todos os níveis de sensibilidade
    for (const [maskLevel, regexps] of this.patterns) {
      if (maskLevel !== SensitivityLevel.PUBLIC) {
        regexps.forEach((r) => {
          masked = masked.replace(r, '[REDACTED]');
        });
      }
    }

    this.logger.debug('Text masked', {
      originalLength: text.length,
      maskedLength: masked.length,
      reductionPercent: (
        ((text.length - masked.length) / text.length) *
        100
      ).toFixed(1),
    });

    return masked;
  }

  /**
   * Mascarar dados sensíveis com padrões específicos (mais granular)
   */
  maskPartial(text: string, patterns: SensitivityLevel[]): string {
    let masked = text;

    for (const level of patterns) {
      const regexps = this.patterns.get(level) || [];
      regexps.forEach((r) => {
        masked = masked.replace(r, '[REDACTED]');
      });
    }

    return masked;
  }

  /**
   * Extrair padrões sensíveis encontrados em um texto
   */
  extract(text: string): {
    level: SensitivityLevel;
    matches: string[];
  }[] {
    const found: { level: SensitivityLevel; matches: string[] }[] = [];

    for (const [level, regexps] of this.patterns) {
      if (level === SensitivityLevel.PUBLIC) continue;

      const matches: string[] = [];
      regexps.forEach((r) => {
        const textMatches = text.match(r);
        if (textMatches) {
          matches.push(...textMatches);
        }
      });

      if (matches.length > 0) {
        found.push({
          level,
          matches: [...new Set(matches)], // Remove duplicatas
        });
      }
    }

    return found;
  }

  /**
   * Inicializar padrões regex para cada nível de sensibilidade
   */
  private _initPatterns() {
    // ════════════════════════════════════════════════════════════════
    // RESTRICTED: PII, LGPD, segurança
    // ════════════════════════════════════════════════════════════════
    const restrictedPatterns = [
      // CPF: XXX.XXX.XXX-XX ou XXXXXXXXXXX
      {
        name: 'cpf',
        pattern: /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g,
      },
      // CNPJ: XX.XXX.XXX/XXXX-XX
      {
        name: 'cnpj',
        pattern: /\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/g,
      },
      // Email
      {
        name: 'email',
        pattern: /[\w\.-]+@[\w\.-]+\.\w+/g,
      },
      // Telefone: (XX) XXXXX-XXXX ou similares
      {
        name: 'phone',
        pattern: /(?:\+?55)?[\s]?(?:\(\d{2}\))?[\s]?9?\d{4}-?\d{4}/g,
      },
      // Senhas, tokens, keys
      {
        name: 'credentials',
        pattern: /(?:password|senha|token|key|secret|api_key)[\s:=]+[\w\-\.\+\/]+/gi,
      },
      // Cartão de crédito (padrão básico)
      {
        name: 'credit_card',
        pattern: /\b(?:\d{4}[\s-]?){3}\d{4}\b/g,
      },
      // RG
      {
        name: 'rg',
        pattern: /\b\d{1,2}\.\d{3}\.\d{3}-?[0-9X]\b/g,
      },
    ];

    const restrictedRegexps = restrictedPatterns.map((p) => {
      this.patternNames.set(p.name, p.pattern.toString());
      return p.pattern;
    });

    this.patterns.set(SensitivityLevel.RESTRICTED, restrictedRegexps);

    // ════════════════════════════════════════════════════════════════
    // CONFIDENTIAL: Propriedade, NDA
    // ════════════════════════════════════════════════════════════════
    const confidentialPatterns = [
      /(?:trade[- ]?secret|segredo[- ]?comercial|proprietary)/gi,
      /(?:nda|confidential|confidencial|under nda)/gi,
      /(?:internal[- ]?only|apenas[- ]?internamente|somente[- ]?interno)/gi,
    ];

    this.patterns.set(SensitivityLevel.CONFIDENTIAL, confidentialPatterns);

    // ════════════════════════════════════════════════════════════════
    // INTERNAL: Nomes de empresa, info de time
    // ════════════════════════════════════════════════════════════════
    const internalPatterns = [
      /patrimônio[- ]?360|patrimonio[- ]?360/gi,
      /(?:internal|interno)(?:[- ]only)?/gi,
    ];

    this.patterns.set(SensitivityLevel.INTERNAL, internalPatterns);

    // ════════════════════════════════════════════════════════════════
    // PUBLIC: Padrão vazio (catch-all)
    // ════════════════════════════════════════════════════════════════
    this.patterns.set(SensitivityLevel.PUBLIC, []);
  }
}
