import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseSchemasModule } from '@mealio/shared';
import {
  envValidationOptions,
  envValidationSchema,
} from '../../config/env.validation';
import { mongooseConnectionPoolConfig } from '../../config/mongoose-pool.config';
import { PublicDataModule } from '../../integrations/public-data/public-data.module';
import { RecipeIngestionJobRepository } from '../../persistence/repositories/mongodb/recipe-ingestion-job.repository';
import { RecipeIngestionStateRepository } from '../../persistence/repositories/mongodb/recipe-ingestion-state.repository';
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
    }),
    MongooseSchemasModule.forRoot(mongooseConnectionPoolConfig),
    PublicDataModule,
  ],
  providers: [
    RecipeIngestionJobRepository,
    RecipeIngestionStateRepository,
    FetchService,
  ],
})
export class RecipeIngestionFetchModule {}
