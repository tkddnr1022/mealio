import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer } from 'kafkajs';
import { createKafkaConfig } from 'src/shared/configs/kafka.config';

@Injectable()
export class KafkaProducerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaProducerService.name);
  private kafka!: Kafka;
  private producer!: Producer;
  private isConnected = false;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const kafkaConfig = createKafkaConfig();
    this.kafka = new Kafka(kafkaConfig);
    this.producer = this.kafka.producer();

    // brokers는 createKafkaConfig에서 항상 string[]로 반환되므로 타입 단언 사용
    const brokers = kafkaConfig.brokers as unknown as string[];

    try {
      await this.producer.connect();
      this.isConnected = true;
      this.logger.log(
        `Kafka producer connected (clientId=${kafkaConfig.clientId}, brokers=${brokers.join(',')})`,
      );
    } catch (error) {
      this.logger.error('Failed to connect Kafka producer', error as Error);
      // 연결 실패 시에도 애플리케이션이 전체 중단되지 않도록 한다.
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (!this.producer || !this.isConnected) {
      return;
    }

    try {
      await this.producer.disconnect();
      this.logger.log('Kafka producer disconnected');
    } catch (error) {
      this.logger.error(
        'Error while disconnecting Kafka producer',
        error as Error,
      );
    }
  }

  /**
   * 단일 메시지를 지정한 토픽으로 발행한다.
   * JSON 직렬화를 기본으로 사용하며, 실패 시 로깅만 수행한다.
   */
  async emit<T>(topic: string, payload: T, key?: string): Promise<void> {
    if (!this.producer || !this.isConnected) {
      this.logger.warn(
        `Kafka producer is not connected. Skipping publish to topic=${topic}`,
      );
      return;
    }

    try {
      await this.producer.send({
        topic,
        messages: [
          {
            key,
            value: JSON.stringify(payload),
          },
        ],
      });
    } catch (error) {
      this.logger.error(
        `Failed to publish message to topic=${topic}`,
        error as Error,
      );
    }
  }
}
