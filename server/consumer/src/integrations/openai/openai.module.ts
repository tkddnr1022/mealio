import { Module } from '@nestjs/common';
import { OpenAIService } from './openai.service';
import { OpenAIRateLimiter, DEFAULT_RPM } from './rate-limiter';

/**
 * OpenAI 연동 모듈.
 * - OpenAIService: GPT API 래퍼 (비스트리밍/스트리밍, tools 지원)
 * - OpenAIRateLimiter: 분당 호출 제한 (선택 사용)
 * response-parser는 순수 함수이므로 모듈에서 제공하지 않고 import하여 사용.
 */
@Module({
  providers: [
    {
      provide: OpenAIRateLimiter,
      useFactory: () => new OpenAIRateLimiter(DEFAULT_RPM),
    },
    OpenAIService,
  ],
  exports: [OpenAIService, OpenAIRateLimiter],
})
export class OpenAIModule {}
