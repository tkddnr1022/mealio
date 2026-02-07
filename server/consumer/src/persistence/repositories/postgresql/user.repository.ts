import { Injectable } from '@nestjs/common';
import { PrismaService } from '@cook/shared';

/**
 * Consumer 전용 User 리포지토리 — 유저 이벤트 처리 시 프로필 업데이트(Prisma)
 */
@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async updateNickname(userId: number, nickname: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { nickname },
    });
  }
}
