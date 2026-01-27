import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from './redis.service';
import { CacheStrategy } from './strategies/cache-strategy.interface';

/**
 * 캐시 서비스
 * Cache-Aside 패턴을 구현하여 Redis 캐시를 관리한다.
 */
@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(private readonly redisService: RedisService) {}

  /**
   * 캐시에서 데이터 조회
   * @param strategy 캐시 전략
   * @param keyArgs 키 생성 인자
   * @returns 캐시된 데이터 또는 null
   */
  async get<T>(
    strategy: CacheStrategy,
    ...keyArgs: (string | number)[]
  ): Promise<T | null> {
    try {
      const key = strategy.generateKey(...keyArgs);
      const cached = await this.redisService.get(key);

      if (cached) {
        this.logger.debug(`Cache hit: ${key}`);
        return JSON.parse(cached) as T;
      }

      this.logger.debug(`Cache miss: ${key}`);
      return null;
    } catch (error) {
      this.logger.error(`Error getting cache for key: ${strategy.generateKey(...keyArgs)}`, error);
      return null; // 캐시 실패 시 null 반환하여 DB 조회로 폴백
    }
  }

  /**
   * 캐시에 데이터 저장
   * @param strategy 캐시 전략
   * @param keyArgs 키 생성 인자
   * @param value 저장할 데이터
   */
  async set<T>(
    strategy: CacheStrategy,
    value: T,
    ...keyArgs: (string | number)[]
  ): Promise<void> {
    try {
      const key = strategy.generateKey(...keyArgs);
      const serialized = JSON.stringify(value);
      const ttl = strategy.getTtl();

      await this.redisService.set(key, serialized, ttl);
      this.logger.debug(`Cache set: ${key} (TTL: ${ttl}s)`);
    } catch (error) {
      this.logger.error(`Error setting cache for key: ${strategy.generateKey(...keyArgs)}`, error);
      // 캐시 저장 실패는 로깅만 하고 예외를 던지지 않음 (비즈니스 로직에 영향 없음)
    }
  }

  /**
   * Cache-Aside 패턴: 캐시 조회 → 폴백 함수 실행 → 캐시 저장
   * @param strategy 캐시 전략
   * @param keyArgs 키 생성 인자
   * @param fallback 캐시 미스 시 실행할 함수
   * @returns 캐시된 데이터 또는 폴백 함수 결과
   */
  async getOrSet<T>(
    strategy: CacheStrategy,
    fallback: () => Promise<T>,
    ...keyArgs: (string | number)[]
  ): Promise<T> {
    // 1. 캐시 조회
    const cached = await this.get<T>(strategy, ...keyArgs);
    if (cached !== null) {
      return cached;
    }

    // 2. 폴백 함수 실행 (DB 조회 등)
    const value = await fallback();

    // 3. 캐시 저장
    await this.set(strategy, value, ...keyArgs);

    return value;
  }
}
