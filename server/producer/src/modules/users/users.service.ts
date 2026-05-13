import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRepository } from '../../infrastructure/database/repositories/postgresql/user.repository';
import { UserProfileDto } from './dto/user-profile.dto';
import { UpdateNicknameDto } from './dto/update-nickname.dto';
import { KafkaProducerService } from '../../infrastructure/kafka/producer.service';
import { KAFKA_TOPICS } from '@cook/shared';
import { UserEventType, UserNicknameUpdateEvent } from '@cook/shared';
import { CacheService } from '../../infrastructure/cache/cache.service';
import { UserCacheStrategy } from '../../infrastructure/cache/strategies/user-cache-strategy';

@Injectable()
export class UsersService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly kafkaProducerService: KafkaProducerService,
    private readonly cacheService: CacheService,
    private readonly userCacheStrategy: UserCacheStrategy,
  ) {}

  async getProfile(userId: number): Promise<UserProfileDto> {
    // Cache-Aside 패턴: 캐시 조회 → DB 폴백 → 캐시 저장
    const profile = await this.cacheService.getOrSet<UserProfileDto>(
      this.userCacheStrategy,
      async () => {
        const user = await this.userRepository.findById(userId);

        if (!user) {
          throw new NotFoundException('User not found');
        }

        return {
          id: user.id,
          email: user.email,
          nickname: user.nickname,
          createdAt: user.createdAt,
          creditBalance: user.creditBalance,
          creditMonthlyLimit: user.creditMonthlyLimit,
        };
      },
      userId,
    );

    return profile;
  }

  async updateNickname(
    userId: number,
    updateNicknameDto: UpdateNicknameDto,
  ): Promise<{ id: number; nickname: string }> {
    // DB에서 사용자 조회 (캐시는 읽기 전용이므로 쓰기 작업에서는 항상 DB 조회)
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Command 작업은 이벤트를 통해 consumer 서버에서 처리됨
    // Consumer에서 DB 업데이트 후 cache-invalidation 컨슈머가 캐시 무효화를 처리함
    const event: UserNicknameUpdateEvent = {
      type: UserEventType.NICKNAME_UPDATE,
      userId,
      nickname: updateNicknameDto.nickname,
      previousNickname: user.nickname,
      timestamp: new Date().toISOString(),
    };
    await this.kafkaProducerService.emit(KAFKA_TOPICS.USER_EVENTS, event);

    // Optimistic response 반환
    return {
      id: user.id,
      nickname: updateNicknameDto.nickname,
    };
  }
}
