import { Injectable, Logger } from '@nestjs/common';
import type { UserEvent } from '@mealio/shared';
import type { InventoryEvent } from '@mealio/shared';
import { CacheInvalidationRequestService } from 'src/consumers/cache-invalidation/cache-invalidation-request.service';
import { RecommendationScoreService } from '../services/recommendation-score.service';

export type UserEventPayload = UserEvent | InventoryEvent;

/**
 * 유저 이벤트 수신 시 추천 갱신 (선호도/협업 필터 등)
 * - 현재는 이벤트 수신만 로깅. 추후 preference.analyzer, collaborative-filter 연동 시 구현.
 */
@Injectable()
export class RecommendationHandler {
  private readonly logger = new Logger(RecommendationHandler.name);

  constructor(
    private readonly recommendationScoreService: RecommendationScoreService,
    private readonly cacheInvalidationRequestService: CacheInvalidationRequestService,
  ) {}

  async execute(event: UserEventPayload): Promise<void> {
    await this.recommendationScoreService.apply(event);
    await this.cacheInvalidationRequestService.requestRecommendationInvalidation(
      event.userId,
    );
    this.logger.debug(
      `Recommendation updated type=${event.type} userId=${event.userId}`,
    );
  }
}
