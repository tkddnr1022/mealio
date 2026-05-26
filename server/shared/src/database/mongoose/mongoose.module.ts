import { DynamicModule, Global, Module } from '@nestjs/common';
import { MongooseModule, type MongooseModuleOptions } from '@nestjs/mongoose';
import type { MongoosePoolConfig } from './mongoose-pool.config';
import {
  ChatbotConversation,
  ChatbotConversationSchema,
  ChatbotLog,
  ChatbotLogSchema,
  EventLog,
  EventLogSchema,
  Inventory,
  InventorySchema,
  KpiRollup,
  KpiRollupSchema,
} from './schemas';

/** shared에서 공용으로 관리하는 옵션 (URL 제외) */
const SHARED_MONGOOSE_OPTIONS: Partial<MongooseModuleOptions> = {
  retryWrites: true,
  retryReads: true,
  readPreference: 'secondaryPreferred',
  w: 1,
  journal: true,
};

export interface MongooseModuleAsyncOptions {
  useFactory: (
    ...args: unknown[]
  ) => MongoosePoolConfig | Promise<MongoosePoolConfig>;
  inject?: import('@nestjs/common').InjectionToken[];
}

/**
 * Mongoose 모듈 (Producer/Consumer 공용)
 * - URI, retry, readPreference 등은 shared에서 공용 관리
 * - 앱에서는 forRoot / forRootAsync 로 커넥션 풀 config만 주입
 */
@Module({})
export class MongooseSchemasModule {
  /**
   * 커넥션 풀 설정을 직접 전달하여 등록
   */
  static forRoot(poolConfig: MongoosePoolConfig): DynamicModule {
    const options: MongooseModuleOptions = {
      uri: process.env.MONGODB_URL!,
      ...SHARED_MONGOOSE_OPTIONS,
      ...poolConfig,
    };
    return {
      module: MongooseSchemasModule,
      global: true,
      imports: [
        MongooseModule.forRootAsync({ useFactory: () => options }),
        MongooseModule.forFeature([
          { name: EventLog.name, schema: EventLogSchema },
          { name: ChatbotLog.name, schema: ChatbotLogSchema },
          {
            name: ChatbotConversation.name,
            schema: ChatbotConversationSchema,
          },
          { name: Inventory.name, schema: InventorySchema },
          { name: KpiRollup.name, schema: KpiRollupSchema },
        ]),
      ],
      exports: [MongooseModule],
    };
  }

  /**
   * 비동기 팩토리로 커넥션 풀 설정 주입
   */
  static forRootAsync(options: MongooseModuleAsyncOptions): DynamicModule {
    return {
      module: MongooseSchemasModule,
      global: true,
      imports: [
        MongooseModule.forRootAsync({
          useFactory: async (...args: unknown[]) => {
            const poolConfig = await options.useFactory(...args);
            return {
              uri: process.env.MONGODB_URL!,
              ...SHARED_MONGOOSE_OPTIONS,
              ...poolConfig,
            };
          },
          inject: options.inject ?? [],
        }),
        MongooseModule.forFeature([
          { name: EventLog.name, schema: EventLogSchema },
          { name: ChatbotLog.name, schema: ChatbotLogSchema },
          {
            name: ChatbotConversation.name,
            schema: ChatbotConversationSchema,
          },
          { name: Inventory.name, schema: InventorySchema },
          { name: KpiRollup.name, schema: KpiRollupSchema },
        ]),
      ],
      exports: [MongooseModule],
    };
  }
}
