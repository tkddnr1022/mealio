/**
 * Mongoose(MongoDB) 커넥션 풀 설정 타입
 * - 앱(Producer/Consumer)에서는 이 타입만 정의하고, URI·retry·readPreference 등은 shared에서 공용 관리
 */

export interface MongoosePoolConfig {
  /**
   * 최대 커넥션 수
   */
  maxPoolSize?: number;
  /**
   * 최소 유지 커넥션 수
   */
  minPoolSize?: number;
  /**
   * 서버 선택 타임아웃 (ms)
   */
  serverSelectionTimeoutMS?: number;
  /**
   * 소켓 타임아웃 (ms)
   */
  socketTimeoutMS?: number;
}
