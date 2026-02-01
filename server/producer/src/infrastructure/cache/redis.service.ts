import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import Redis from 'ioredis';
import { createRedisConfig } from 'src/shared/configs/redis.config';

/**
 * Redis 커넥션 관리 서비스
 * 싱글톤으로 Redis 클라이언트를 관리하고, 모듈 생명주기에 따라 연결/해제를 처리한다.
 * Pub/Sub 구독용 별도 클라이언트(subscriber)를 제공한다.
 */
@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;
  /** 구독 전용 클라이언트 (subscribe 시 일반 명령 불가이므로 별도 연결) */
  private subscriberClient: Redis | null = null;
  private readonly subscriberCallbacks = new Map<
    string,
    (message: string) => void
  >();

  constructor() {
    const config = createRedisConfig();
    this.client = new Redis(config);
    this.setupEventHandlers();
  }

  /**
   * 모듈 초기화 시 Redis 연결
   */
  async onModuleInit(): Promise<void> {
    try {
      await this.client.connect();
      this.logger.log('Redis connection established');
    } catch (error) {
      this.logger.error('Failed to connect to Redis', error);
      throw error;
    }
  }

  /**
   * 모듈 종료 시 Redis 연결 해제
   */
  async onModuleDestroy(): Promise<void> {
    try {
      if (this.subscriberClient) {
        await this.subscriberClient.quit();
        this.subscriberClient = null;
        this.subscriberCallbacks.clear();
        this.logger.log('Redis subscriber connection closed');
      }
      await this.client.quit();
      this.logger.log('Redis connection closed');
    } catch (error) {
      this.logger.error('Error closing Redis connection', error);
    }
  }

  /**
   * Pub/Sub 구독 전용 클라이언트 반환 (subscribe 모드에서 일반 명령 불가이므로 별도 연결)
   * 연결 전 subscribe() 호출을 허용하기 위해 enableOfflineQueue: true 로 생성한다.
   */
  getSubscriberClient(): Redis {
    if (!this.subscriberClient) {
      const config = {
        ...createRedisConfig(),
        enableOfflineQueue: true,
      };
      this.subscriberClient = new Redis(config);
      this.subscriberClient.on('message', (channel: string, message: string) => {
        const cb = this.subscriberCallbacks.get(channel);
        if (cb) cb(message);
      });
      this.subscriberClient.on('error', (err) => {
        this.logger.error('Redis subscriber error', err);
      });
    }
    return this.subscriberClient;
  }

  /**
   * 채널 구독. 메시지 수신 시 onMessage 호출.
   * @returns 구독 해제 함수
   */
  async subscribe(
    channel: string,
    onMessage: (message: string) => void,
  ): Promise<() => Promise<void>> {
    this.subscriberCallbacks.set(channel, onMessage);
    const sub = this.getSubscriberClient();
    await sub.subscribe(channel);
    return async () => {
      await sub.unsubscribe(channel);
      this.subscriberCallbacks.delete(channel);
    };
  }

  /**
   * Redis 클라이언트 인스턴스 반환
   */
  getClient(): Redis {
    return this.client;
  }

  /**
   * 키-값 저장
   */
  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.setex(key, ttlSeconds, value);
    } else {
      await this.client.set(key, value);
    }
  }

  /**
   * 키-값 조회
   */
  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  /**
   * 키 존재 여부 확인
   */
  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }

  /**
   * 키에 TTL 설정
   */
  async expire(key: string, seconds: number): Promise<boolean> {
    const result = await this.client.expire(key, seconds);
    return result === 1;
  }

  /**
   * 키의 남은 TTL 조회
   */
  async ttl(key: string): Promise<number> {
    return this.client.ttl(key);
  }

  /**
   * Redis 이벤트 핸들러 설정
   */
  private setupEventHandlers(): void {
    this.client.on('connect', () => {
      this.logger.debug('Redis client connecting...');
    });

    this.client.on('ready', () => {
      this.logger.log('Redis client ready');
    });

    this.client.on('error', (error) => {
      this.logger.error('Redis client error', error);
    });

    this.client.on('close', () => {
      this.logger.warn('Redis connection closed');
    });

    this.client.on('reconnecting', () => {
      this.logger.log('Redis client reconnecting...');
    });
  }
}
