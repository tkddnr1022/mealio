import * as Sentry from '@sentry/nextjs';

import { getSentryInitOptions } from './src/lib/config/sentry.config';

Sentry.init(getSentryInitOptions('client-edge', 'edge'));
