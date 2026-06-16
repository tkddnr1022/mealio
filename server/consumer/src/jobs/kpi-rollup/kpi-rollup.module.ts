import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseSchemasModule } from '@mealio/shared';
import {
  envValidationOptions,
  envValidationSchema,
} from '../../config/env.validation';
import { mongooseConnectionPoolConfig } from '../../policy/mongoose-pool.policy';
import { KpiRollupService } from './kpi-rollup.service';

/**
 * KPI 롤업 배치 전용 모듈.
 * Consumer 앱 전체를 띄우지 않고 MongoDB 연결 + 집계 서비스만 구동한다.
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
  ],
  providers: [KpiRollupService],
})
export class KpiRollupModule {}
