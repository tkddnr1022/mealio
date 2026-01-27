import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { createRedisConfig } from 'src/shared/configs/redis.config';

/**
 * Redis 커넥션 관리 서비스
 * 싱글톤으로 Redis 클라이언트를 관리하고, 모듈 생명주기에 따라 연결/해제를 처리한다.
 */
@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;

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
      await this.client.quit();
      this.logger.log('Redis connection closed');
    } catch (error) {
      this.logger.error('Error closing Redis connection', error);
    }
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
