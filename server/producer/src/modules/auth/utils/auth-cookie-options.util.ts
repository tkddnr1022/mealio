import { ConfigService } from '@nestjs/config';

import { isSecureCookie } from './cookie-security.util';

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

export type AuthCookieOptions = {
  httpOnly: true;
  secure: boolean;
  sameSite: 'lax';
  path: '/';
  domain?: string;
};

function isLocalOrIpHost(hostname: string): boolean {
  if (LOCAL_HOSTS.has(hostname)) return true;
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname);
}

/**
 * 단순 2-label registrable domain 추정 (예: api.mealio.site → mealio.site).
 * Public Suffix List 예외(co.uk 등)는 FRONTEND·API URL 호스트가 같은 suffix를 공유할 때만 동작한다.
 */
function resolveRegistrableDomain(hostname: string): string {
  const parts = hostname.split('.');
  if (parts.length <= 2) return hostname;
  return parts.slice(-2).join('.');
}

function isHostUnderRoot(host: string, root: string): boolean {
  return host === root || host.endsWith(`.${root}`);
}

/**
 * 프론트·API가 서로 다른 서브도메인일 때 공유할 Set-Cookie Domain을 반환한다.
 *
 * - 호스트가 같거나 localhost/IP면 `undefined`(host-only).
 * - FRONTEND_APP_BASE_URL·OAUTH_CALLBACK_BASE_URL의 registrable domain이 같을 때만 `.mealio.site` 형태.
 */
export function resolveAuthCookieDomain(
  config: ConfigService,
): string | undefined {
  const frontendUrl = config.getOrThrow<string>('FRONTEND_APP_BASE_URL');
  const apiUrl = config.getOrThrow<string>('OAUTH_CALLBACK_BASE_URL');

  let frontendHost: string;
  let apiHost: string;
  try {
    frontendHost = new URL(frontendUrl).hostname;
    apiHost = new URL(apiUrl).hostname;
  } catch {
    return undefined;
  }

  if (frontendHost === apiHost) return undefined;
  if (isLocalOrIpHost(frontendHost) || isLocalOrIpHost(apiHost)) {
    return undefined;
  }

  const frontendRoot = resolveRegistrableDomain(frontendHost);
  const apiRoot = resolveRegistrableDomain(apiHost);
  if (frontendRoot !== apiRoot) return undefined;

  if (
    !isHostUnderRoot(frontendHost, frontendRoot) ||
    !isHostUnderRoot(apiHost, frontendRoot)
  ) {
    return undefined;
  }

  return `.${frontendRoot}`;
}

/** accessToken·refreshToken Set-Cookie / clearCookie 공통 옵션. */
export function getAuthCookieOptions(config: ConfigService): AuthCookieOptions {
  const domain = resolveAuthCookieDomain(config);
  return {
    httpOnly: true,
    secure: isSecureCookie(config),
    sameSite: 'lax',
    path: '/',
    ...(domain ? { domain } : {}),
  };
}
