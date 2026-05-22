import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { createObservabilityConfig } from '@mealio/shared';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const BootstrapLogger = new Logger('ConsumerBootstrap');
  const ObservabilityLogger = new Logger('Observability');
  const observability = createObservabilityConfig('consumer', {
    requireMetricsPort: true,
  });

  // HTTP 서버 없이 DI 컨테이너만 구동하는 워커 모드
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'error', 'warn'],
  });

  BootstrapLogger.log('Consumer application context initialized');
  ObservabilityLogger.log(
    `service=${observability.serviceName} metricsEnabled=${observability.metricsEnabled} metricsPort=${observability.metricsPort} slowQueryThresholdMs=${observability.slowQueryThresholdMs}`,
  );

  // 종료 시그널 처리
  const shutdown = async () => {
    BootstrapLogger.log('Shutting down consumer application...');
    await app.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

void bootstrap();
