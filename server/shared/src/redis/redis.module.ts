import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service';

/**
 * Redis 모듈 (Producer/Consumer 공용)
 */
@Global()
@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
