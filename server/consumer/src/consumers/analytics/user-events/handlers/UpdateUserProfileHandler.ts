import { Injectable } from '@nestjs/common';
import { isUserNicknameUpdateEvent, type UserEvent } from '@cook/shared';
import { UserRepository } from 'src/persistence/repositories/postgresql/user.repository';
import { CacheInvalidationRequestService } from 'src/consumers/cache-invalidation/cache-invalidation-request.service';

/**
 * 유저 이벤트 수신 시 사용자 프로필 업데이트 (Prisma User)
 * - NICKNAME_UPDATE: User.nickname 갱신
 *
 * 캐시 무효화: DB 반영 후 Producer의 유저 프로필 캐시를 무효화하기 위해
 * CacheInvalidationRequestService에 요청만 한다. Handler는 토픽을 직접 발행하지 않으며,
 * 실제 Redis 삭제는 cache-invalidation 토픽을 구독하는 쪽에서 수행한다.
 */
@Injectable()
export class UpdateUserProfileHandler {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly cacheInvalidationRequestService: CacheInvalidationRequestService,
  ) {}

  async execute(event: UserEvent): Promise<void> {
    if (!isUserNicknameUpdateEvent(event)) {
      return;
    }
    await this.userRepository.updateNickname(event.userId, event.nickname);

    // Producer의 user 프로필 캐시 무효화 요청 (발행은 서비스 레이어에서 수행)
    await this.cacheInvalidationRequestService.requestUserProfileInvalidation(
      event.userId,
    );
  }
}
