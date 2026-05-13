import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka } from 'kafkajs';
import {
  KAFKA_TOPICS,
  KAFKA_DLQ_TOPICS,
  createKafkaConfig,
  LOCAL_TOPIC_CONFIG,
} from '@mealio/shared';

/**
 * Kafka Admin 서비스
 * 로컬 개발 환경에서 필요한 토픽을 자동으로 생성한다.
 * 프로덕션 환경에서는 토픽 생성 로직을 실행하지 않는다.
 */
@Injectable()
export class KafkaAdminService implements OnModuleInit {
  private readonly logger = new Logger(KafkaAdminService.name);

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const nodeEnv = this.configService.getOrThrow<string>('NODE_ENV');

    // 프로덕션 환경에서는 토픽 생성을 수행하지 않는다.
    if (nodeEnv === 'production') {
      this.logger.log(
        'Skipping Kafka topic creation in production environment',
      );
      return;
    }

    const kafkaConfig = createKafkaConfig('admin');
    const kafka = new Kafka(kafkaConfig);
    const admin = kafka.admin();

    // brokers는 createKafkaConfig에서 항상 string[]로 반환되므로 타입 단언 사용
    const brokers = kafkaConfig.brokers as unknown as string[];

    try {
      await admin.connect();
      this.logger.log(
        `Kafka admin connected (clientId=${kafkaConfig.clientId}, brokers=${brokers.join(',')})`,
      );

      // 기존 토픽 목록 조회
      const existingTopics = await admin.listTopics();
      const existingTopicsSet = new Set(existingTopics);

      // KAFKA_TOPICS + KAFKA_DLQ_TOPICS 상수에서 필요한 토픽 목록 가져오기
      const requiredTopics = [
        ...Object.values(KAFKA_TOPICS),
        ...Object.values(KAFKA_DLQ_TOPICS),
      ];

      // 존재하지 않는 토픽만 필터링
      const topicsToCreate = requiredTopics
        .filter((topicName) => !existingTopicsSet.has(topicName))
        .map((topicName) => ({
          topic: topicName,
          numPartitions: LOCAL_TOPIC_CONFIG.numPartitions,
          replicationFactor: LOCAL_TOPIC_CONFIG.replicationFactor,
        }));

      // 이미 존재하는 토픽 로깅
      const alreadyExistingTopics = requiredTopics.filter((topicName) =>
        existingTopicsSet.has(topicName),
      );
      if (alreadyExistingTopics.length > 0) {
        this.logger.log(
          `Topics already exist: ${alreadyExistingTopics.join(', ')}`,
        );
      }

      // 생성할 토픽이 없으면 종료
      if (topicsToCreate.length === 0) {
        this.logger.log(
          'All required topics already exist. No topics to create.',
        );
        return;
      }

      // 존재하지 않는 토픽만 생성
      this.logger.log(
        `Creating Kafka topics: ${topicsToCreate.map((t) => t.topic).join(', ')}`,
      );

      const result = await admin.createTopics({
        topics: topicsToCreate,
        waitForLeaders: true,
        timeout: 10000, // 10초 타임아웃
      });

      // 생성 결과 로깅
      const createdTopics = topicsToCreate.filter((_, index) => result[index]);
      const failedTopics = topicsToCreate.filter((_, index) => !result[index]);

      if (createdTopics.length > 0) {
        this.logger.log(
          `Successfully created topics: ${createdTopics.map((t) => t.topic).join(', ')}`,
        );
      }

      if (failedTopics.length > 0) {
        this.logger.warn(
          `Failed to create topics: ${failedTopics.map((t) => t.topic).join(', ')}`,
        );
      }
    } catch (error) {
      // 로컬 개발 환경에서는 토픽 생성 실패가 치명적이지 않을 수 있으므로 에러를 던지지 않음
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to create Kafka topics: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );
    } finally {
      try {
        await admin.disconnect();
        this.logger.log('Kafka admin disconnected');
      } catch (error) {
        this.logger.error(
          'Error while disconnecting Kafka admin',
          error as Error,
        );
      }
    }
  }
}
