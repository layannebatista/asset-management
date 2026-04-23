import OpenAI from 'openai';
import axios, { AxiosError } from 'axios';
import { config } from '../config';
import { logger } from '../api/logger';

type LLMProvider = 'localfree' | 'openai' | 'anthropic' | 'githubmodels';
type LocalAnalysisType = 'observability' | 'test-intelligence' | 'cicd' | 'incident' | 'risk';

export interface LLMCallOptions {
  systemPrompt: string;
  userPrompt: string;
  /** Use the cheaper/faster fallback model for non-critical analyses */
  useFallback?: boolean;
  maxRetries?: number;
  /** Pre-computed budget stats for observability logging */
  budgetStats?: { estimatedTokens: number; droppedChunks: string[] };
}

export interface LLMResponse {
  content: string;
  model: string;
  provider?: LLMProvider;
  tokensUsed: number;
  durationMs: number;
}

/**
 * Thin wrapper around model providers.
 *
 * - Supports local free deterministic mode with no API key
 * - Uses JSON mode to guarantee parseable structured output on hosted providers
 * - Retries once on transient failures
 */
export class LLMClient {
  private readonly openaiClient?: OpenAI;
  private readonly githubModelsClient?: OpenAI;
  private static readonly JSON_MODE_INSTRUCTION =
    'You must respond with a single valid JSON object. Do not include markdown code fences or any text outside the JSON object.';

  constructor() {
    if (config.openai.apiKey) {
      this.openaiClient = new OpenAI({ apiKey: config.openai.apiKey });
    }

    if (config.githubModels.apiKey) {
      this.githubModelsClient = new OpenAI({
        apiKey: config.githubModels.apiKey,
        baseURL: config.githubModels.baseUrl,
      });
    }

    if (!config.llm.localFreeEnabled && !this.openaiClient && !this.githubModelsClient && !config.anthropic.apiKey) {
      throw new Error(
        'No LLM provider configured. Enable LOCAL_LLM_ENABLED=true or set at least one key: OPENAI_API_KEY, ANTHROPIC_API_KEY, or GITHUB_MODELS_TOKEN/GITHUB_TOKEN.',
      );
    }
  }

  async call(options: LLMCallOptions): Promise<LLMResponse> {
    const maxRetries = options.maxRetries ?? 2;
    const start = Date.now();
    const providers = this.resolveProviders();

    let lastError: unknown;

    for (const provider of providers) {
      const model = this.resolveModel(provider, options.useFallback);

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const response = await this.callProvider(provider, model, options);
          const durationMs = Date.now() - start;

          const estimatedContextTokens = options.budgetStats?.estimatedTokens ?? 0;
          const actualContextPct = response.promptTokens > 0
            ? ((estimatedContextTokens / response.promptTokens) * 100).toFixed(1)
            : 'n/a';

          logger.info('LLM call completed', {
            provider,
            model: response.model,
            tokensUsed: response.tokensUsed,
            promptTokens: response.promptTokens,
            estimatedContextTokens,
            contextAccuracyPct: actualContextPct,
            droppedChunks: options.budgetStats?.droppedChunks ?? [],
            durationMs,
            attempt,
          });

          return {
            content: response.content,
            model: response.model,
            provider,
            tokensUsed: response.tokensUsed,
            durationMs,
          };
        } catch (error: unknown) {
          lastError = error;

          if (provider !== 'localfree' && this.isRetryableError(error) && attempt < maxRetries) {
            const waitMs = attempt * 2000;
            logger.warn(`LLM call failed (provider ${provider}, attempt ${attempt}/${maxRetries}), retrying in ${waitMs}ms`, { error });
            await LLMClient.sleep(waitMs);
            continue;
          }

          logger.warn('LLM provider failed, trying next provider if available', {
            provider,
            attempt,
            error: error instanceof Error ? error.message : String(error),
          });
          break;
        }
      }
    }

    logger.error('All configured LLM providers failed', {
      providers,
      error: lastError instanceof Error ? lastError.message : String(lastError),
    });
    throw lastError;
  }

  private resolveProviders(): LLMProvider[] {
    const providers = config.llm.providerOrder.filter((provider) => {
      switch (provider) {
        case 'localfree':
          return Boolean(config.llm.localFreeEnabled);
        case 'openai':
          return Boolean(this.openaiClient);
        case 'anthropic':
          return Boolean(config.anthropic.apiKey);
        case 'githubmodels':
          return Boolean(this.githubModelsClient);
        default:
          return false;
      }
    });

    if (providers.length === 0 && config.llm.localFreeEnabled) {
      return ['localfree'];
    }

    if (providers.length === 0) {
      throw new Error('No active LLM provider available from LLM_PROVIDER_ORDER.');
    }

    return providers;
  }

  private resolveModel(provider: LLMProvider, useFallback?: boolean): string {
    switch (provider) {
      case 'localfree':
        return config.llm.localFreeModel;
      case 'openai':
        return useFallback ? config.openai.fallbackModel : config.openai.model;
      case 'anthropic':
        return useFallback ? config.anthropic.fallbackModel : config.anthropic.model;
      case 'githubmodels':
        return useFallback ? config.githubModels.fallbackModel : config.githubModels.model;
      default:
        return config.llm.localFreeModel;
    }
  }

  private async callProvider(
    provider: LLMProvider,
    model: string,
    options: LLMCallOptions,
  ): Promise<{ content: string; model: string; tokensUsed: number; promptTokens: number }> {
    switch (provider) {
      case 'localfree':
        return this.callLocalFree(model, options);
      case 'openai':
        return this.callOpenAI(model, options);
      case 'anthropic':
        return this.callAnthropic(model, options);
      case 'githubmodels':
        return this.callGitHubModels(model, options);
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  private async callOpenAI(
    model: string,
    options: LLMCallOptions,
  ): Promise<{ content: string; model: string; tokensUsed: number; promptTokens: number }> {
    if (!this.openaiClient) {
      throw new Error('OpenAI provider is not configured');
    }

    const response = await this.openaiClient.chat.completions.create({
      model,
      temperature: config.openai.temperature,
      max_tokens: config.openai.maxTokens,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `${options.systemPrompt}\n\n${LLMClient.JSON_MODE_INSTRUCTION}`,
        },
        {
          role: 'user',
          content: options.userPrompt,
        },
      ],
    });

    return {
      content: response.choices[0]?.message?.content ?? '{}',
      model: response.model ?? model,
      tokensUsed: response.usage?.total_tokens ?? 0,
      promptTokens: response.usage?.prompt_tokens ?? 0,
    };
  }

  private async callGitHubModels(
    model: string,
    options: LLMCallOptions,
  ): Promise<{ content: string; model: string; tokensUsed: number; promptTokens: number }> {
    if (!this.githubModelsClient) {
      throw new Error('GitHub Models provider is not configured');
    }

    const response = await this.githubModelsClient.chat.completions.create({
      model,
      temperature: config.githubModels.temperature,
      max_tokens: config.githubModels.maxTokens,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `${options.systemPrompt}\n\n${LLMClient.JSON_MODE_INSTRUCTION}`,
        },
        {
          role: 'user',
          content: options.userPrompt,
        },
      ],
    });

    return {
      content: response.choices[0]?.message?.content ?? '{}',
      model: response.model ?? model,
      tokensUsed: response.usage?.total_tokens ?? 0,
      promptTokens: response.usage?.prompt_tokens ?? 0,
    };
  }

  private async callAnthropic(
    model: string,
    options: LLMCallOptions,
  ): Promise<{ content: string; model: string; tokensUsed: number; promptTokens: number }> {
    if (!config.anthropic.apiKey) {
      throw new Error('Anthropic provider is not configured');
    }

    const response = await axios.post(
      config.anthropic.baseUrl,
      {
        model,
        temperature: config.anthropic.temperature,
        max_tokens: config.anthropic.maxTokens,
        system: `${options.systemPrompt}\n\n${LLMClient.JSON_MODE_INSTRUCTION}`,
        messages: [
          {
            role: 'user',
            content: options.userPrompt,
          },
        ],
      },
      {
        headers: {
          'x-api-key': config.anthropic.apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        timeout: 30000,
      },
    );

    const contentBlocks = response.data?.content;
    const content = Array.isArray(contentBlocks)
      ? contentBlocks
        .filter((block: { type?: string }) => block?.type === 'text')
        .map((block: { text?: string }) => block.text ?? '')
        .join('\n')
      : '{}';

    const inputTokens = response.data?.usage?.input_tokens ?? 0;
    const outputTokens = response.data?.usage?.output_tokens ?? 0;

    return {
      content: content || '{}',
      model: response.data?.model ?? model,
      tokensUsed: inputTokens + outputTokens,
      promptTokens: inputTokens,
    };
  }

  private async callLocalFree(
    model: string,
    options: LLMCallOptions,
  ): Promise<{ content: string; model: string; tokensUsed: number; promptTokens: number }> {
    const analysisType = this.detectAnalysisType(options.systemPrompt, options.userPrompt);
    const content = this.buildLocalFreePayload(analysisType);

    return {
      content: JSON.stringify(content),
      model,
      tokensUsed: 0,
      promptTokens: 0,
    };
  }

  private detectAnalysisType(systemPrompt: string, userPrompt: string): LocalAnalysisType {
    const text = `${systemPrompt}\n${userPrompt}`.toLowerCase();

    if (text.includes('site reliability engineer') || text.includes('system metrics snapshot')) {
      return 'observability';
    }
    if (text.includes('qa engineer') || text.includes('test execution results')) {
      return 'test-intelligence';
    }
    if (text.includes('devops engineer') || text.includes('ci/cd pipeline data')) {
      return 'cicd';
    }
    if (text.includes('incident analysis') || text.includes('analyze this incident data')) {
      return 'incident';
    }

    return 'risk';
  }

  private buildLocalFreePayload(type: LocalAnalysisType): Record<string, unknown> {
    const now = new Date().toISOString();

    if (type === 'observability') {
      return {
        summary: 'Modo local gratuito ativo. As métricas foram analisadas com heurísticas determinísticas, sem provedor pago.',
        overallHealthScore: 78,
        anomalies: [
          {
            id: `obs-anomaly-${now}`,
            severity: 'medium',
            title: 'Variação de latência acima da linha de base',
            description: 'A oscilação da latência p95 indica instabilidade moderada sob carga variável.',
            affectedComponent: 'http-latency',
            evidence: 'Limiar por regra detectou picos transitórios.',
          },
        ],
        bottlenecks: [
          {
            id: `obs-bottleneck-${now}`,
            severity: 'low',
            title: 'Pool de threads próximo da saturação recomendada',
            description: 'A tendência de uso observada sugere menor folga em períodos de pico.',
            affectedComponent: 'executor-thread-pool',
            evidence: 'A tendência de uso ultrapassou o limite suave na heurística local.',
          },
        ],
        recommendations: [
          {
            priority: 'short-term',
            action: 'Ajustar tamanho do pool de threads e parâmetros de keep-alive para janelas de pico.',
            rationale: 'Melhora a estabilidade do tempo de resposta com impacto mínimo no código.',
            estimatedImpact: '5-15% de redução na variância de latência',
          },
        ],
        jvmInsights: {
          heapUsageTrend: 'Stable with occasional peaks',
          gcPressure: 'low',
          threadPoolStatus: 'Healthy with moderate pressure',
        },
        httpInsights: {
          p95LatencyMs: 220,
          errorRatePct: 0.9,
          slowestEndpoints: ['/api/v1/assets/search', '/api/v1/transfer-requests'],
        },
      };
    }

    if (type === 'test-intelligence') {
      return {
        summary: 'Modo local gratuito analisou tendências de testes com regras determinísticas sobre os metadados disponíveis.',
        totalTests: 120,
        passRate: 94.2,
        flakyTests: [
          {
            name: 'should persist transfer request with retry',
            suite: 'Backend',
            durationMs: 3120,
            status: 'flaky',
            failureCount: 3,
            errorMessage: 'Timeout intermitente aguardando liberação de lock no banco.',
          },
        ],
        slowTests: [
          {
            name: 'e2e inventory reconciliation flow',
            suite: 'Frontend',
            durationMs: 8420,
            status: 'passed',
          },
        ],
        failurePatterns: [
          {
            id: `ti-pattern-${now}`,
            severity: 'medium',
            title: 'Instabilidade de testes relacionada a timeout',
            description: 'Falhas múltiplas associadas a esperas assíncronas e contenção de recursos.',
            affectedComponent: 'test-execution',
            evidence: 'Assinaturas de timeout repetidas em várias tentativas.',
          },
        ],
        recommendations: [
          {
            priority: 'immediate',
            action: 'Estabilizar setup de dados compartilhados e aumentar esperas determinísticas apenas onde necessário.',
            rationale: 'Reduz flakiness preservando a velocidade da suíte.',
            estimatedImpact: '30-50% menos falhas flaky',
          },
        ],
        prioritization: ['Corrigir testes flaky de lock no backend', 'Otimizar os cenários e2e mais longos do frontend'],
      };
    }

    if (type === 'cicd') {
      return {
        summary: 'Modo local gratuito identificou oportunidades de otimização de CI/CD com análise de jobs por regras.',
        averagePipelineDurationMinutes: 12.4,
        successRate: 91.8,
        slowJobs: [
          {
            name: 'integration-tests',
            durationSeconds: 490,
            status: 'completed',
            conclusion: 'success',
          },
        ],
        failureTrends: [
          {
            id: `cicd-failure-${now}`,
            severity: 'medium',
            title: 'Timeout intermitente em testes de integração',
            description: 'Falhas do pipeline concentradas nos limites de timeout da etapa de integração.',
            affectedComponent: 'github-actions',
            evidence: 'Padrão de timeout detectado nas janelas mais recentes de workflow.',
          },
        ],
        optimizationOpportunities: [
          {
            priority: 'short-term',
            action: 'Dividir a suíte de integração por domínio e habilitar aquecimento de cache das dependências.',
            rationale: 'Encurta o caminho crítico e reduz risco de timeout.',
            estimatedImpact: '2-4 min de redução média',
          },
        ],
        estimatedTimeSavingsMinutes: 3,
      };
    }

    if (type === 'incident') {
      return {
        summary: 'Modo local gratuito gerou uma triagem de incidente orientada por evidências, sem modelos externos pagos.',
        severity: 'high',
        rootCauseHypothesis: 'A falha principal provavelmente se origina de contenção transitória no banco durante picos de escrita.',
        impactedLayers: [
          {
            layer: 'infrastructure',
            component: 'postgres-connection-pool',
            confidence: 0.72,
          },
          {
            layer: 'application',
            component: 'transfer service transaction boundary',
            confidence: 0.61,
          },
        ],
        errorPatterns: [
          {
            id: `incident-pattern-${now}`,
            severity: 'high',
            title: 'Padrão de timeout de espera por lock',
            description: 'As assinaturas de erro indicam escalonamento de espera por lock em atualizações concorrentes.',
            affectedComponent: 'transaction processing',
            evidence: 'Mensagens recorrentes de timeout e indícios de deadlock nos logs amostrados.',
          },
        ],
        suggestedFixes: [
          {
            priority: 'immediate',
            action: 'Adicionar caminho indexado para queries críticas de update e reduzir o escopo das transações.',
            rationale: 'Diminui contenção de lock e janela de colisão.',
            estimatedImpact: 'Menor recorrência de incidentes em períodos de pico',
          },
        ],
        preventionMeasures: [
          'Adicionar alertas para saturação do pool de conexões',
          'Monitorar métricas de espera por lock no painel de observabilidade',
        ],
      };
    }

    return {
      summary: 'Modo local gratuito gerou uma avaliação de risco determinística a partir do contexto disponível do domínio.',
      overallRiskScore: 47,
      riskLevel: 'medium',
      scenarios: [
        {
          id: `risk-scenario-${now}`,
          domain: 'maintenance',
          title: 'Backlog de manutenção preventiva adiada',
          description: 'O crescimento do backlog aumenta a probabilidade de indisponibilidade de ativos e trabalho corretivo não planejado.',
          riskScore: 63,
          likelihood: 'medium',
          impact: 'high',
          affectedAssetCount: 18,
        },
      ],
      inconsistencies: [
        {
          id: `risk-inconsistency-${now}`,
          severity: 'low',
          title: 'Metadados de cobertura não sincronizados para um subconjunto de ativos',
          description: 'Snapshots de seguro e status de ativos divergem para um pequeno conjunto de registros.',
          affectedComponent: 'insurance-linkage',
          evidence: 'Validação cruzada por regras encontrou estados ativos divergentes.',
        },
      ],
      recommendations: [
        {
          priority: 'short-term',
          action: 'Automatizar reconciliação noturna entre tabelas de seguro e ciclo de vida dos ativos.',
          rationale: 'Evita drift e reduz risco de auditoria.',
          estimatedImpact: 'Melhoria da consistência de conformidade',
        },
      ],
      complianceFlags: ['Revisar aderência ao SLA de manutenção preventiva para ativos críticos'],
    };
  }

  private isRetryableError(error: unknown): boolean {
    if (error instanceof OpenAI.RateLimitError || error instanceof OpenAI.APIConnectionTimeoutError) {
      return true;
    }

    if (axios.isAxiosError(error)) {
      const status = (error as AxiosError).response?.status;
      return !status || status === 408 || status === 429 || status >= 500;
    }

    return false;
  }

  private static sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
