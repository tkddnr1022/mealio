/**
 * 공통 데이터 정규화 유틸리티.
 * 기존 consumer 구현에서 반복되던 숫자/문자열/타임스탬프 처리 로직을 모아둔다.
 */

export function normalizeNumericId(
  value: unknown,
  options: { min?: number } = {},
): number | null {
  if (value == null) return null;
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isInteger(num)) return null;
  if (options.min != null && num < options.min) return null;
  return num;
}

export function normalizeString(
  value: unknown,
  options: { trim?: boolean; toLowerCase?: boolean } = {
    trim: true,
  },
): string | null {
  if (typeof value !== 'string') return null;
  let result = value;
  if (options.trim) {
    result = result.trim();
  }
  if (options.toLowerCase) {
    result = result.toLowerCase();
  }
  return result.length === 0 ? null : result;
}

export function normalizeTimestamp(value: unknown): Date | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }
  if (typeof value !== 'string' && typeof value !== 'number') {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
}

export function ensureArray<T>(value: T | T[] | null | undefined): T[] {
  if (Array.isArray(value)) return value;
  if (value == null) return [];
  return [value];
}
