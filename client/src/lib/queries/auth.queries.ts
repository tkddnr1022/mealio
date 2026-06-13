'use client';

/**
 * 인증 React Query 훅.
 *
 * - `useLogoutMutation`: `POST /api/v1/auth/logout`. 성공 후 세션 캐시 무효화는 `onSettled`에서 처리한다.
 */

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from '@tanstack/react-query';

import { logout } from '@/lib/api/domains';
import { notifyAuthSessionCleared } from '@/lib/auth/auth-session';

import { userQueries } from '@/lib/queries/user.queries';

export const authQueries = {
  all: ['auth'] as const,
  logout: () => [...authQueries.all, 'logout'] as const,
} as const;

export function useLogoutMutation(
  options?: UseMutationOptions<void, Error, void>,
) {
  const queryClient = useQueryClient();
  const { meta: metaOption, onSettled, ...rest } = options ?? {};
  return useMutation<void, Error, void>({
    mutationKey: authQueries.logout(),
    mutationFn: () => logout(),
    ...rest,
    meta: {
      errorToastTitle: '로그아웃하지 못했어요',
      ...metaOption,
    },
    onSettled: (...args) => {
      notifyAuthSessionCleared();
      queryClient.setQueryData(userQueries.me(), null);
      void onSettled?.(...args);
    },
  });
}
