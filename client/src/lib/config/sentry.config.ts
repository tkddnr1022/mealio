/**
 * Sentry SDK 초기화 옵션 (env 파생).
 *
 * `instrumentation-client.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`의
 * 단일 진입점. DSN·샘플링은 {@link env}에서만 읽는다.
 */
import { env } from '@/lib/config/env';

export function isSentryEnabled(): boolean {
  return env.sentryEnabled;
}

export function getSentryTracesSampleRate(): number {
  return env.sentryTracesSampleRate;
}

export function getSentryInitOptions(serviceTag: string): {
  dsn: string;
  environment: string;
  tracesSampleRate: number;
  initialScope: { tags: { service: string } };
} {
  return {
    dsn: env.sentryDsn,
    environment: env.runtime,
    tracesSampleRate: env.sentryTracesSampleRate,
    initialScope: {
      tags: { service: serviceTag },
    },
  };
}
