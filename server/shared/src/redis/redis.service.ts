import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import Redis from 'ioredis';
import { createRedisConfig } from '../config/redis.config';

/**
 * Redis 커넥션 관리 서비스 (Producer/Consumer 공용)
 */
@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;
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

  async onModuleInit(): Promise<void> {
    try {
      await this.client.connect();
      this.logger.log('Redis connection established');
    } catch (error) {
      this.logger.error('Failed to connect to Redis', error);
      throw error;
    }
  }

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

  getSubscriberClient(): Redis {
    if (!this.subscriberClient) {
      const config = {
        ...createRedisConfig(),
        enableOfflineQueue: true,
      };
      this.subscriberClient = new Redis(config);
      this.subscriberClient.on(
        'message',
        (channel: string, message: string) => {
          const cb = this.subscriberCallbacks.get(channel);
          if (cb) cb(message);
        },
      );
      this.subscriberClient.on('error', (err) => {
        this.logger.error('Redis subscriber error', err);
      });
    }
    return this.subscriberClient;
  }

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

  getClient(): Redis {
    return this.client;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.setex(key, ttlSeconds, value);
    } else {
      await this.client.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }

  async expire(key: string, seconds: number): Promise<boolean> {
    const result = await this.client.expire(key, seconds);
    return result === 1;
  }

  async ttl(key: string): Promise<number> {
    return this.client.ttl(key);
  }

  /**
   * Redis 연결 상태 확인 (readiness probe용)
   */
  async ping(): Promise<string> {
    return this.client.ping();
  }

  async del(key: string): Promise<number> {
    return this.client.del(key);
  }

  async delByPattern(pattern: string): Promise<number> {
    let cursor = '0';
    let deleted = 0;

    do {
      const [nextCursor, keys] = await this.client.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        200,
      );
      cursor = nextCursor;
      if (keys.length > 0) {
        deleted += await this.client.del(...keys);
      }
    } while (cursor !== '0');

    return deleted;
  }

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
