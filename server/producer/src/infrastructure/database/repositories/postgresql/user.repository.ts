import { Injectable } from '@nestjs/common';
import { User, Prisma } from '@cook/shared/prisma-client';
import { PrismaService } from '@cook/shared';

@Injectable()
export class UserRepository {
  constructor(private prisma: PrismaService) {}

  async findById(id: number): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findByPlatform(
    platformName: string,
    platformId: string,
  ): Promise<User | null> {
    // Prisma does not support unique constraints on multiple columns, so we use findFirst
    return this.prisma.user.findFirst({ where: { platformName, platformId } });
  }

  /**
   * OAuth 로그인 시 사용자 생성용. 일반 Command는 consumer에서 이벤트로 처리하되,
   * 로그인 플로우는 producer에서 즉시 생성 후 JWT 발급이 필요해 여기서만 사용.
   */
  async create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({ data });
  }

  // async update(id: number, data: Prisma.UserUpdateInput): Promise<User> {
  //   return this.prisma.user.update({
  //     where: { id },
  //     data,
  //   });
  // }

  // async delete(id: number): Promise<User> {
  //   return this.prisma.user.delete({ where: { id } });
  // }
}
