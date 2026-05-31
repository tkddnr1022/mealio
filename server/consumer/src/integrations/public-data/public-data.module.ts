import { Module } from '@nestjs/common';
import { PublicDataApiClient } from './public-data-api.client';

/**
 * 식품의약품안전처 공공데이터 Open API 연동 모듈
 */
@Module({
  providers: [PublicDataApiClient],
  exports: [PublicDataApiClient],
})
export class PublicDataModule {}
