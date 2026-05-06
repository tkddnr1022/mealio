import { OAuthErrorClientPage } from './OAuthErrorClientPage';
import {
  BACKEND_ERROR_CODE_QUERY_PARAMS,
  BACKEND_ERROR_MESSAGE_QUERY_PARAMS,
  OAUTH_ERROR_DESCRIPTION_QUERY_PARAM,
  OAUTH_ERROR_QUERY_PARAM,
} from '@/lib/config/oauth-error.config';
import { buildLoginUrl, NEXT_QUERY_PARAM } from '@/lib/auth/routes';
import {
  getFirstTrimmedSearchParam,
  getTrimmedSearchParam,
  resolveSearchParams,
  type SearchParamRecord,
} from '@/lib/utils/search-params';

interface OAuthErrorDisplay {
  code: string;
  message: string;
}

interface OAuthErrorPageProps {
  searchParams?: Promise<SearchParamRecord>;
}

function getFirstParamValue(
  searchParams: SearchParamRecord | undefined,
  keys: readonly string[],
): string | null {
  return getFirstTrimmedSearchParam(searchParams, keys) ?? null;
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
  searchParams: SearchParamRecord | undefined,
): OAuthErrorDisplay | null {
  const oauthError = getTrimmedSearchParam(searchParams?.[OAUTH_ERROR_QUERY_PARAM]);
  const oauthErrorDescription =
    getTrimmedSearchParam(searchParams?.[OAUTH_ERROR_DESCRIPTION_QUERY_PARAM]) ?? '';
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

export default async function OAuthErrorPage({ searchParams }: OAuthErrorPageProps) {
  const resolvedSearchParams = await resolveSearchParams(searchParams);
  const nextForLogin = getTrimmedSearchParam(resolvedSearchParams?.[NEXT_QUERY_PARAM]);
  const oauthError = resolveOAuthError(resolvedSearchParams);
  const loginHref = buildLoginUrl(nextForLogin);

  const display = oauthError ?? {
    code: 'UNKNOWN',
    message: '로그인 처리 중 문제가 발생했습니다. 다시 시도해 주세요.',
  };

  return (
    <OAuthErrorClientPage
      code={display.code}
      message={display.message}
      loginHref={loginHref}
    />
  );
}
