import { Global, Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { HttpAdapterHost } from '@nestjs/core';
import { SentryService } from './sentry.service';
import { GlobalSentryExceptionFilter } from './global-exception.filter';

@Global()
@Module({
  providers: [
    SentryService,
    {
      provide: APP_FILTER,
      useFactory: (
        httpAdapterHost: HttpAdapterHost,
        sentryService: SentryService,
      ) => new GlobalSentryExceptionFilter(httpAdapterHost, sentryService),
      inject: [HttpAdapterHost, SentryService],
    },
  ],
  exports: [SentryService],
})
export class SentryModule {}
