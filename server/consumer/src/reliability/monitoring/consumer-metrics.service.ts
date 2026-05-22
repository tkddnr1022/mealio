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
}
