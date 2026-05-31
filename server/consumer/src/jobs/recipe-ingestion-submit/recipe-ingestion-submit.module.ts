import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  MongooseSchemasModule,
  PrismaModule,
  RedisModule,
} from '@mealio/shared';
import {
  envValidationOptions,
  envValidationSchema,
} from '../../config/env.validation';
import { mongooseConnectionPoolConfig } from '../../config/mongoose-pool.config';
import { prismaConnectionPoolConfig } from '../../config/prisma-pool.config';
import { OpenAIModule } from '../../integrations/openai/openai.module';
import { RecipeIngestionJobRepository } from '../../persistence/repositories/mongodb/recipe-ingestion-job.repository';
import { CategoryContextService } from './services/category-context.service';
import { SubmitService } from './services/submit.service';

/**
 * Recipe ingestion submit standalone job 모듈.
 * Consumer 앱 전체를 띄우지 않고 OpenAI Batch 제출만 구동한다.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
      validationOptions: envValidationOptions,
    }),
    MongooseSchemasModule.forRoot(mongooseConnectionPoolConfig),
    PrismaModule.forRoot(prismaConnectionPoolConfig),
    RedisModule,
    OpenAIModule,
  ],
  providers: [
    RecipeIngestionJobRepository,
    CategoryContextService,
    SubmitService,
  ],
})
export class RecipeIngestionSubmitModule {}
