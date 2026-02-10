import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import {
  envValidationOptions,
  envValidationSchema,
} from './config/env.validation';
import { PrismaModule } from '@cook/shared';
import { MongooseSchemasModule } from './infrastructure/database/mongoose/mongoose.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RecipesModule } from './modules/recipes/recipes.module';
import { HealthModule } from './modules/health/health.module';
import { IngredientsModule } from './modules/ingredients/ingredients.module';
import { UserIngredientsModule } from './modules/user-ingredients/user-ingredients.module';
import { ChatbotModule } from './modules/chatbot/chatbot.module';
import { KafkaModule } from './infrastructure/kafka/kafka.module';
import { CacheModule } from './infrastructure/cache/cache.module';
import { CorrelationIdMiddleware } from './modules/middleware/correlation-id.middleware';
import { LoggingMiddleware } from './modules/middleware/logging.middleware';
import { RateLimitMiddleware } from './modules/middleware/rate-limit.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
      validationOptions: envValidationOptions,
    }),
    PrismaModule,
    MongooseSchemasModule,
    KafkaModule,
    CacheModule,
    AuthModule,
    HealthModule,
    UsersModule,
    RecipesModule,
    IngredientsModule,
    UserIngredientsModule,
    ChatbotModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(CorrelationIdMiddleware, LoggingMiddleware, RateLimitMiddleware)
      .forRoutes('*');
  }
}
