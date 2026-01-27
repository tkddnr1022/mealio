import { SetMetadata } from '@nestjs/common';

/**
 * 캐시 메타데이터 키
 */
export const CACHE_METADATA_KEY = 'cache:metadata';

/**
 * 캐시 메타데이터 인터페이스
 */
export interface CacheMetadata {
  strategy: string; // 전략 클래스 이름
  keyArgs?: string[]; // 키 생성에 사용할 메서드 인자 이름들
  ttl?: number; // 커스텀 TTL (선택사항)
}

/**
 * @Cacheable 데코레이터
 * 메서드 결과를 자동으로 캐싱한다.
 *
 * TODO: 현재는 인터셉터가 구현되지 않아 사용되지 않음.
 * 향후 확장 시 CacheInterceptor를 구현하여 AOP 방식의 자동 캐싱을 지원할 수 있음.
 *
 * 구현 시 필요한 작업:
 * 1. CacheInterceptor 클래스 생성 (NestInterceptor 구현)
 * 2. ExecutionContext에서 메서드 메타데이터 읽기
 * 3. CacheService와 전략을 주입받아 getOrSet 호출
 * 4. 전역 또는 컨트롤러/메서드 레벨에서 인터셉터 등록
 *
 * @param strategy 캐시 전략 클래스 이름 (예: 'RecipeCacheStrategy')
 * @param keyArgs 메서드 인자 중 캐시 키 생성에 사용할 인자 이름들 (예: ['id'])
 * @param ttl 커스텀 TTL (초 단위, 선택사항)
 *
 * @example
 * ```typescript
 * @Cacheable('RecipeCacheStrategy', ['id'])
 * async findById(id: number): Promise<Recipe> {
 *   return this.repository.findById(id);
 * }
 * ```
 */
export const Cacheable = (
  strategy: string,
  keyArgs?: string[],
  ttl?: number,
) => {
  const metadata: CacheMetadata = {
    strategy,
    keyArgs,
    ttl,
  };
  return SetMetadata(CACHE_METADATA_KEY, metadata);
};
