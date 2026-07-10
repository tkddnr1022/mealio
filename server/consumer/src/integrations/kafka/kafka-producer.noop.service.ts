import { Injectable, Logger } from '@nestjs/common';

/**
 * KafkaModule 없이 recipe ingestion CLI를 구동할 때 사용하는 no-op producer.
 */
@Injectable()
export class NoOpKafkaProducerService {
  private readonly logger = new Logger(NoOpKafkaProducerService.name);

  emit<T>(topic: string, _payload: T, _key?: string): Promise<void> {
    this.logger.debug(`Kafka disabled. Skipping publish to topic=${topic}`);
    return Promise.resolve();
  }
}
