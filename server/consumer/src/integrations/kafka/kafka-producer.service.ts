import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Kafka, Producer } from 'kafkajs';
import { createKafkaConfig } from '@cook/shared';

/**
 * Consumer 패키지 내부에서 토픽 발행이 필요할 때 사용하는 Kafka Producer.
 * (예: user-events 처리 후 cache-invalidation 토픽 발행)
 */
@Injectable()
export class KafkaProducerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaProducerService.name);
  private kafka!: Kafka;
  private producer!: Producer;
  private isConnected = false;

  async onModuleInit(): Promise<void> {
    const kafkaConfig = createKafkaConfig('consumer-producer');
    this.kafka = new Kafka(kafkaConfig);
    this.producer = this.kafka.producer();
    const brokers = kafkaConfig.brokers as unknown as string[];

    try {
      await this.producer.connect();
      this.isConnected = true;
      this.logger.log(
        `Kafka producer connected (clientId=${kafkaConfig.clientId}, brokers=${brokers.join(',')})`,
      );
    } catch (error) {
      this.logger.error('Failed to connect Kafka producer', error as Error);
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (!this.producer || !this.isConnected) return;
    try {
      await this.producer.disconnect();
      this.logger.log('Kafka producer disconnected');
    } catch (error) {
      this.logger.error(
        'Error while disconnecting Kafka producer',
        error as Error,
      );
    } finally {
      this.isConnected = false;
    }
  }

  async emit<T>(topic: string, payload: T, key?: string): Promise<void> {
    if (!this.producer || !this.isConnected) {
      this.logger.warn(
        `Kafka producer not connected. Skipping publish to topic=${topic}`,
      );
      return;
    }
    try {
      await this.producer.send({
        topic,
        messages: [{ key, value: JSON.stringify(payload) }],
      });
    } catch (error) {
      this.logger.error(`Failed to publish to topic=${topic}`, error as Error);
    }
  }
}
