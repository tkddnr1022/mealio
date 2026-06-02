'use client';

/**
 * 유저 프로필 React Query 훅.
 *
 * - `useCurrentUser`: `GET /api/v1/users/me` 세션 조회.
 *   비로그인(401)을 `null`로 정규화하므로 결과 타입은 `UserProfile | null`이다.
 *   이 훅은 `AuthProvider`의 단일 소스이기도 하며, 임의 컴포넌트도 동일 캐시를 공유한다.
 * - `useUpdateNickname`: `PATCH /api/v1/users/me/nickname`. 성공 시 `userQueries.me` 캐시를
 *   invalidate하여 최신 프로필을 재조회한다.
 */

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
  type UseQueryOptions,
} from '@tanstack/react-query';

import { getMyActivities, updateMyNickname } from '@/lib/api/domains';
import { fetchCurrentUser } from '@/lib/auth/session.client';
import { QUERY_CACHE } from '@/lib/config/cache.config';
import type {
  UpdateNicknameRequest,
  UpdateNicknameResponse,
  UserActivityList,
  UserActivityQuery,
  UserProfile,
} from '@/lib/types/user';

// ─── 쿼리 키 ──────────────────────────────────────────────────────────────────

export const userQueries = {
  all: ['users'] as const,
  me: () => [...userQueries.all, 'me'] as const,
  activities: (query: UserActivityQuery = {}) =>
    [...userQueries.all, 'activities', query] as const,
} as const;

// ─── 훅 ───────────────────────────────────────────────────────────────────────

type CurrentUserQueryOpts = Omit<
  UseQueryOptions<UserProfile | null, Error, UserProfile | null>,
  'queryKey' | 'queryFn'
>;

/**
 * 현재 세션 유저를 조회한다.
 * 401(비로그인)은 `null`로 정규화되므로 쿼리는 error 상태로 빠지지 않는다.
 */
export function useCurrentUser(options?: CurrentUserQueryOpts) {
  const { meta: metaOption, ...rest } = options ?? {};
  return useQuery<UserProfile | null, Error>({
    queryKey: userQueries.me(),
    queryFn: ({ signal }) => fetchCurrentUser({ signal }),
    ...QUERY_CACHE.user,
    ...rest,
    meta: {
      errorToastTitle: '세션을 불러오지 못했어요',
      ...metaOption,
    },
  });
}

export function useUpdateNickname(
  options?: UseMutationOptions<UpdateNicknameResponse, Error, UpdateNicknameRequest>,
) {
  const qc = useQueryClient();
  const { meta: metaOption, ...rest } = options ?? {};
  return useMutation<
    UpdateNicknameResponse,
    Error,
    UpdateNicknameRequest,
    { previous?: UserProfile | null }
  >({
    mutationFn: (params) => updateMyNickname(params),
    ...rest,
    meta: {
      errorToastTitle: '닉네임을 변경하지 못했어요',
      ...metaOption,
    },
    onMutate: async (variables) => {
      await qc.cancelQueries({ queryKey: userQueries.me() });
      const previous = qc.getQueryData<UserProfile | null>(userQueries.me());
      const nextNickname = variables.nickname.trim();
      qc.setQueryData<UserProfile | null>(userQueries.me(), (prev) =>
        prev ? { ...prev, nickname: nextNickname } : prev,
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous !== undefined) {
        qc.setQueryData(userQueries.me(), ctx.previous);
      }
    },
    onSuccess: (data) => {
      // 변경된 닉네임을 즉시 반영하고, 서버 상태 재동기화를 트리거한다.
      qc.setQueryData<UserProfile | null>(userQueries.me(), (prev) =>
        prev ? { ...prev, nickname: data.nickname } : prev,
      );
      void qc.invalidateQueries({ queryKey: userQueries.me(), refetchType: 'none' });
    },
  });
}

type UserActivityQueryOpts = Omit<
  UseQueryOptions<UserActivityList, Error, UserActivityList>,
  'queryKey' | 'queryFn'
>;

export function useMyActivities(
  params: UserActivityQuery = {},
  options?: UserActivityQueryOpts,
) {
  const { meta: metaOption, ...rest } = options ?? {};
  return useQuery<UserActivityList, Error>({
    queryKey: userQueries.activities(params),
    queryFn: ({ signal }) => getMyActivities(params, { signal }),
    ...QUERY_CACHE.user,
    ...rest,
    meta: {
      errorToastTitle: '활동 내역을 불러오지 못했어요',
      ...metaOption,
    },
  });
}
