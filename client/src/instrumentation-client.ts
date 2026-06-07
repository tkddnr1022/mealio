import * as Sentry from '@sentry/nextjs';

import { getSentryInitOptions } from '@/lib/config/sentry.config';

const REDACTED = '[Filtered]';

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

Sentry.init({
  ...getSentryInitOptions('client', 'client'),

  beforeSend(event) {
    if (event.request?.headers) {
      const headers = { ...event.request.headers };
      for (const key of Object.keys(headers)) {
        if (
          key.toLowerCase() === 'authorization' ||
          key.toLowerCase() === 'cookie'
        ) {
          headers[key] = REDACTED;
        }
      }
      event.request.headers = headers;
    }
    return event;
  },
});
