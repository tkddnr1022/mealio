import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { KAFKA_TOPICS, type ObservabilityConfig } from '@mealio/shared';
import { CONSUMER_GROUPS } from '../../constants/consumer-groups.constants';
import { CONSUMER_LAG_POLL_INTERVAL_MS } from '../../policy/monitoring.policy';
import { KafkaService } from 'src/integrations/kafka/kafka.service';
import {
  ConsumerMetricsService,
  OBSERVABILITY_CONFIG,
} from './consumer-metrics.service';

/** consumer group → subscribed main topic */
const GROUP_TOPIC_MAP: ReadonlyArray<{
  groupId: string;
  topic: string;
}> = [
  { groupId: CONSUMER_GROUPS.CHATBOT, topic: KAFKA_TOPICS.CHATBOT_REQUESTS },
  { groupId: CONSUMER_GROUPS.USER_EVENTS, topic: KAFKA_TOPICS.USER_EVENTS },
  {
    groupId: CONSUMER_GROUPS.ACTIVITY_EVENTS,
    topic: KAFKA_TOPICS.ACTIVITY_EVENTS,
  },
  {
    groupId: CONSUMER_GROUPS.CACHE_INVALIDATION,
    topic: KAFKA_TOPICS.CACHE_INVALIDATION,
  },
  {
    groupId: CONSUMER_GROUPS.RECIPE_INGESTION_PERSIST,
    topic: KAFKA_TOPICS.RECIPE_INGESTION_RETRIEVED,
  },
];

@Injectable()
export class ConsumerLagMonitor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ConsumerLagMonitor.name);
  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly kafkaService: KafkaService,
    private readonly metrics: ConsumerMetricsService,
    @Inject(OBSERVABILITY_CONFIG)
    private readonly observability: ObservabilityConfig,
  ) {}

  onModuleInit(): void {
    if (!this.observability.metricsEnabled) {
      return;
    }
    void this.pollLag();
    this.intervalId = setInterval(() => {
      void this.pollLag();
    }, CONSUMER_LAG_POLL_INTERVAL_MS);
  }

  onModuleDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private async pollLag(): Promise<void> {
    const admin = this.kafkaService.getAdmin();
    try {
      await admin.connect();

      for (const { groupId, topic } of GROUP_TOPIC_MAP) {
        const [committedTopics, topicOffsets] = await Promise.all([
          admin.fetchOffsets({ groupId, topics: [topic] }),
          admin.fetchTopicOffsets(topic),
        ]);

        const highWaterByPartition = new Map(
          topicOffsets.map((o) => [o.partition, Number(o.high)]),
        );

        const committed = committedTopics.find((t) => t.topic === topic);
        if (!committed) {
          continue;
        }

        for (const partitionOffset of committed.partitions) {
          const high = highWaterByPartition.get(partitionOffset.partition);
          if (high === undefined) {
            continue;
          }
          const committedOffset = Number(partitionOffset.offset);
          const lag = Math.max(0, high - committedOffset);
          this.metrics.setLag(topic, partitionOffset.partition, groupId, lag);
        }
      }
    } catch (error) {
      this.logger.warn(
        `Failed to poll consumer lag: ${(error as Error).message}`,
      );
    } finally {
      await admin.disconnect().catch(() => undefined);
    }
  }
}
