import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  createObservabilityConfig,
  MongooseSchemasModule,
  PrismaModule,
} from '@mealio/shared';
import { OpenAIModule } from 'src/integrations/openai/openai.module';
import {
  envValidationOptions,
  envValidationSchema,
} from 'src/config/env.validation';
import { mongooseConnectionPoolConfig } from 'src/policy/mongoose-pool.policy';
import { prismaConnectionPoolConfig } from 'src/policy/prisma-pool.policy';
import { RecipeIngestionJobRepository } from 'src/persistence/repositories/mongodb/recipe-ingestion-job.repository';
import {
  ConsumerMetricsService,
  OBSERVABILITY_CONFIG,
} from 'src/reliability/monitoring/consumer-metrics.service';
import { RecipeEmbeddingRepository } from 'src/persistence/repositories/postgresql/recipe-embedding.repository';
import { EmbedRetrieveService } from './services/embed-retrieve.service';

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
    OpenAIModule,
  ],
  providers: [
    {
      provide: OBSERVABILITY_CONFIG,
      useFactory: () =>
        createObservabilityConfig('consumer', { requireMetricsPort: false }),
    },
    ConsumerMetricsService,
    RecipeIngestionJobRepository,
    RecipeEmbeddingRepository,
    EmbedRetrieveService,
  ],
  exports: [EmbedRetrieveService],
})
export class RecipeIngestionEmbedRetrieveModule {}
