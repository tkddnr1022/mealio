import '@tanstack/react-query';

/**
 * 전역 Query/Mutation 오류 토스트용 {@link https://tanstack.com/query/latest/docs/framework/react/guides/query-options#meta | meta} 확장.
 */
declare module '@tanstack/react-query' {
  interface Register {
    queryMeta: {
      /** true면 QueryCache 전역 onError에서 notifyApiError를 호출하지 않음 */
      suppressGlobalErrorToast?: boolean;
      /** notifyApiError 제목 오버라이드 */
      errorToastTitle?: string;
    };
    mutationMeta: {
      suppressGlobalErrorToast?: boolean;
      errorToastTitle?: string;
    };
  }
}

export {};
