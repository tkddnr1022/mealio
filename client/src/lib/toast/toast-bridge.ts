import type { ToastEnqueueInput } from './toast.types';

type EnqueueImpl = (input: ToastEnqueueInput) => string;

let enqueueImpl: EnqueueImpl | null = null;

/**
 * ToastProvider 마운트 시 등록한다. 언마운트 시 `null`로 해제한다.
 */
export function registerToastEnqueue(impl: EnqueueImpl | null): void {
  enqueueImpl = impl;
}

/**
 * Provider 트리 밖에서는 no-op에 가깝게 동작한다(반환 `null`).
 */
export function enqueueToast(input: ToastEnqueueInput): string | null {
  if (!enqueueImpl) return null;
  return enqueueImpl(input);
}
