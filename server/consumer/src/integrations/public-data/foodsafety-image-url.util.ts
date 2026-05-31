const MAX_IMAGE_URL_LENGTH = 512;
const FOODSAFETY_SITE_ORIGIN = 'http://www.foodsafetykorea.go.kr';

/**
 * 공공데이터 API 이미지 URL 정규화 (절대 URL 또는 식약처 origin prefix)
 */
export function normalizeFoodsafetyImageUrl(value: unknown): string | null {
  if (value == null) {
    return null;
  }
  const trimmed = String(value).trim();
  if (trimmed.length === 0) {
    return null;
  }

  let url: string;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    url = trimmed;
  } else if (trimmed.startsWith('/')) {
    url = `${FOODSAFETY_SITE_ORIGIN}${trimmed}`;
  } else {
    return null;
  }

  return url.length > MAX_IMAGE_URL_LENGTH
    ? url.slice(0, MAX_IMAGE_URL_LENGTH)
    : url;
}
