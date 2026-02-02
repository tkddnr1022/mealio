import { Injectable, Logger } from '@nestjs/common';
import { Kafka, Producer } from 'kafkajs';
import { createKafkaConfig } from '@cook/shared';

export interface DlqPayload {
  topic: string;
  partition?: number;
  offset?: string;
  key?: string | null;
  value: string;
  reason: string;
  timestamp: string;
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
      await this.producer.send({
        topic: payload.topic,
        messages: [
          {
            key: payload.key ?? undefined,
            value: JSON.stringify(payload),
          },
        ],
      });
    } catch (error) {
      this.logger.error('Failed to send message to DLQ', error as Error);
    }
  }
}

