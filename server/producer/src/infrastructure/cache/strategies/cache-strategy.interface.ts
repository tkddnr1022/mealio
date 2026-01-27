/**
 * 캐시 전략 인터페이스
 * 각 도메인별 캐시 TTL 및 키 생성 전략을 정의한다.
 * 
 * 주의: Producer는 읽기 전용 캐시만 사용하므로 delete 관련 메서드는 포함하지 않음.
 * 캐시 무효화는 Consumer의 cache-invalidation 컨슈머에서 처리한다.
 */
export interface CacheStrategy {
  /**
   * 캐시 키 생성
   */
  generateKey(...args: (string | number)[]): string;

  /**
   * TTL (초 단위)
   */
  getTtl(): number;
}
