import * as Sentry from '@sentry/nextjs';

const REDACTED = '[Filtered]';

function getClientSampleRate(): number {
  const raw = process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE;
  if (!raw) return process.env.NODE_ENV === 'production' ? 0.1 : 1;
  const parsed = parseFloat(raw);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1) return 0.1;
  return parsed;
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || '',
  environment: process.env.NODE_ENV ?? 'development',
  tracesSampleRate: getClientSampleRate(),

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

  initialScope: {
    tags: { service: 'client' },
  },
});
