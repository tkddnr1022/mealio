import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseSchemasModule } from '@mealio/shared';
import {
  envValidationOptions,
  envValidationSchema,
} from '../../config/env.validation';
import { mongooseConnectionPoolConfig } from '../../config/mongoose-pool.config';
import { OpenAIModule } from '../../integrations/openai/openai.module';
import { KafkaModule } from '../../integrations/kafka/kafka.module';
import { RecipeIngestionJobRepository } from '../../persistence/repositories/mongodb/recipe-ingestion-job.repository';
import { RetrieveService } from './services/retrieve.service';

/**
 * Recipe ingestion retrieve standalone job 모듈.
 * Consumer 앱 전체를 띄우지 않고 OpenAI Batch 결과 조회·Kafka emit만 구동한다.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
      validationOptions: envValidationOptions,
    }),
    MongooseSchemasModule.forRoot(mongooseConnectionPoolConfig),
    OpenAIModule,
    KafkaModule,
  ],
  providers: [RecipeIngestionJobRepository, RetrieveService],
})
export class RecipeIngestionRetrieveModule {}
