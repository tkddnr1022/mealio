import { Injectable, Logger } from '@nestjs/common';
import type { UserEvent } from '@cook/shared';
import type { InventoryEvent } from '@cook/shared';

export type UserEventPayload = UserEvent | InventoryEvent;

/**
 * 유저 이벤트 수신 시 추천 갱신 (선호도/협업 필터 등)
 * - 현재는 이벤트 수신만 로깅. 추후 preference.analyzer, collaborative-filter 연동 시 구현.
 */
@Injectable()
export class RecommendationHandler {
  private readonly logger = new Logger(RecommendationHandler.name);

  async execute(event: UserEventPayload): Promise<void> {
    this.logger.debug(
      `RecommendationHandler received event type=${event.type} userId=${event.userId}`,
    );
    // TODO: 선호도 분석·추천 캐시 갱신 연동 (processing/batch/user-analytics, recommendation)
  }
}
