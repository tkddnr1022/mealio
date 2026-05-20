import { Injectable } from '@nestjs/common';
import { PrismaService } from '@mealio/shared';
import { AuthRefreshSession, Prisma } from '@mealio/shared/prisma-client';

@Injectable()
export class AuthRefreshSessionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: Prisma.AuthRefreshSessionCreateInput,
  ): Promise<AuthRefreshSession> {
    return this.prisma.authRefreshSession.create({ data });
  }

  async findById(id: string): Promise<AuthRefreshSession | null> {
    return this.prisma.authRefreshSession.findUnique({ where: { id } });
  }

  async findActiveSessionIdsByUserId(userId: number): Promise<string[]> {
    const sessions = await this.prisma.authRefreshSession.findMany({
      where: {
        userId,
        revokedAt: null,
      },
      select: { id: true },
    });
    return sessions.map((session) => session.id);
  }

  async touchLastUsed(id: string, usedAt: Date): Promise<void> {
    await this.prisma.authRefreshSession.update({
      where: { id },
      data: { lastUsedAt: usedAt },
    });
  }

  async replaceAndRevoke(params: {
    oldSessionId: string;
    newSession: Prisma.AuthRefreshSessionCreateInput;
    revokedAt: Date;
  }): Promise<AuthRefreshSession> {
    return this.prisma.$transaction(async (tx) => {
      const created = await tx.authRefreshSession.create({
        data: params.newSession,
      });
      await tx.authRefreshSession.update({
        where: { id: params.oldSessionId },
        data: {
          revokedAt: params.revokedAt,
          replacedBySessionId: created.id,
          lastUsedAt: params.revokedAt,
        },
      });
      return created;
    });
  }

  async revokeById(id: string, revokedAt: Date): Promise<void> {
    await this.prisma.authRefreshSession.update({
      where: { id },
      data: {
        revokedAt,
        lastUsedAt: revokedAt,
      },
    });
  }

  async revokeByUserId(userId: number, revokedAt: Date): Promise<void> {
    await this.prisma.authRefreshSession.updateMany({
      where: { userId, revokedAt: null },
      data: {
        revokedAt,
      },
    });
  }
}
