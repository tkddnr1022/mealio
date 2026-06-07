import { Injectable } from '@nestjs/common';
import {
  captureSentryException,
  captureSentryMessage,
  inferFeatureFromKafkaTopic,
  type SentryCaptureContext,
} from '@mealio/shared';

@Injectable()
export class SentryService {
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
