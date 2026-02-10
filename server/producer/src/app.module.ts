import { Module } from '@nestjs/common';
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
export class AppModule {}
