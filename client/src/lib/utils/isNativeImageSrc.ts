/**
 * Next.js `Image` 대신 네이티브 `<img>`를 쓸지 판별한다.
 *
 * - `data:` / `blob:` / `http(s):` / 프로토콜 상대(`//`) URL → `<img>`
 * - 앱 내 정적 경로(`/…`, `//` 제외) → `next/image`
 */

export function isNativeImageSrc(src: string): boolean {
  const trimmed = src.trim();
  if (!trimmed) return true;
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) return true;
  if (trimmed.startsWith('//')) return true;
  if (/^https?:\/\//i.test(trimmed)) return true;
  return false;
}
