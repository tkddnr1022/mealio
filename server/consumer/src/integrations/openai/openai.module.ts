import { Module } from '@nestjs/common';
import { OpenAIService } from './openai.service';
import { OpenAIBatchService } from './openai-batch.service';
import { OpenAIRateLimiter } from './rate-limiter';
import { DEFAULT_OPENAI_RATE_LIMIT_RPM } from '../../policy/openai.policy';

/**
 * OpenAI 연동 모듈.
 * - OpenAIService: Responses API 래퍼 (비스트리밍/스트리밍, tools 지원)
 * - OpenAIBatchService: Batch Files·Batches API (recipe ingestion parse-submit)
 * - OpenAIRateLimiter: 분당 호출 제한 (선택 사용)
 * response-parser는 순수 함수이므로 모듈에서 제공하지 않고 import하여 사용.
 */
@Module({
  providers: [
    {
      provide: OpenAIRateLimiter,
      useFactory: () => new OpenAIRateLimiter(DEFAULT_OPENAI_RATE_LIMIT_RPM),
    },
    OpenAIService,
    OpenAIBatchService,
  ],
  exports: [OpenAIService, OpenAIBatchService, OpenAIRateLimiter],
})
export class OpenAIModule {}
