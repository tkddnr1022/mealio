'use client';

import { useCallback } from 'react';

import { notifyApiError } from './notify-api-error';
import type { NotifyApiErrorOptions } from './notify-api-error';

/**
 * 페이지·훅에서 `notifyApiError`를 안정적으로 쓰기 위한 얇은 래퍼.
 * (전역 브리지 기반이라 Provider 밖에서는 no-op에 가깝게 동작한다.)
 */
export function useErrorToast(): (
  error: unknown,
  options?: NotifyApiErrorOptions,
) => string | null {
  return useCallback(
    (error: unknown, options?: NotifyApiErrorOptions) =>
      notifyApiError(error, options),
    [],
  );
}
