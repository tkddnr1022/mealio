/** `error.tsx` / `global-error.tsx`에서 사용자에게 보여 줄 짧은 메시지 */
export function resolveErrorBoundaryMessage(
  error: Error & { digest?: string },
): string {
  const raw =
    `${error.name} ${error.message} ${error.digest ?? ''}`.toLowerCase();

  if (raw.includes('not found') || raw.includes('404')) {
    return 'Not Found';
  }
  if (
    raw.includes('401') ||
    raw.includes('403') ||
    raw.includes('unauthorized') ||
    raw.includes('forbidden')
  ) {
    return '접근 권한이 없어요';
  }
  if (
    raw.includes('network') ||
    raw.includes('fetch') ||
    raw.includes('timeout') ||
    raw.includes('ecconn')
  ) {
    return '네트워크 상태를 확인한 뒤 다시 시도해 주세요';
  }
  return '일시적인 오류가 발생했어요';
}
