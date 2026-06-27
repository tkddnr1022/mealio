import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  createObservabilityConfig,
  MongooseSchemasModule,
} from '@mealio/shared';
import {
  envValidationOptions,
  envValidationSchema,
} from '../../config/env.validation';
import { mongooseConnectionPoolConfig } from '../../policy/mongoose-pool.policy';
import { OpenAIModule } from '../../integrations/openai/openai.module';
import { KafkaModule } from '../../integrations/kafka/kafka.module';
import { RecipeIngestionJobRepository } from '../../persistence/repositories/mongodb/recipe-ingestion-job.repository';
import {
  ConsumerMetricsService,
  OBSERVABILITY_CONFIG,
} from '../../reliability/monitoring/consumer-metrics.service';
import { ParseRetrieveService } from './services/parse-retrieve.service';

/**
 * Recipe ingestion parse-retrieve standalone job 모듈.
 * Consumer 앱 전체를 띄우지 않고 OpenAI Batch 결과 조회·Kafka emit만 구동한다.
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
    OpenAIModule,
    KafkaModule,
  ],
  providers: [
    {
      provide: OBSERVABILITY_CONFIG,
      useFactory: () => createObservabilityConfig('consumer'),
    },
    ConsumerMetricsService,
    RecipeIngestionJobRepository,
    ParseRetrieveService,
  ],
})
export class RecipeIngestionParseRetrieveModule {}
