/**
 * OpenTelemetry instrumentation setup for AI Intelligence
 *
 * Exports metrics:
 * - ai_analysis_duration_ms (histogram)
 * - ai_llm_call_duration_ms (histogram)
 * - ai_llm_tokens_used (counter)
 * - ai_llm_cost_usd (counter)
 * - ai_analysis_eval_score (gauge)
 * - ai_llm_fallback_used (counter)
 */

import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-otlp-http';
import { PeriodicMetricReader } from '@opentelemetry/sdk-metrics';
import { trace, context, metrics } from '@opentelemetry/api';
import { SpanStatusCode } from '@opentelemetry/api';
import { Logger } from 'winston';

let sdk: NodeSDK | null = null;

/**
 * Initialize OpenTelemetry SDK
 */
export function initializeOTel(serviceName: string, logger: Logger): NodeSDK {
  if (sdk) {
    return sdk;
  }

  const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4317';

  try {
    sdk = new NodeSDK({
      serviceName,
      instrumentations: [getNodeAutoInstrumentations()],
      traceExporter: new OTLPTraceExporter({
        url: `${endpoint}/v1/traces`,
      }),
      metricReaders: [
        new PeriodicMetricReader({
          exporter: new OTLPMetricExporter({
            url: `${endpoint}/v1/metrics`,
          }),
          intervalMillis: 30000, // 30s
        }),
      ],
    });

    sdk.start();
    logger.info('OpenTelemetry initialized', { endpoint, serviceName });

    return sdk;
  } catch (error) {
    logger.error('Failed to initialize OpenTelemetry', { error });
    throw error;
  }
}

/**
 * AI-specific metrics
 */
export class AIMetricsInstrumentation {
  private tracer = trace.getTracer('ai-intelligence');
  private meter = metrics.getMeter('ai-intelligence');
  private logger: Logger;

  // Metrics
  private analysisCounter = this.meter.createCounter('ai_analysis_total', { description: 'Total analyses' });
  private analysisLatency = this.meter.createHistogram('ai_analysis_duration_ms', {
    description: 'Analysis execution time',
  });
  private llmLatency = this.meter.createHistogram('ai_llm_call_duration_ms', {
    description: 'LLM call execution time',
  });
  private llmTokenCounter = this.meter.createCounter('ai_llm_tokens_total', { description: 'Total tokens used' });
  private llmCostCounter = this.meter.createCounter('ai_llm_cost_usd', { description: 'Total LLM cost' });
  private evalScoreGauge = this.meter.createObservableGauge('ai_analysis_eval_score', {
    description: 'Last analysis eval score',
  });
  private fallbackCounter = this.meter.createCounter('ai_llm_fallback_used', {
    description: 'LLM fallback model used',
  });
  private contextChunksDropped = this.meter.createCounter('ai_context_chunks_dropped', {
    description: 'Context chunks dropped by budget',
  });

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Trace analysis execution
   */
  traceAnalysis(analysisType: string) {
    const span = this.tracer.startSpan(`analysis.${analysisType}`, {
      attributes: {
        'analysis.type': analysisType,
        'service.name': 'ai-intelligence',
      },
    });

    return {
      span,
      end: (attributes: Record<string, any>) => {
        span.setAttributes(attributes);
        span.setStatus({ code: SpanStatusCode.OK });
        span.end();

        // Record metrics
        this.analysisCounter.add(1, { 'analysis.type': analysisType });
        if (attributes['duration_ms']) {
          this.analysisLatency.record(attributes['duration_ms'], {
            'analysis.type': analysisType,
          });
        }
        if (attributes['eval_score']) {
          this.evalScoreGauge;
        }
      },
      error: (error: Error) => {
        span.recordException(error);
        span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
        span.end();
      },
    };
  }

  /**
   * Trace LLM call
   */
  traceLLMCall(modelName: string) {
    const span = this.tracer.startSpan('llm.call', {
      attributes: {
        'llm.model': modelName,
        'service.name': 'ai-intelligence',
      },
    });

    return {
      span,
      end: (attributes: Record<string, any>) => {
        span.setAttributes(attributes);
        span.setStatus({ code: SpanStatusCode.OK });
        span.end();

        // Record metrics
        if (attributes['duration_ms']) {
          this.llmLatency.record(attributes['duration_ms'], { 'llm.model': modelName });
        }
        if (attributes['tokens_used']) {
          this.llmTokenCounter.add(attributes['tokens_used'], { 'llm.model': modelName });
        }
        if (attributes['cost_usd']) {
          this.llmCostCounter.add(attributes['cost_usd'], { 'llm.model': modelName });
        }
        if (attributes['fallback']) {
          this.fallbackCounter.add(1, { 'llm.model': modelName });
        }
      },
      error: (error: Error) => {
        span.recordException(error);
        span.setStatus({ code: SpanStatusCode.ERROR });
        span.end();
      },
    };
  }

  /**
   * Record context pipeline metrics
   */
  recordContextMetrics(
    chunksDropped: number,
    tokensReduced: number,
    durationMs: number,
  ): void {
    const span = this.tracer.startSpan('context.pipeline', {
      attributes: {
        'context.chunks_dropped': chunksDropped,
        'context.tokens_reduced': tokensReduced,
        'context.duration_ms': durationMs,
      },
    });

    this.contextChunksDropped.add(chunksDropped);
    span.end();
  }
}

/**
 * Create instrumentation context (for use in request handlers)
 */
export function createInstrumentationContext(
  instrumentation: AIMetricsInstrumentation,
  analysisType: string,
): {
  analysisTrace: ReturnType<AIMetricsInstrumentation['traceAnalysis']>;
  recordMetric: (name: string, value: number) => void;
} {
  const analysisTrace = instrumentation.traceAnalysis(analysisType);

  return {
    analysisTrace,
    recordMetric: (name: string, value: number) => {
      // Custom metrics can be added here
    },
  };
}

/**
 * Shutdown gracefully
 */
export async function shutdownOTel(logger: Logger): Promise<void> {
  if (sdk) {
    try {
      await sdk.shutdown();
      logger.info('OpenTelemetry shutdown gracefully');
    } catch (error) {
      logger.error('Error shutting down OpenTelemetry', { error });
    }
  }
}
