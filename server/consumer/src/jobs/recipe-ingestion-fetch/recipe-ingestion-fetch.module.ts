import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { createObservabilityConfig } from '@mealio/shared';
import { MongooseSchemasModule } from '@mealio/shared';
import {
  envValidationOptions,
  envValidationSchema,
} from '../../config/env.validation';
import { mongooseConnectionPoolConfig } from '../../policy/mongoose-pool.policy';
import { PublicDataModule } from '../../integrations/public-data/public-data.module';
import { KafkaModule } from '../../integrations/kafka/kafka.module';
import { RecipeIngestionJobRepository } from '../../persistence/repositories/mongodb/recipe-ingestion-job.repository';
import { RecipeIngestionStateRepository } from '../../persistence/repositories/mongodb/recipe-ingestion-state.repository';
import {
  ConsumerMetricsService,
  OBSERVABILITY_CONFIG,
} from '../../reliability/monitoring/consumer-metrics.service';
import { FetchService } from './services/fetch.service';

/**
 * Recipe ingestion fetch standalone job 모듈.
 * Consumer 앱 전체를 띄우지 않고 공공데이터 수집만 구동한다.
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
    PublicDataModule,
    KafkaModule,
  ],
  providers: [
    {
      provide: OBSERVABILITY_CONFIG,
      useFactory: () =>
        createObservabilityConfig('consumer'),
    },
    ConsumerMetricsService,
    RecipeIngestionJobRepository,
    RecipeIngestionStateRepository,
    FetchService,
  ],
})
export class RecipeIngestionFetchModule {}
