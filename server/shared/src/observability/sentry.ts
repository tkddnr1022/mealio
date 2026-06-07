import * as Sentry from '@sentry/node';
import type { NodeOptions } from '@sentry/node';
import type { ObservabilityConfig } from '../config/observability.config';
import { getSentryInitOptions } from '../config/sentry.config';
import {
  SENTRY_TAG_CONSUMER_GROUP,
  SENTRY_TAG_CORRELATION_ID,
  SENTRY_TAG_FEATURE,
  SENTRY_TAG_OFFSET,
  SENTRY_TAG_PARTITION,
  SENTRY_TAG_SERVICE,
  SENTRY_TAG_TOPIC,
  type SentryFeatureTag,
  type SentryServiceTag,
} from '../constants/sentry.constants';
import { scrubObject, scrubSentryEvent } from './sentry-scrub';

let initialized = false;

export interface SentryCaptureContext {
  correlationId?: string;
  feature?: SentryFeatureTag;
  topic?: string;
  consumerGroup?: string;
  partition?: number;
  offset?: string;
  extra?: Record<string, unknown>;
}

export interface InitSentryOptions {
  config: ObservabilityConfig;
  /** @sentry/node integrations (HTTP 등). 미지정 시 SDK 기본값 */
  integrations?: NodeOptions['integrations'];
}

/**
 * Sentry SDK를 초기화한다. DSN이 없으면 no-op.
 * 중복 호출은 무시한다(싱글톤).
 */
export function initSentry(options: InitSentryOptions): boolean {
  if (initialized) return Boolean(options.config.sentryDsn);
  const { config } = options;
  if (!config.sentryDsn) {
    return false;
  }

  Sentry.init({
    ...getSentryInitOptions(config.serviceName, config.sentryDsn),
    beforeSend(event) {
      return scrubSentryEvent(event);
    },
    integrations: options.integrations,
  });

  Sentry.setTag(SENTRY_TAG_SERVICE, config.serviceName);
  initialized = true;
  return true;
}

export function isSentryInitialized(): boolean {
  return initialized && Boolean(Sentry.getClient());
}

function applyCaptureScope(
  scope: Sentry.Scope,
  service: SentryServiceTag,
  context?: SentryCaptureContext,
): void {
  scope.setTag(SENTRY_TAG_SERVICE, service);
  if (context?.correlationId) {
    scope.setTag(SENTRY_TAG_CORRELATION_ID, context.correlationId);
  }
  if (context?.feature) {
    scope.setTag(SENTRY_TAG_FEATURE, context.feature);
  }
  if (context?.topic) {
    scope.setTag(SENTRY_TAG_TOPIC, context.topic);
  }
  if (context?.consumerGroup) {
    scope.setTag(SENTRY_TAG_CONSUMER_GROUP, context.consumerGroup);
  }
  if (context?.partition !== undefined) {
    scope.setTag(SENTRY_TAG_PARTITION, String(context.partition));
  }
  if (context?.offset) {
    scope.setTag(SENTRY_TAG_OFFSET, context.offset);
  }
  if (context?.extra) {
    scope.setContext(
      'extra',
      scrubObject(context.extra) as Record<string, unknown>,
    );
  }
}

/**
 * 예외를 Sentry에 보고한다. 초기화되지 않았으면 no-op.
 */
export function captureSentryException(
  error: unknown,
  service: SentryServiceTag,
  context?: SentryCaptureContext,
): string | undefined {
  if (!isSentryInitialized()) return undefined;

  return Sentry.withScope((scope) => {
    applyCaptureScope(scope, service, context);
    return Sentry.captureException(error);
  });
}

/**
 * 메시지를 Sentry에 보고한다(warn/error 로그 싱크 등).
 */
export function captureSentryMessage(
  message: string,
  level: Sentry.SeverityLevel,
  service: SentryServiceTag,
  context?: SentryCaptureContext,
): string | undefined {
  if (!isSentryInitialized()) return undefined;

  return Sentry.withScope((scope) => {
    applyCaptureScope(scope, service, context);
    scope.setLevel(level);
    return Sentry.captureMessage(message);
  });
}

/** 테스트·graceful shutdown용 */
export async function closeSentry(timeoutMs = 2000): Promise<void> {
  if (!isSentryInitialized()) return;
  await Sentry.close(timeoutMs);
  initialized = false;
}
