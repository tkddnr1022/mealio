/**
 * 날짜·시간 포맷팅 유틸.
 *
 * - 모든 함수는 순수(Pure)하며 Intl API 외의 외부 의존성을 갖지 않는다.
 * - 서버·클라이언트 양쪽에서 동일 결과가 나오도록 명시 `locale`/`timeZone`을 받는다.
 *   (기본 `locale: 'ko-KR'`, 기본 `timeZone: 'Asia/Seoul'`)
 * - 요리 소요 시간(분 단위 정수)은 {@link formatCookingTime}로 사람이 읽기 쉬운
 *   문구로 변환한다(예: `90` → `"1시간 30분"`).
 */

const DEFAULT_LOCALE = 'ko-KR';
const DEFAULT_TIME_ZONE = 'Asia/Seoul';

export type DateInput = Date | string | number;

export interface FormatDateOptions {
  locale?: string;
  timeZone?: string;
}

/**
 * `DateInput`을 `Date`로 정규화한다. 유효하지 않으면 `null`을 반환한다.
 */
export function toDate(value: DateInput | null | undefined): Date | null {
  if (value === null || value === undefined) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * 날짜를 `YYYY.MM.DD` 형식으로 포맷한다. (한국식 표기)
 */
export function formatDate(
  value: DateInput | null | undefined,
  options: FormatDateOptions = {},
): string {
  const date = toDate(value);
  if (!date) return '';
  return new Intl.DateTimeFormat(options.locale ?? DEFAULT_LOCALE, {
    timeZone: options.timeZone ?? DEFAULT_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .format(date)
    .replace(/\.\s?/g, '.')
    .replace(/\.$/, '');
}

/**
 * 날짜+시간을 `YYYY.MM.DD HH:mm` 형식으로 포맷한다.
 */
export function formatDateTime(
  value: DateInput | null | undefined,
  options: FormatDateOptions = {},
): string {
  const date = toDate(value);
  if (!date) return '';
  const datePart = formatDate(date, options);
  const timePart = new Intl.DateTimeFormat(options.locale ?? DEFAULT_LOCALE, {
    timeZone: options.timeZone ?? DEFAULT_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
  return `${datePart} ${timePart}`;
}

/**
 * 시간을 `오전/오후 h:mm` 형식으로 포맷한다. (예: `오전 10:31`)
 */
export function formatMeridiemTime(
  value: DateInput | null | undefined,
  options: FormatDateOptions = {},
): string {
  const date = toDate(value);
  if (!date) return '';
  return new Intl.DateTimeFormat(options.locale ?? DEFAULT_LOCALE, {
    timeZone: options.timeZone ?? DEFAULT_TIME_ZONE,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

/**
 * 현재 시각 대비 상대 시간 문구를 반환한다(예: `"3분 전"`, `"1시간 후"`).
 * Intl.RelativeTimeFormat을 사용해 로케일 규칙을 따른다.
 */
export function formatRelativeTime(
  value: DateInput | null | undefined,
  options: FormatDateOptions & { now?: DateInput } = {},
): string {
  const date = toDate(value);
  if (!date) return '';
  const now = toDate(options.now ?? new Date()) ?? new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffSec = Math.round(diffMs / 1000);

  const formatter = new Intl.RelativeTimeFormat(
    options.locale ?? DEFAULT_LOCALE,
    { numeric: 'auto' },
  );

  const absSec = Math.abs(diffSec);
  if (absSec < 60) return formatter.format(diffSec, 'second');
  const diffMin = Math.round(diffSec / 60);
  if (Math.abs(diffMin) < 60) return formatter.format(diffMin, 'minute');
  const diffHour = Math.round(diffMin / 60);
  if (Math.abs(diffHour) < 24) return formatter.format(diffHour, 'hour');
  const diffDay = Math.round(diffHour / 24);
  if (Math.abs(diffDay) < 7) return formatter.format(diffDay, 'day');
  const diffWeek = Math.round(diffDay / 7);
  if (Math.abs(diffWeek) < 5) return formatter.format(diffWeek, 'week');
  const diffMonth = Math.round(diffDay / 30);
  if (Math.abs(diffMonth) < 12) return formatter.format(diffMonth, 'month');
  const diffYear = Math.round(diffDay / 365);
  return formatter.format(diffYear, 'year');
}

/**
 * 요리 소요 시간(분 단위)을 한국어 표기로 변환한다.
 *
 * - `null`·음수·비정수는 빈 문자열로 처리한다.
 * - `0` → `"0분"`, `59` → `"59분"`, `60` → `"1시간"`, `90` → `"1시간 30분"`.
 */
export function formatCookingTime(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined) return '';
  if (!Number.isFinite(minutes) || minutes < 0) return '';
  const total = Math.floor(minutes);
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  if (hours === 0) return `${mins}분`;
  if (mins === 0) return `${hours}시간`;
  return `${hours}시간 ${mins}분`;
}
