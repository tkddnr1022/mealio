import { NextRequest, NextResponse } from 'next/server';

import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { resolveApiBaseUrl } from '@/lib/config/env';
import { NEXT_QUERY_PARAM, buildLoginUrl } from '@/lib/auth/routes';

function resolveRefreshUrl(request: NextRequest): string {
  const apiBaseUrl = resolveApiBaseUrl();
  if (apiBaseUrl) {
    return `${apiBaseUrl}${API_ENDPOINTS.auth.refresh}`;
  }
  return new URL(API_ENDPOINTS.auth.refresh, request.nextUrl.origin).toString();
}

function sanitizeNextPath(raw: string | null): string {
  if (!raw) return '/';
  if (!raw.startsWith('/') || raw.startsWith('//')) return '/';
  return raw;
}

function readSetCookieHeaders(headers: Headers): string[] {
  const withOptional = headers as Headers & { getSetCookie?: () => string[] };
  if (typeof withOptional.getSetCookie === 'function') {
    return withOptional.getSetCookie();
  }
  const single = headers.get('set-cookie');
  return single ? [single] : [];
}

function copySetCookie(from: Headers, to: Headers): void {
  for (const cookie of readSetCookieHeaders(from)) {
    to.append('set-cookie', cookie);
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const nextPath = sanitizeNextPath(
    request.nextUrl.searchParams.get(NEXT_QUERY_PARAM),
  );
  const refreshUrl = resolveRefreshUrl(request);
  const inboundCookie = request.headers.get('cookie');
  let refreshResponse: Response;
  try {
    refreshResponse = await fetch(refreshUrl, {
      method: 'POST',
      headers: inboundCookie ? { Cookie: inboundCookie } : undefined,
      cache: 'no-store',
    });
  } catch {
    // TODO: 이부분은 sessionExpired가 아닌 네트워크 에러를 표시해야 함
    return NextResponse.redirect(
      new URL(buildLoginUrl(nextPath, true), request.url),
    );
  }

  if (refreshResponse.ok) {
    const successResponse = NextResponse.redirect(
      new URL(nextPath, request.url),
    );
    copySetCookie(refreshResponse.headers, successResponse.headers);
    return successResponse;
  }

  const loginResponse = NextResponse.redirect(
    new URL(buildLoginUrl(nextPath, true), request.url),
  );
  copySetCookie(refreshResponse.headers, loginResponse.headers);
  return loginResponse;
}
