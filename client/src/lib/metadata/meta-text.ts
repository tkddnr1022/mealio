const ELLIPSIS = '…';

/**
 * 메타 설명·OG description 등 한 줄로 쓰기 위한 길이 제한.
 */
export function truncateForMeta(text: string, max: number): string {
  const singleLine = text.replace(/\s+/g, ' ').trim();
  if (singleLine.length <= max) {
    return singleLine;
  }
  const cut = singleLine
    .slice(0, Math.max(0, max - ELLIPSIS.length))
    .trimEnd();
  return `${cut}${ELLIPSIS}`;
}
