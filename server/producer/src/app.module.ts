import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import {
  envValidationOptions,
  envValidationSchema,
} from './config/env.validation';
import { PrismaModule } from './infrastructure/database/prisma/prisma.module';
import { MongooseSchemasModule } from './infrastructure/database/mongoose/mongoose.module';
import { UsersModule } from './modules/users/users.module';
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
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
