import { Kafka, type Admin, type Consumer, type ConsumerConfig } from 'kafkajs';
import { Injectable } from '@nestjs/common';
import { createKafkaConfig } from '@mealio/shared';

/**
 * Consumer 패키지 전용 Kafka 연결.
 * 단일 Kafka 클라이언트를 초기화하고, consumer 인스턴스를 생성해 반환한다.
 */
@Injectable()
export class KafkaService {
  private readonly kafka: Kafka;

  constructor() {
    this.kafka = new Kafka(createKafkaConfig());
  }

  getConsumer(config: ConsumerConfig): Consumer {
    return this.kafka.consumer(config);
  }

  getAdmin(): Admin {
    return this.kafka.admin();
  }
}
