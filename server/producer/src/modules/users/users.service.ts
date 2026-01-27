import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRepository } from '../../infrastructure/database/repositories/postgresql/user.repository';
import { UserProfileDto } from './dto/user-profile.dto';
import { UpdateNicknameDto } from './dto/update-nickname.dto';
import { KafkaProducerService } from '../../infrastructure/kafka/producer.service';
import { KAFKA_TOPICS } from '../../shared/constants/kafka-topics';
import {
  UserEventType,
  UserNicknameUpdateEvent,
} from '../../shared/types/events';

@Injectable()
export class UsersService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly kafkaProducerService: KafkaProducerService,
  ) {}

  async getProfile(userId: number): Promise<UserProfileDto> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      createdAt: user.createdAt,
    };
  }

  async updateNickname(
    userId: number,
    updateNicknameDto: UpdateNicknameDto,
  ): Promise<{ id: number; nickname: string }> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Command 작업은 이벤트를 통해 consumer 서버에서 처리됨
    // DB 업데이트 대신 이벤트 발급
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
