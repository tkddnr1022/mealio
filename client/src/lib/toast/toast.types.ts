/**
 * 전역 Toast 도메인 타입.
 *
 * 시각 토큰은 `Alert`와 동일한 `alert-*` 계열을 재사용한다.
 * {@link ToastVariant}의 `success`는 `Alert`에 없는 별도 스타일이다.
 */

export type ToastVariant = 'error' | 'warning' | 'info' | 'success';

export interface ToastActionSpec {
  label: string;
  onAction: () => void;
}

export interface ToastEnqueueInput {
  variant?: ToastVariant;
  /** 짧은 제목 (필수) */
  title: string;
  /** 부가 설명 */
  message?: string;
  /** 자동 닫힘(ms). `0`이면 수동 닫기만 */
  durationMs?: number;
  /** 동일 키는 짧은 시간 내 중복 enqueue를 억제한다 */
  dedupeKey?: string;
  action?: ToastActionSpec;
}

export interface ToastItem {
  id: string;
  variant: ToastVariant;
  title: string;
  message?: string;
  durationMs: number;
  dedupeKey?: string;
  action?: ToastActionSpec;
}
