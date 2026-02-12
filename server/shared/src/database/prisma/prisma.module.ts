import { DynamicModule, Module } from '@nestjs/common';
import type { PrismaPoolConfig } from './prisma-pool.config';
import { PRISMA_POOL_CONFIG } from './prisma-pool.config';
import { PrismaService } from './prisma.service';

export interface PrismaModuleAsyncOptions {
  useFactory: (...args: unknown[]) => PrismaPoolConfig | Promise<PrismaPoolConfig>;
  inject?: import('@nestjs/common').InjectionToken[];
}

/**
 * Prisma 모듈 (Producer/Consumer 공용)
 * - connection pool config는 앱에서 forRoot / forRootAsync 로 주입한다.
 */
@Module({})
export class PrismaModule {
  /**
   * 커넥션 풀 설정을 직접 전달하여 등록
   */
  static forRoot(config: PrismaPoolConfig): DynamicModule {
    return {
      module: PrismaModule,
      global: true,
      providers: [
        { provide: PRISMA_POOL_CONFIG, useValue: config },
        PrismaService,
      ],
      exports: [PrismaService],
    };
  }

  /**
   * 비동기 팩토리로 커넥션 풀 설정 주입 (ConfigService 등 활용 시)
   */
  static forRootAsync(options: PrismaModuleAsyncOptions): DynamicModule {
    return {
      module: PrismaModule,
      global: true,
      providers: [
        {
          provide: PRISMA_POOL_CONFIG,
          useFactory: options.useFactory,
          inject: options.inject ?? [],
        },
        PrismaService,
      ],
      exports: [PrismaService],
    };
  }
}
