/**
 * Kafka 메인·DLQ 토픽을 배포 전에 생성한다.
 * 프로덕션(`APP_ENV=production`)에서는 Producer KafkaAdminService가 토픽을 만들지 않는다.
 *
 * env SSOT: `server/shared/.env.{APP_ENV}.local` → `.env.local` (`loadEnvFiles`)
 *
 * 실행 (모노레포 루트):
 *   pnpm run db:kafka:create-topics
 *   pnpm run db:kafka:create-topics:production
 *
 * EC2 호스트에서 Docker Kafka에 접속할 때는 `KAFKA_BROKERS`를 published 포트 기준으로 설정한다
 * (예: `localhost:9092`. 앱 컨테이너용 `kafka:19092`와 다를 수 있음).
 */
import { Kafka } from 'kafkajs';
import { loadEnvFiles } from '../config/load-env-files';
import {
  createKafkaConfig,
  LOCAL_TOPIC_CONFIG,
} from '../config/kafka.config';
import { KAFKA_DLQ_TOPICS, KAFKA_TOPICS } from '../constants/kafka-topics';

loadEnvFiles();

type ScriptOptions = {
  dryRun: boolean;
};

type TopicConfig = {
  numPartitions: number;
  replicationFactor: number;
};

type TopicCreateResult = {
  topic: string;
  status: 'created' | 'exists' | 'dry-run' | 'failed';
};

function parseArgs(argv: string[]): ScriptOptions {
  let dryRun = false;

  for (const arg of argv) {
    if (arg === '--dry-run') {
      dryRun = true;
      continue;
    }
    if (arg === '--') {
      continue;
    }
  }

  return { dryRun };
}

function getRequiredTopics(): string[] {
  return [
    ...Object.values(KAFKA_TOPICS),
    ...Object.values(KAFKA_DLQ_TOPICS),
  ];
}

function getTopicConfig(): TopicConfig {
  const numPartitions = Number(
    process.env.KAFKA_TOPIC_PARTITIONS ?? LOCAL_TOPIC_CONFIG.numPartitions,
  );
  const replicationFactor = Number(
    process.env.KAFKA_TOPIC_REPLICATION_FACTOR ??
      LOCAL_TOPIC_CONFIG.replicationFactor,
  );

  if (!Number.isInteger(numPartitions) || numPartitions < 1) {
    throw new Error('KAFKA_TOPIC_PARTITIONS must be a positive integer');
  }
  if (!Number.isInteger(replicationFactor) || replicationFactor < 1) {
    throw new Error(
      'KAFKA_TOPIC_REPLICATION_FACTOR must be a positive integer',
    );
  }

  return { numPartitions, replicationFactor };
}

function ensureKafkaEnv(): void {
  if (
    process.env.KAFKA_BROKERS == null ||
    process.env.KAFKA_BROKERS.trim() === ''
  ) {
    throw new Error('KAFKA_BROKERS is required');
  }
  if (
    process.env.KAFKA_CLIENT_ID == null ||
    process.env.KAFKA_CLIENT_ID.trim() === ''
  ) {
    process.env.KAFKA_CLIENT_ID = 'mealio-kafka-admin';
  }
}

function logTopicPlan(topics: string[], existingTopics: Set<string>): void {
  for (const topic of topics) {
    if (existingTopics.has(topic)) {
      console.log(`  · ${topic}: 이미 존재`);
      continue;
    }
    console.log(`  · ${topic}: 생성 예정`);
  }
}

function logTopicResults(results: TopicCreateResult[]): void {
  for (const { topic, status } of results) {
    if (status === 'exists') {
      console.log(`  ✓ ${topic}: 이미 존재`);
      continue;
    }
    if (status === 'created') {
      console.log(`  ✓ ${topic}: 생성 완료`);
      continue;
    }
    if (status === 'dry-run') {
      console.log(`  ✓ ${topic}: dry-run (생성 생략)`);
      continue;
    }
    console.log(`  ✗ ${topic}: 생성 실패`);
  }
}

async function listTopics(): Promise<Set<string>> {
  ensureKafkaEnv();

  const kafkaConfig = createKafkaConfig('create-topics');
  const kafka = new Kafka(kafkaConfig);
  const admin = kafka.admin();

  try {
    await admin.connect();
    return new Set(await admin.listTopics());
  } finally {
    await admin.disconnect();
  }
}

async function createTopics(
  topics: string[],
  topicConfig: TopicConfig,
  existingTopics: Set<string>,
  dryRun: boolean,
): Promise<TopicCreateResult[]> {
  ensureKafkaEnv();

  const results: TopicCreateResult[] = topics
    .filter((topic) => existingTopics.has(topic))
    .map((topic) => ({ topic, status: 'exists' as const }));

  const topicsToCreate = topics.filter((topic) => !existingTopics.has(topic));

  if (dryRun) {
    return [
      ...results,
      ...topicsToCreate.map((topic) => ({ topic, status: 'dry-run' as const })),
    ];
  }

  if (topicsToCreate.length === 0) {
    return results;
  }

  const kafkaConfig = createKafkaConfig('create-topics');
  const kafka = new Kafka(kafkaConfig);
  const admin = kafka.admin();

  try {
    await admin.connect();

    const createResult = await admin.createTopics({
      topics: topicsToCreate.map((topic) => ({
        topic,
        numPartitions: topicConfig.numPartitions,
        replicationFactor: topicConfig.replicationFactor,
      })),
      waitForLeaders: true,
      timeout: 10_000,
    });

    for (let index = 0; index < topicsToCreate.length; index += 1) {
      const topic = topicsToCreate[index];
      results.push({
        topic,
        status: createResult[index] ? 'created' : 'failed',
      });
    }
  } finally {
    await admin.disconnect();
  }

  return results;
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));

  const topics = getRequiredTopics();
  const topicConfig = getTopicConfig();

  console.log('🔄 Kafka topic bootstrap 시작...');

  const existingTopics = await listTopics();

  console.log('📋 생성 전 상태:');
  logTopicPlan(topics, existingTopics);

  const results = await createTopics(
    topics,
    topicConfig,
    existingTopics,
    options.dryRun,
  );

  console.log('✅ 생성 결과:');
  logTopicResults(results);

  console.log('✅ Kafka topic bootstrap 완료');
}

main().catch((error: unknown) => {
  console.error('❌ Kafka topic bootstrap 실패:', error);
  process.exitCode = 1;
});
