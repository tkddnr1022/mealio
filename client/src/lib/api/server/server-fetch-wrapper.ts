import 'server-only';

import { redirect } from 'next/navigation';
import { isApiError } from '@/lib/api/error';
import { buildSsrRefreshBridgeUrl } from '@/lib/auth/routes';

interface ServerFetchWrapperParams<T> {
  fetch: Promise<T>;
  currentUrl: string | null | undefined;
}

/**
 * SSR API 호출의 공통 예외 처리 래퍼.
 * - 401 응답은 refresh bridge로 리다이렉트한다.
 * - 그 외 에러는 호출자에게 그대로 전달한다.
 */
export async function serverFetchWrapper<T>({
  fetch,
  currentUrl,
}: ServerFetchWrapperParams<T>): Promise<T> {
  try {
    return await fetch;
  } catch (error) {
    if (isApiError(error) && error.status === 401) {
      redirect(buildSsrRefreshBridgeUrl(currentUrl));
    }
    throw error;
  }
}
