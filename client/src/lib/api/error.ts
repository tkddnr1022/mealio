/**
 * 백엔드 API 호출 시 발생하는 에러를 표현하는 공통 클래스.
 *
 * - HTTP 상태 코드, 서버가 내려준 에러 코드/상세, 분산 추적용 Correlation-Id를 함께 보관한다.
 * - UI에서 사용자에게 노출할 메시지는 {@link ApiError.getUserMessage}로 얻는다.
 * - 인스턴스 판별은 {@link isApiError}를 사용한다.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly details?: unknown;
  readonly correlationId?: string;

  constructor(params: {
    status: number;
    message: string;
    code?: string;
    details?: unknown;
    correlationId?: string;
  }) {
    super(params.message);
    this.name = 'ApiError';
    this.status = params.status;
    this.code = params.code;
    this.details = params.details;
    this.correlationId = params.correlationId;
  }

  /**
   * 네트워크 실패, JSON 파싱 실패 등 비-HTTP 에러를 ApiError로 감싸기 위한 헬퍼.
   * status 0은 "응답을 수신하지 못함"을 의미한다.
   */
  static fromUnknown(error: unknown, correlationId?: string): ApiError {
    if (error instanceof ApiError) return error;
    const message = error instanceof Error ? error.message : String(error);
    return new ApiError({
      status: 0,
      message: message || 'Unknown network error',
      code: 'NETWORK_ERROR',
      correlationId,
    });
  }

  /**
   * 사용자에게 노출할 한국어 메시지. 상태 코드별 기본 문구를 제공하며,
   * 서버가 명시적 메시지를 내려준 경우(this.message) 그것을 우선한다.
   */
  getUserMessage(): string {
    if (this.message && this.status !== 0 && this.status !== 500) {
      return this.message;
    }
    return DEFAULT_USER_MESSAGE[this.status] ?? DEFAULT_USER_MESSAGE.default;
  }
}

export function isApiError(value: unknown): value is ApiError {
  return value instanceof ApiError;
}

const DEFAULT_USER_MESSAGE: Record<number | 'default', string> = {
  0: '네트워크 연결을 확인해 주세요.',
  400: '요청이 올바르지 않습니다.',
  401: '로그인이 필요합니다.',
  403: '접근 권한이 없습니다.',
  404: '요청한 정보를 찾을 수 없습니다.',
  408: '요청 시간이 초과되었습니다. 다시 시도해 주세요.',
  409: '요청이 현재 상태와 충돌합니다.',
  422: '입력값을 다시 확인해 주세요.',
  429: '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.',
  500: '일시적인 서버 오류가 발생했습니다.',
  502: '서버와 통신 중 오류가 발생했습니다.',
  503: '서비스가 일시적으로 이용 불가합니다.',
  504: '서버 응답이 지연되고 있습니다.',
  default: '알 수 없는 오류가 발생했습니다.',
};
