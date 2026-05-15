'use client';

import { AlertTriangle } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

import { InfoScreen } from '@/components/layout/InfoScreen';
import { FullPageSuspenseFallback } from '@/components/layout/FullPageSuspenseFallback';
import {
  BACKEND_ERROR_CODE_QUERY_PARAMS,
  BACKEND_ERROR_MESSAGE_QUERY_PARAMS,
  OAUTH_ERROR_DESCRIPTION_QUERY_PARAM,
  OAUTH_ERROR_QUERY_PARAM,
} from '@/lib/config/oauth-error.config';
import { buildLoginUrl, NEXT_QUERY_PARAM } from '@/lib/auth/routes';

interface OAuthErrorDisplay {
  code: string;
  message: string;
}

function getFirstParamValue(
  searchParams: ReturnType<typeof useSearchParams>,
  keys: readonly string[],
): string | null {
  for (const key of keys) {
    const value = searchParams.get(key);
    if (value && value.trim().length > 0) {
      return value.trim();
    }
  }
  return null;
}

function getOAuthErrorMessage(code: string, fallback: string): string {
  const normalizedCode = code.toLowerCase();

  if (normalizedCode.includes('access_denied')) {
    return '소셜 로그인 동의가 취소되었습니다. 다시 시도해 주세요.';
  }
  if (
    normalizedCode.includes('unauthorized') ||
    normalizedCode.includes('invalid_grant')
  ) {
    return '인증이 만료되었거나 유효하지 않습니다. 다시 로그인해 주세요.';
  }
  if (
    normalizedCode.includes('bad_request') ||
    normalizedCode.includes('invalid_request')
  ) {
    return '로그인 요청이 올바르지 않습니다. 잠시 후 다시 시도해 주세요.';
  }
  if (
    normalizedCode.includes('server') ||
    normalizedCode.includes('internal')
  ) {
    return '로그인 처리 중 서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';
  }

  return fallback;
}

function resolveOAuthError(
  searchParams: ReturnType<typeof useSearchParams>,
): OAuthErrorDisplay | null {
  const oauthError = searchParams.get(OAUTH_ERROR_QUERY_PARAM)?.trim();
  const oauthErrorDescription =
    searchParams.get(OAUTH_ERROR_DESCRIPTION_QUERY_PARAM)?.trim() ?? '';
  const backendErrorCode = getFirstParamValue(
    searchParams,
    BACKEND_ERROR_CODE_QUERY_PARAMS,
  );
  const backendErrorMessage = getFirstParamValue(
    searchParams,
    BACKEND_ERROR_MESSAGE_QUERY_PARAMS,
  );

  if (backendErrorCode || backendErrorMessage) {
    const code = backendErrorCode ?? 'UNAUTHORIZED';
    const message = getOAuthErrorMessage(
      code,
      backendErrorMessage ?? 'OAuth 인증에 실패했습니다. 다시 로그인해 주세요.',
    );
    return { code, message };
  }

  if (oauthError) {
    const fallbackMessage =
      oauthErrorDescription.length > 0
        ? oauthErrorDescription
        : 'OAuth 인증에 실패했습니다. 다시 로그인해 주세요.';
    return {
      code: oauthError,
      message: getOAuthErrorMessage(oauthError, fallbackMessage),
    };
  }

  return null;
}

function OAuthErrorPageContent() {
  const searchParams = useSearchParams();
  const rawNext = searchParams.get(NEXT_QUERY_PARAM);
  const nextForLogin =
    rawNext && rawNext.trim().length > 0 ? rawNext.trim() : null;
  const oauthError = resolveOAuthError(searchParams);
  const loginHref = buildLoginUrl(nextForLogin);

  const display = oauthError ?? {
    code: 'UNKNOWN',
    message: '로그인 처리 중 문제가 발생했습니다. 다시 시도해 주세요.',
  };

  return (
    <main className="flex h-full min-h-0 flex-1 items-center justify-center bg-background-primary-default px-4">
      <div className="w-full max-w-(--layout-content-max-width)">
        <InfoScreen
          title="로그인에 실패했습니다"
          message={`${display.message} (code: ${display.code})`}
          icon={
            <AlertTriangle
              className="size-8 text-text-accent"
              strokeWidth={2}
              aria-hidden
            />
          }
          buttonLabel="로그인으로 돌아가기"
          buttonHref={loginHref}
        />
      </div>
    </main>
  );
}

export default function OAuthErrorPage() {
  return (
    <Suspense fallback={<FullPageSuspenseFallback />}>
      <OAuthErrorPageContent />
    </Suspense>
  );
}
