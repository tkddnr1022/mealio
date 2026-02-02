import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap(): Promise<void> {
  const logger = new Logger('ConsumerBootstrap');

  // HTTP 서버 없이 DI 컨테이너만 구동하는 워커 모드
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'error', 'warn'],
  });

  logger.log('Consumer application context initialized');

  // 종료 시그널 처리
  const shutdown = async () => {
    logger.log('Shutting down consumer application...');
    await app.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

void bootstrap();

