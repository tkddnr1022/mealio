import type { Request } from 'express';

/**
 * Nest/Express 미들웨어 시점의 요청 pathname.
 * req.path는 라우터 mount 기준으로 '/'만 남는 경우가 있어 originalUrl을 우선한다.
 */
export function getHttpRequestPathname(
  req: Pick<Request, 'originalUrl' | 'url' | 'path'>,
): string {
  const candidate = req.originalUrl ?? req.url ?? req.path ?? '';
  return candidate.split('?')[0] ?? candidate;
}

/**
 * 애플리케이션 HTTP 로깅·메트릭에서 제외할 인프라/관측 경로.
 */
export function isExcludedFromAppHttpObservability(pathOrUrl: string): boolean {
  const path = pathOrUrl.split('?')[0] ?? pathOrUrl;
  return path === '/metrics';
}

export function shouldExcludeRequestFromAppHttpObservability(
  req: Pick<Request, 'originalUrl' | 'url' | 'path'>,
): boolean {
  return isExcludedFromAppHttpObservability(getHttpRequestPathname(req));
}
