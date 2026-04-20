/**
 * `next/image` 전용 이미지 유틸.
 *
 * - {@link buildBlurDataUrl}은 placeholder로 쓸 저용량 data URL을 생성한다.
 *   서버에서 BlurHash/LQIP 문자열을 내려주지 않는 경우의 폴백으로 사용한다.
 * - {@link buildSizes}는 뷰포트 폭 → 이미지 표시 폭 매핑을 받아
 *   `sizes` 속성 문자열을 생성한다.
 * - {@link RESPONSIVE_SIZES}는 자주 쓰는 반응형 프리셋이다.
 */

const BASE64_PREFIX = 'data:image/svg+xml;base64,';

export interface BlurDataUrlOptions {
  /** SVG 가로 픽셀 크기(내부 좌표계). 기본 8 */
  width?: number;
  /** SVG 세로 픽셀 크기(내부 좌표계). 기본 8 */
  height?: number;
  /** 단색 블러 색상 (기본 `#e5e7eb` — Tailwind gray-200) */
  color?: string;
}

/**
 * 단색 SVG 기반 `blurDataURL`을 생성한다. 서버 제공 BlurHash가 없는 경우의 기본 placeholder용.
 *
 * `placeholder="blur"` 사용 시 원본 이미지가 로드되기 전 화면을 채운다.
 */
export function buildBlurDataUrl(options: BlurDataUrlOptions = {}): string {
  const { width = 8, height = 8, color = '#e5e7eb' } = options;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="${color}"/></svg>`;
  return `${BASE64_PREFIX}${toBase64(svg)}`;
}

/**
 * `sizes` 문자열을 생성한다.
 *
 * 입력: 미디어 쿼리 breakpoint 배열 (큰 값부터 내려오며 우선 매칭)과 기본값.
 *
 * 예: `buildSizes([{ maxWidth: 768, size: '100vw' }, { maxWidth: 1200, size: '50vw' }], '33vw')`
 *   → `"(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"`
 */
export function buildSizes(
  breakpoints: ReadonlyArray<{ maxWidth: number; size: string }>,
  defaultSize: string,
): string {
  const parts = breakpoints.map(
    ({ maxWidth, size }) => `(max-width: ${maxWidth}px) ${size}`,
  );
  parts.push(defaultSize);
  return parts.join(', ');
}

/**
 * 자주 쓰는 반응형 `sizes` 프리셋.
 *
 * - `fullWidth`: 항상 뷰포트 전폭.
 * - `card`: 카드 그리드 — 모바일 1열, 태블릿 2열, 데스크톱 3열.
 * - `hero`: 히어로 — 모바일 전폭, 데스크톱 절반.
 * - `thumbnail`: 썸네일 — 고정 폭(최대 320px).
 */
export const RESPONSIVE_SIZES = {
  fullWidth: '100vw',
  card: buildSizes(
    [
      { maxWidth: 768, size: '100vw' },
      { maxWidth: 1200, size: '50vw' },
    ],
    '33vw',
  ),
  hero: buildSizes([{ maxWidth: 768, size: '100vw' }], '50vw'),
  thumbnail: buildSizes([{ maxWidth: 768, size: '50vw' }], '320px'),
} as const;

function toBase64(input: string): string {
  if (typeof window === 'undefined' && typeof Buffer !== 'undefined') {
    return Buffer.from(input, 'utf-8').toString('base64');
  }
  if (typeof btoa === 'function') {
    return btoa(
      encodeURIComponent(input).replace(/%([0-9A-F]{2})/g, (_, hex: string) =>
        String.fromCharCode(parseInt(hex, 16)),
      ),
    );
  }
  return input;
}
