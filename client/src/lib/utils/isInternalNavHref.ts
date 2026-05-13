/**
 * Next.js `Link`로 클라이언트 전환할 수 있는 앱 내 경로인지 판별한다.
 * (`//example.com` 같은 프로토콜 상대 URL은 제외)
 */

export function isInternalNavHref(href: string): boolean {
  return href.startsWith('/') && !href.startsWith('//');
}
