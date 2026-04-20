/**
 * 클라이언트 로그 래퍼.
 *
 * - 개발(`env.isProduction === false`) 환경에서는 모든 레벨을 콘솔에 출력한다.
 * - 프로덕션에서는 기본적으로 `warn`·`error`만 출력하며, `debug`·`info`는 no-op.
 * - 외부 수집기(Sentry·Datadog 등) 연동은 {@link setLogSink}로 주입할 수 있다.
 * - 분산 추적을 위해 {@link ApiError}의 `correlationId` 같은 메타데이터를 같이 넘길 수 있다.
 */

import { env } from '@/lib/config/env';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  [key: string]: unknown;
}

export interface LogSink {
  (level: LogLevel, message: string, context?: LogContext): void;
}

const LEVEL_WEIGHT: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const DEFAULT_MIN_LEVEL: LogLevel = env.isProduction ? 'warn' : 'debug';

let minLevel: LogLevel = DEFAULT_MIN_LEVEL;
let sink: LogSink | null = null;

/**
 * 로그 최소 레벨을 변경한다. 기본값은 dev=`debug`, prod=`warn`.
 */
export function setLogLevel(level: LogLevel): void {
  minLevel = level;
}

/**
 * 외부 수집기 훅. 모든 로그가 이 싱크에도 전달된다.
 * `null`을 지정하면 싱크를 제거한다.
 */
export function setLogSink(next: LogSink | null): void {
  sink = next;
}

function shouldLog(level: LogLevel): boolean {
  return LEVEL_WEIGHT[level] >= LEVEL_WEIGHT[minLevel];
}

function emit(level: LogLevel, message: string, context?: LogContext): void {
  if (!shouldLog(level)) return;
  const args: unknown[] = context ? [message, context] : [message];
  switch (level) {
    case 'debug':
      console.debug(...args);
      break;
    case 'info':
      console.info(...args);
      break;
    case 'warn':
      console.warn(...args);
      break;
    case 'error':
      console.error(...args);
      break;
  }
  if (sink) {
    try {
      sink(level, message, context);
    } catch {
      // 싱크 실패가 앱 흐름을 막지 않도록 무시
    }
  }
}

export const logger = {
  debug(message: string, context?: LogContext): void {
    emit('debug', message, context);
  },
  info(message: string, context?: LogContext): void {
    emit('info', message, context);
  },
  warn(message: string, context?: LogContext): void {
    emit('warn', message, context);
  },
  error(message: string, context?: LogContext): void {
    emit('error', message, context);
  },
} as const;

export type Logger = typeof logger;
