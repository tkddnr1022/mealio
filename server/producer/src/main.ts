import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { createSwaggerConfig } from './config/swagger.config';
import { AuthService } from './modules/auth/auth.service';
import { OAuthCallbackExceptionFilter } from './modules/auth/filters/oauth-callback-exception.filter';

async function bootstrap() {
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
}
bootstrap();
