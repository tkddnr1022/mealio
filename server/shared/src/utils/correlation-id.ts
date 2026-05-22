import { randomUUID } from 'crypto';
import type { IHeaders } from 'kafkajs';
import { CORRELATION_ID_HEADER } from '../configs/observability.config';

export { CORRELATION_ID_HEADER };

/**
 * 하이픈 없는 UUID 형식 Correlation ID 생성
 */
export function generateCorrelationId(): string {
  return randomUUID().replace(/-/g, '');
}

/**
 * Kafka 메시지 헤더에서 Correlation ID 추출
 */
export function extractCorrelationIdFromKafkaHeaders(
  headers?: IHeaders,
): string | undefined {
  if (!headers) {
    return undefined;
  }

  const raw =
    headers[CORRELATION_ID_HEADER] ??
    headers['X-Correlation-Id'] ??
    headers['x-correlation-id'];

  if (raw === undefined || raw === null) {
    return undefined;
  }

  if (Buffer.isBuffer(raw)) {
    const value = raw.toString('utf8').trim();
    return value.length > 0 ? value : undefined;
  }

  if (Array.isArray(raw)) {
    const first = raw[0];
    if (first === undefined || first === null) {
      return undefined;
    }
    const value = Buffer.isBuffer(first)
      ? first.toString('utf8').trim()
      : String(first).trim();
    return value.length > 0 ? value : undefined;
  }

  const value = String(raw).trim();
  return value.length > 0 ? value : undefined;
}
