import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  envValidationOptions,
  envValidationSchema,
} from './config/env.validation';
import { MongooseSchemasModule, PrismaModule } from '@mealio/shared';
import { mongooseConnectionPoolConfig } from './policy/mongoose-pool.policy';
import { prismaConnectionPoolConfig } from './policy/prisma-pool.policy';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RecipesModule } from './modules/recipes/recipes.module';
import { HealthModule } from './modules/health/health.module';
import { IngredientsModule } from './modules/ingredients/ingredients.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { ChatbotModule } from './modules/chatbot/chatbot.module';
import { KafkaModule } from './infrastructure/kafka/kafka.module';
import { CacheModule } from './infrastructure/cache/cache.module';
import { CorrelationIdMiddleware } from './modules/middleware/correlation-id.middleware';
import { LoggingMiddleware } from './modules/middleware/logging.middleware';
import { RateLimitMiddleware } from './modules/middleware/rate-limit.middleware';
import { MonitoringModule } from './optimization/monitoring/monitoring.module';
import { SentryModule } from './optimization/monitoring/sentry.module';
import { HttpMetricsMiddleware } from './optimization/monitoring/http-metrics.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
      validationOptions: envValidationOptions,
    }),
    PrismaModule.forRoot(prismaConnectionPoolConfig),
    MongooseSchemasModule.forRoot(mongooseConnectionPoolConfig),
    KafkaModule,
    CacheModule,
    AuthModule,
    HealthModule,
    UsersModule,
    RecipesModule,
    IngredientsModule,
    InventoryModule,
    ChatbotModule,
    MonitoringModule,
    SentryModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(
        CorrelationIdMiddleware,
        HttpMetricsMiddleware,
        LoggingMiddleware,
        RateLimitMiddleware,
      )
      .forRoutes('*');
  }
}
