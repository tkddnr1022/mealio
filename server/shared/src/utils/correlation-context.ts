import { AsyncLocalStorage } from 'async_hooks';

interface CorrelationStore {
  correlationId: string;
}

const correlationStorage = new AsyncLocalStorage<CorrelationStore>();

/**
 * HTTP 요청 등 비동기 컨텍스트에서 Correlation ID를 보관·조회한다.
 */
export function runWithCorrelationId<T>(
  correlationId: string,
  fn: () => T,
): T {
  return correlationStorage.run({ correlationId }, fn);
}

export function getCorrelationId(): string | undefined {
  return correlationStorage.getStore()?.correlationId;
}
