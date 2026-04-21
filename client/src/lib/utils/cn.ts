import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Tailwind 클래스 머지 유틸.
 *
 * - {@link clsx}로 조건부 클래스 배열·객체·nullish 값을 문자열로 합치고,
 * - {@link twMerge}로 동일 속성(예: `p-2`·`p-4`)의 충돌을 뒤에 오는 값 우선으로 해소한다.
 *
 * 사용 예:
 * ```ts
 * cn('px-2 py-1', condition && 'px-4', { 'style-text-accent': hasError })
 * ```
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
