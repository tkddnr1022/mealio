/**
 * Kafka 메인·DLQ 토픽을 배포 전에 생성한다.
 * 프로덕션(`APP_ENV=production`)에서는 Producer KafkaAdminService가 토픽을 만들지 않는다.
 *
 * 실행 (모노레포 루트):
 *   pnpm run db:kafka:create-topics:production
 *
 * EC2 Docker Kafka (호스트에서 mealio-kafka 컨테이너 경유):
 *   pnpm run db:kafka:create-topics:production -- --docker
 */
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { config } from 'dotenv';
import { Kafka } from 'kafkajs';
import { loadEnvFiles } from '../config/load-env-files';
import {
  createKafkaConfig,
  LOCAL_TOPIC_CONFIG,
} from '../config/kafka.config';
import { KAFKA_DLQ_TOPICS, KAFKA_TOPICS } from '../constants/kafka-topics';

const KAFKA_TOPICS_SCRIPT = '/opt/kafka/bin/kafka-topics.sh';
const DEFAULT_KAFKA_CONTAINER = 'mealio-kafka';
const DOCKER_BOOTSTRAP = 'kafka:19092';

type ScriptOptions = {
  envFile?: string;
  docker: boolean;
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
  let envFile: string | undefined;
  let docker = false;
  let dryRun = false;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--docker') {
      docker = true;
      continue;
    }
    if (arg === '--dry-run') {
      dryRun = true;
      continue;
    }
    if (arg === '--env-file') {
      const next = argv[index + 1];
      if (next == null || next.startsWith('--')) {
        throw new Error('--env-file requires a file path');
      }
      envFile = next;
      index += 1;
      continue;
    }
    if (arg === '--') {
      continue;
    }
  }

  return { envFile, docker, dryRun };
}

function loadScriptEnv(envFile?: string): void {
  if (envFile != null) {
    const envPath = resolve(process.cwd(), envFile);
    if (!existsSync(envPath)) {
      throw new Error(`Env file not found: ${envPath}`);
    }
    console.log(`Loading env file: ${envPath}`);
    config({ path: envPath });
    return;
  }

  loadEnvFiles(resolve(__dirname, '../..'));
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

function listDockerTopics(container: string, bootstrap: string): Set<string> {
  const output = execFileSync(
    'docker',
    [
      'exec',
      container,
      KAFKA_TOPICS_SCRIPT,
      '--bootstrap-server',
      bootstrap,
      '--list',
    ],
    { encoding: 'utf8' },
  );

  return new Set(
    output
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean),
  );
}

function createTopicsWithDocker(
  topics: string[],
  topicConfig: TopicConfig,
  existingTopics: Set<string>,
  dryRun: boolean,
): TopicCreateResult[] {
  const container =
    process.env.KAFKA_CONTAINER_NAME?.trim() || DEFAULT_KAFKA_CONTAINER;
  const bootstrap =
    process.env.KAFKA_DOCKER_BOOTSTRAP?.trim() || DOCKER_BOOTSTRAP;
  const results: TopicCreateResult[] = [];

  for (const topic of topics) {
    if (existingTopics.has(topic)) {
      results.push({ topic, status: 'exists' });
      continue;
    }

    if (dryRun) {
      results.push({ topic, status: 'dry-run' });
      continue;
    }

    try {
      execFileSync(
        'docker',
        [
          'exec',
          container,
          KAFKA_TOPICS_SCRIPT,
          '--bootstrap-server',
          bootstrap,
          '--create',
          '--if-not-exists',
          '--topic',
          topic,
          '--partitions',
          String(topicConfig.numPartitions),
          '--replication-factor',
          String(topicConfig.replicationFactor),
        ],
        { stdio: 'pipe', encoding: 'utf8' },
      );
      results.push({ topic, status: 'created' });
    } catch (error) {
      const message =
        error instanceof Error && 'stdout' in error
          ? String((error as NodeJS.ErrnoException & { stdout?: string }).stdout)
          : error instanceof Error
            ? error.message
            : String(error);
      throw new Error(`Failed to create topic=${topic}: ${message}`);
    }
  }

  return results;
}

async function listKafkaJsTopics(): Promise<Set<string>> {
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

async function createTopicsWithKafkaJs(
  topics: string[],
  topicConfig: TopicConfig,
  existingTopics: Set<string>,
  dryRun: boolean,
): Promise<TopicCreateResult[]> {
  if (
    process.env.KAFKA_BROKERS == null ||
    process.env.KAFKA_BROKERS.trim() === ''
  ) {
    throw new Error('KAFKA_BROKERS is required (or use --docker)');
  }
  if (
    process.env.KAFKA_CLIENT_ID == null ||
    process.env.KAFKA_CLIENT_ID.trim() === ''
  ) {
    process.env.KAFKA_CLIENT_ID = 'mealio-kafka-admin';
  }

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

async function resolveExistingTopics(docker: boolean): Promise<Set<string>> {
  if (docker) {
    const container =
      process.env.KAFKA_CONTAINER_NAME?.trim() || DEFAULT_KAFKA_CONTAINER;
    const bootstrap =
      process.env.KAFKA_DOCKER_BOOTSTRAP?.trim() || DOCKER_BOOTSTRAP;
    return listDockerTopics(container, bootstrap);
  }

  return listKafkaJsTopics();
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  loadScriptEnv(options.envFile);

  const topics = getRequiredTopics();
  const topicConfig = getTopicConfig();

  console.log('🔄 Kafka topic bootstrap 시작...');

  const existingTopics = await resolveExistingTopics(options.docker);

  console.log('📋 생성 전 상태:');
  logTopicPlan(topics, existingTopics);

  const results = options.docker
    ? createTopicsWithDocker(
        topics,
        topicConfig,
        existingTopics,
        options.dryRun,
      )
    : await createTopicsWithKafkaJs(
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
