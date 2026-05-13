/**
 * Next.js `Link`로 클라이언트 전환할 수 있는 앱 내 경로인지 판별한다.
 * (`//example.com` 같은 프로토콜 상대 URL은 제외)
 */
// TODO: Link 컴포넌트에서 외부 URL 사용할 수 있으니 제거
export function isInternalNavHref(href: string): boolean {
  return href.startsWith('/') && !href.startsWith('//');
}
