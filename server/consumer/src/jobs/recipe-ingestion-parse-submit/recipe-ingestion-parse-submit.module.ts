import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  createObservabilityConfig,
  MongooseSchemasModule,
  PrismaModule,
  RedisModule,
} from '@mealio/shared';
import {
  envValidationOptions,
  envValidationSchema,
} from '../../config/env.validation';
import { mongooseConnectionPoolConfig } from '../../policy/mongoose-pool.policy';
import { prismaConnectionPoolConfig } from '../../policy/prisma-pool.policy';
import { OpenAIModule } from '../../integrations/openai/openai.module';
import { RecipeIngestionJobRepository } from '../../persistence/repositories/mongodb/recipe-ingestion-job.repository';
import {
  ConsumerMetricsService,
  OBSERVABILITY_CONFIG,
} from '../../reliability/monitoring/consumer-metrics.service';
import { RecipeCategoryRepository } from '../../persistence/repositories/postgresql/recipe-category.repository';
import { IngredientCategoryRepository } from '../../persistence/repositories/postgresql/ingredient-category.repository';
import { CategoryContextService } from './services/category-context.service';
import { ParseSubmitService } from './services/parse-submit.service';

/**
 * Recipe ingestion parse-submit standalone job 모듈.
 * Consumer 앱 전체를 띄우지 않고 OpenAI Batch 제출만 구동한다.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
      validationOptions: envValidationOptions,
      envFilePath: [
        `.env.${process.env.APP_ENV}.local`,
        '.env.local',
        `.env.${process.env.APP_ENV}`,
        '.env',
      ],
    }),
    MongooseSchemasModule.forRoot(mongooseConnectionPoolConfig),
    PrismaModule.forRoot(prismaConnectionPoolConfig),
    RedisModule,
    OpenAIModule,
  ],
  providers: [
    {
      provide: OBSERVABILITY_CONFIG,
      useFactory: () => createObservabilityConfig('consumer'),
    },
    ConsumerMetricsService,
    RecipeIngestionJobRepository,
    RecipeCategoryRepository,
    IngredientCategoryRepository,
    CategoryContextService,
    ParseSubmitService,
  ],
  exports: [ParseSubmitService],
})
export class RecipeIngestionParseSubmitModule {}
