import { Injectable } from '@nestjs/common';
import type { ChatbotRequestEvent } from '@cook/shared';
import type { ProcessChatResult } from './process-chat.handler';

/**
 * 대화 컨텍스트 갱신용 핸들러
 *
 * 1페이즈에서는 별도 상태 저장 없이 No-Op로 두고,
 * 추후 사용자 선호도/히스토리 집계 시 확장한다.
 */
@Injectable()
export class UpdateContextHandler {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async execute(
    _event: ChatbotRequestEvent,
    _processed: ProcessChatResult,
  ): Promise<void> {
    // No-Op (향후 구현)
  }
}
