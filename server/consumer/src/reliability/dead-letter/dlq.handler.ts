import { Injectable, Logger } from '@nestjs/common';
import { Kafka, Producer } from 'kafkajs';
import { CORRELATION_ID_HEADER, createKafkaConfig } from '@mealio/shared';

export interface DlqPayload {
  topic: string;
  partition?: number;
  offset?: string;
  key?: string | null;
  value: string;
  reason: string;
  timestamp: string;
  correlationId?: string;
}

@Injectable()
export class DeadLetterHandler {
  private readonly logger = new Logger(DeadLetterHandler.name);
  private readonly kafka: Kafka;
  private readonly producer: Producer;
  private isConnected = false;

  constructor() {
    const kafkaConfig = createKafkaConfig('consumer-dlq');
    this.kafka = new Kafka(kafkaConfig);
    this.producer = this.kafka.producer();
  }

  async connect(): Promise<void> {
    if (this.isConnected) return;
    await this.producer.connect();
    this.isConnected = true;
  }

  async disconnect(): Promise<void> {
    if (!this.isConnected) return;
    await this.producer.disconnect();
    this.isConnected = false;
  }

  async send(payload: DlqPayload): Promise<void> {
    if (!this.isConnected) {
      await this.connect();
    }

    try {
      const headers =
        payload.correlationId !== undefined
          ? {
              [CORRELATION_ID_HEADER]: Buffer.from(
                payload.correlationId,
                'utf8',
              ),
            }
          : undefined;

      await this.producer.send({
        topic: payload.topic,
        messages: [
          {
            key: payload.key ?? undefined,
            value: JSON.stringify(payload),
            headers,
          },
        ],
      });
    } catch (error) {
      this.logger.error(
        `Failed to send message to DLQ correlationId=${payload.correlationId ?? 'none'}`,
        error as Error,
      );
    }
  }
}
