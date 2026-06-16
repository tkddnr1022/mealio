import { RedisOptions } from 'ioredis';

/**
 * Redis 설정 팩토리 함수
 * 환경 변수를 읽어 RedisOptions 객체를 생성한다.
 *
 * @returns RedisOptions 객체
 */
export function createRedisConfig(): RedisOptions {
  const redisUrl = process.env.REDIS_URL!;

  // URL 파싱
  const url = new URL(redisUrl);
  const isSecure = url.protocol === 'rediss:';

  return {
    host: url.hostname,
    port: parseInt(url.port || '6379', 10),
    password: url.password || undefined,
    db: url.pathname ? parseInt(url.pathname.slice(1), 10) : 0,
    retryStrategy: (times: number) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    enableOfflineQueue: false,
    connectTimeout: 10000,
    lazyConnect: true,
    tls: isSecure ? {} : undefined,
  };
}
