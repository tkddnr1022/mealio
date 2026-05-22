import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { createObservabilityConfig } from '@mealio/shared';
import { AppModule } from './app.module';
import { createSwaggerConfig } from './config/swagger.config';
import { AuthService } from './modules/auth/auth.service';
import { OAuthCallbackExceptionFilter } from './modules/auth/filters/oauth-callback-exception.filter';

async function bootstrap() {
  const observability = createObservabilityConfig('producer');

  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());

  const config = app.get(ConfigService);
  const httpAdapterHost = app.get(HttpAdapterHost);
  const authService = app.get(AuthService);
  const port = parseInt(config.getOrThrow<string>('PORT'), 10);

  const frontendAppBaseUrl = config.getOrThrow<string>('FRONTEND_APP_BASE_URL');
  const frontendOrigin = new URL(
    frontendAppBaseUrl.endsWith('/')
      ? frontendAppBaseUrl
      : `${frontendAppBaseUrl}/`,
  ).origin;

  app.enableCors({
    origin: frontendOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-Correlation-Id',
    ],
  });

  const swaggerConfig = createSwaggerConfig();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api-docs', app, document);

  app.useGlobalFilters(
    new OAuthCallbackExceptionFilter(httpAdapterHost, authService),
  );

  await app.listen(port);

  const logger = new Logger('Observability');
  logger.log(
    `service=${observability.serviceName} metricsEnabled=${observability.metricsEnabled} slowQueryThresholdMs=${observability.slowQueryThresholdMs}`,
  );
}
bootstrap();
