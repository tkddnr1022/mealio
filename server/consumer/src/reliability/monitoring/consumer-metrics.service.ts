import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import {
  Counter,
  Gauge,
  Histogram,
  Registry,
  collectDefaultMetrics,
} from 'prom-client';
import type { ObservabilityConfig } from '@mealio/shared';

export const OBSERVABILITY_CONFIG = 'OBSERVABILITY_CONFIG';

const PROCESSING_BUCKETS_MS = [5, 10, 25, 50, 100, 250, 500, 1000, 5000, 30000];

@Injectable()
export class ConsumerMetricsService implements OnModuleInit {
  readonly registry: Registry;
  readonly enabled: boolean;

  private messagesProcessedTotal?: Counter<string>;
  private messagesFailedTotal?: Counter<string>;
  private messageProcessingDurationMs?: Histogram<string>;
  private consumerLag?: Gauge<string>;
  private ingestionStageTotal?: Counter<string>;
  private ingestionStageLatencyMs?: Histogram<string>;
  private ingestionParseConfidenceTotal?: Counter<string>;
  private ingestionIngredientMatchTotal?: Counter<string>;
  private ingestionLlmTokensTotal?: Counter<string>;

  constructor(
    @Inject(OBSERVABILITY_CONFIG)
    private readonly observability: ObservabilityConfig,
  ) {
    this.enabled = observability.metricsEnabled;
    this.registry = new Registry();
    this.registry.setDefaultLabels({ service: observability.serviceName });

    if (!this.enabled) {
      return;
    }

    this.messagesProcessedTotal = new Counter({
      name: 'kafka_messages_processed_total',
      help: 'Successfully processed Kafka messages',
      labelNames: ['topic', 'consumer_group'] as const,
      registers: [this.registry],
    });

    this.messagesFailedTotal = new Counter({
      name: 'kafka_messages_failed_total',
      help: 'Kafka messages sent to DLQ after processing failure',
      labelNames: ['topic', 'consumer_group'] as const,
      registers: [this.registry],
    });

    this.messageProcessingDurationMs = new Histogram({
      name: 'kafka_message_processing_duration_ms',
      help: 'Kafka message processing duration in milliseconds',
      labelNames: ['topic', 'consumer_group'] as const,
      buckets: PROCESSING_BUCKETS_MS,
      registers: [this.registry],
    });

    this.consumerLag = new Gauge({
      name: 'kafka_consumer_lag',
      help: 'Consumer group lag (high watermark - committed offset)',
      labelNames: ['topic', 'partition', 'consumer_group'] as const,
      registers: [this.registry],
    });

    this.ingestionStageTotal = new Counter({
      name: 'recipe_ingestion_stage_total',
      help: 'Recipe ingestion stage executions by outcome',
      labelNames: ['stage', 'outcome'] as const,
      registers: [this.registry],
    });

    this.ingestionStageLatencyMs = new Histogram({
      name: 'recipe_ingestion_stage_latency_ms',
      help: 'Recipe ingestion stage latency in milliseconds',
      labelNames: ['stage'] as const,
      buckets: PROCESSING_BUCKETS_MS,
      registers: [this.registry],
    });

    this.ingestionParseConfidenceTotal = new Counter({
      name: 'recipe_ingestion_parse_confidence_total',
      help: 'Recipe ingestion parse confidence distribution',
      labelNames: ['level'] as const,
      registers: [this.registry],
    });

    this.ingestionIngredientMatchTotal = new Counter({
      name: 'recipe_ingestion_ingredient_match_total',
      help: 'Recipe ingestion ingredient match method distribution',
      labelNames: ['match_method'] as const,
      registers: [this.registry],
    });

    this.ingestionLlmTokensTotal = new Counter({
      name: 'recipe_ingestion_llm_tokens_total',
      help: 'Recipe ingestion LLM token usage',
      labelNames: ['token_type'] as const,
      registers: [this.registry],
    });
  }

  onModuleInit(): void {
    if (!this.enabled) {
      return;
    }
    collectDefaultMetrics({ register: this.registry });
  }

  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  getContentType(): string {
    return this.registry.contentType;
  }

  recordProcessed(
    topic: string,
    consumerGroup: string,
    durationMs: number,
  ): void {
    if (!this.enabled) {
      return;
    }
    const labels = { topic, consumer_group: consumerGroup };
    this.messagesProcessedTotal!.inc(labels);
    this.messageProcessingDurationMs!.observe(labels, durationMs);
  }

  recordFailed(topic: string, consumerGroup: string): void {
    if (!this.enabled) {
      return;
    }
    this.messagesFailedTotal!.inc({ topic, consumer_group: consumerGroup });
  }

  setLag(
    topic: string,
    partition: number,
    consumerGroup: string,
    lag: number,
  ): void {
    if (!this.enabled) {
      return;
    }
    this.consumerLag!.set(
      { topic, partition: String(partition), consumer_group: consumerGroup },
      lag,
    );
  }

  recordIngestionStage(
    stage:
      | 'fetch'
      | 'parse-submit'
      | 'parse-retrieve'
      | 'persist'
      | 'embed-submit'
      | 'embed-retrieve',
    outcome: 'success' | 'failed' | 'skipped',
    count = 1,
  ): void {
    if (!this.enabled || count <= 0) {
      return;
    }
    this.ingestionStageTotal!.inc({ stage, outcome }, count);
  }

  observeIngestionStageLatency(
    stage:
      | 'fetch'
      | 'parse-submit'
      | 'parse-retrieve'
      | 'persist'
      | 'embed-submit'
      | 'embed-retrieve',
    durationMs: number,
  ): void {
    if (!this.enabled || durationMs < 0) {
      return;
    }
    this.ingestionStageLatencyMs!.observe({ stage }, durationMs);
  }

  recordParseConfidence(level: 'high' | 'medium' | 'low'): void {
    if (!this.enabled) {
      return;
    }
    this.ingestionParseConfidenceTotal!.inc({ level });
  }

  recordIngredientMatchMethod(
    matchMethod: 'exact' | 'alias' | 'vector' | 'new',
    count = 1,
  ): void {
    if (!this.enabled || count <= 0) {
      return;
    }
    this.ingestionIngredientMatchTotal!.inc(
      { match_method: matchMethod },
      count,
    );
  }

  recordLlmTokenUsage(tokens: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  }): void {
    if (!this.enabled) {
      return;
    }
    if ((tokens.inputTokens ?? 0) > 0) {
      this.ingestionLlmTokensTotal!.inc(
        { token_type: 'input' },
        tokens.inputTokens,
      );
    }
    if ((tokens.outputTokens ?? 0) > 0) {
      this.ingestionLlmTokensTotal!.inc(
        { token_type: 'output' },
        tokens.outputTokens,
      );
    }
    if ((tokens.totalTokens ?? 0) > 0) {
      this.ingestionLlmTokensTotal!.inc(
        { token_type: 'total' },
        tokens.totalTokens,
      );
    }
  }
}
