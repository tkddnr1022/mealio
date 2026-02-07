import type { EachMessagePayload } from 'kafkajs';
import type { Consumer } from 'kafkajs';
import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { KafkaService } from 'src/integrations/kafka/kafka.service';
import type { ITopicProcessor } from './base.processor';

/**
 * 단일 Kafka consumer 인스턴스의 connect / subscribe / run / disconnect 를 담당하는 베이스.
 * 그룹 ID와 토픽 프로세서 목록을 받아 하나의 consumer로 구독·디스패치한다.
 */
@Injectable()
export abstract class BaseConsumer implements OnModuleInit, OnModuleDestroy {
  protected readonly logger: Logger;
  protected consumer: Consumer | null = null;

  protected static readonly HEARTBEAT_INTERVAL_MS = 10_000;
  protected static readonly SESSION_TIMEOUT_MS = 120_000;

  constructor(
    protected readonly kafkaService: KafkaService,
    protected readonly groupId: string,
    protected readonly processors: ITopicProcessor[],
    loggerName?: string,
  ) {
    this.logger = new Logger(loggerName ?? this.constructor.name);
  }

  async onModuleInit(): Promise<void> {
    const topicList = this.processors.map((p) => p.getTopic());
    const processorByTopic = new Map(
      this.processors.map((p) => [p.getTopic(), p]),
    );

    this.consumer = this.kafkaService.getConsumer({
      groupId: this.groupId,
      sessionTimeout: BaseConsumer.SESSION_TIMEOUT_MS,
    });
    await this.consumer.connect();
    await this.consumer.subscribe({ topics: topicList });
    await this.consumer.run({
      eachBatch: async ({ batch, heartbeat, isRunning, isStale }) => {
        const processor = processorByTopic.get(batch.topic);
        if (!processor) {
          this.logger.warn(
            `No processor for topic=${batch.topic}, skipping batch`,
          );
          return;
        }
        for (const message of batch.messages) {
          if (!isRunning() || isStale()) break;

          const payload = {
            topic: batch.topic,
            partition: batch.partition,
            message,
          } as EachMessagePayload;

          const timer = setInterval(() => {
            heartbeat().catch((err) =>
              this.logger.warn('Heartbeat failed', err),
            );
          }, BaseConsumer.HEARTBEAT_INTERVAL_MS);
          try {
            await processor.handleMessage(payload);
          } finally {
            clearInterval(timer);
          }
        }
      },
      eachBatchAutoResolve: true,
    });

    this.logger.log(
      `Subscribed to [${topicList.join(', ')}] (groupId=${this.groupId})`,
    );
  }

  async onModuleDestroy(): Promise<void> {
    if (this.consumer) {
      await this.consumer.disconnect();
      this.consumer = null;
    }
  }
}
