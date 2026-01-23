import { Request } from 'express';

/**
 * JWT 페이로드 (accessToken 내 sub에 사용자 ID)
 */
export interface JwtPayload {
  sub: string;
}

/**
 * 인증된 사용자 정보 (JwtAuthGuard에서 req.user에 설정)
 */
export interface AuthUser {
  id: number;
}

/**
 * user 속성을 포함한 Express Request 확장
 * JwtAuthGuard를 거친 요청에서 req.user로 인증 사용자에 접근
 */
export interface RequestWithUser extends Request {
  user: AuthUser;
}
