import { Injectable } from '@nestjs/common';
import {
  captureSentryException,
  captureSentryMessage,
  createObservabilityConfig,
  getCorrelationId,
  inferFeatureFromHttpPath,
  type SentryCaptureContext,
} from '@mealio/shared';

@Injectable()
export class SentryService {
  private readonly observability = createObservabilityConfig('producer', {
    requireMetricsPort: false,
  });

  isEnabled(): boolean {
    return Boolean(this.observability.sentryDsn);
  }

  captureException(
    error: unknown,
    context?: Omit<SentryCaptureContext, 'feature'> & { path?: string },
  ): string | undefined {
    const feature = context?.path
      ? inferFeatureFromHttpPath(context.path)
      : undefined;
    return captureSentryException(error, 'producer', {
      correlationId: context?.correlationId ?? getCorrelationId(),
      feature,
      extra: context?.extra,
    });
  }

  captureMessage(
    message: string,
    level: 'warning' | 'error',
    context?: SentryCaptureContext,
  ): string | undefined {
    return captureSentryMessage(message, level, 'producer', {
      correlationId: context?.correlationId ?? getCorrelationId(),
      ...context,
    });
  }
}
