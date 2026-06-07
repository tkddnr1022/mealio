import { Injectable } from '@nestjs/common';
import {
  captureSentryException,
  captureSentryMessage,
  getCorrelationId,
  inferFeatureFromHttpPath,
  type SentryCaptureContext,
} from '@mealio/shared';

@Injectable()
export class SentryService {
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
