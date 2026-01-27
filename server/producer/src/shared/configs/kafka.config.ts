import { KafkaConfig, logLevel } from 'kafkajs';

/**
 * Kafka 설정 팩토리 함수
 * 환경 변수를 직접 읽어 KafkaConfig 객체를 생성한다.
 *
 * @param clientIdSuffix 클라이언트 ID에 추가할 접미사 (예: 'admin', 'producer')
 * @returns KafkaConfig 객체
 */
export function createKafkaConfig(clientIdSuffix?: string): KafkaConfig {
  const baseClientId = process.env.KAFKA_CLIENT_ID || 'cook-producer';
  const clientId = clientIdSuffix
    ? `${baseClientId}-${clientIdSuffix}`
    : baseClientId;
  const brokersEnv = process.env.KAFKA_BROKERS || 'localhost:9092';
  const brokers = brokersEnv
    .split(',')
    .map((b) => b.trim())
    .filter(Boolean);

  return {
    clientId,
    brokers,
    logLevel: logLevel.ERROR,
  };
}

/**
 * 로컬 개발 환경에서 사용할 토픽 생성 설정
 */
export const LOCAL_TOPIC_CONFIG = {
  numPartitions: 3,
  replicationFactor: 1,
} as const;
