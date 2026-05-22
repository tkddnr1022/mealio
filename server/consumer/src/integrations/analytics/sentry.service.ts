import { Injectable } from '@nestjs/common';
import {
  captureSentryException,
  captureSentryMessage,
  createObservabilityConfig,
  inferFeatureFromKafkaTopic,
  type SentryCaptureContext,
} from '@mealio/shared';

@Injectable()
export class SentryService {
  private readonly observability = createObservabilityConfig('consumer', {
    requireMetricsPort: true,
  });

  isEnabled(): boolean {
    return Boolean(this.observability.sentryDsn);
  }

  captureException(
    error: unknown,
    context: SentryCaptureContext & { topic?: string },
  ): string | undefined {
    const feature = context.topic
      ? inferFeatureFromKafkaTopic(context.topic)
      : 'consumer';
    const eventId = captureSentryException(error, 'consumer', {
      ...context,
      feature,
    });
    return eventId;
  }

  captureMessage(
    message: string,
    level: 'warning' | 'error',
    context?: SentryCaptureContext,
  ): string | undefined {
    return captureSentryMessage(message, level, 'consumer', context);
  }
}
