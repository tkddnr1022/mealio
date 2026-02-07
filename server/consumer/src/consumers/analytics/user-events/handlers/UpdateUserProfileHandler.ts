import { Injectable } from '@nestjs/common';
import { isUserNicknameUpdateEvent, type UserEvent } from '@cook/shared';
import { UserRepository } from 'src/persistence/repositories/postgresql/user.repository';

/**
 * 유저 이벤트 수신 시 사용자 프로필 업데이트 (Prisma User)
 * - NICKNAME_UPDATE: User.nickname 갱신
 */
@Injectable()
export class UpdateUserProfileHandler {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(event: UserEvent): Promise<void> {
    if (!isUserNicknameUpdateEvent(event)) {
      return;
    }
    await this.userRepository.updateNickname(event.userId, event.nickname);
  }
}
