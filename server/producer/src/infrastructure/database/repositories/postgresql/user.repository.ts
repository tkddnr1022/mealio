import { Injectable } from '@nestjs/common';
import { User, Prisma } from '../../prisma/generated/client';
import { PrismaService } from '../../prisma/prisma.service';

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

  // Command 메서드들은 producer 서버에서 제거
  // Command 작업은 이벤트를 통해 consumer 서버에서 처리됨
  // async create(data: Prisma.UserCreateInput): Promise<User> {
  //   return this.prisma.user.create({ data });
  // }

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
