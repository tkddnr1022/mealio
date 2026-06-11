import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import {
  createObservabilityConfig,
  httpIntegration,
  initSentry,
} from '@mealio/shared';
import { AppModule } from './app.module';
import { createSwaggerConfig } from './config/swagger.config';

async function bootstrap() {
  const observability = createObservabilityConfig('producer', {
    requireMetricsPort: false,
  });
  initSentry({
    config: observability,
    integrations: [httpIntegration()],
  });

  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());

  const config = app.get(ConfigService);
  const port = parseInt(config.getOrThrow<string>('PRODUCER_PORT'), 10);

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

  await app.listen(port);

  const logger = new Logger('Observability');
  logger.log(
    `service=${observability.serviceName} metricsEnabled=${observability.metricsEnabled} slowQueryThresholdMs=${observability.slowQueryThresholdMs}`,
  );
}
void bootstrap();
