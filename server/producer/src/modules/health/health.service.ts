import { Injectable } from '@nestjs/common';
import { PrismaService } from '@cook/shared';
import { InjectConnection } from '@nestjs/mongoose';
import type { Connection } from 'mongoose';

export type HealthStatus = 'ok' | 'degraded';

export interface LivenessResponse {
  status: HealthStatus;
  timestamp: string;
}

export interface ReadinessDetails {
  app: HealthStatus;
  postgres: HealthStatus | 'unknown';
  mongodb: HealthStatus | 'unknown';
}

export interface ReadinessResponse {
  status: HealthStatus;
  details: ReadinessDetails;
  timestamp: string;
}

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectConnection() private readonly mongoConnection: Connection,
  ) {}

  getLiveness(): LivenessResponse {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  async getReadiness(): Promise<ReadinessResponse> {
    const details: ReadinessDetails = {
      app: 'ok',
      postgres: 'unknown',
      mongodb: 'unknown',
    };

    try {
      // 간단한 SELECT 1 쿼리로 PostgreSQL 연결 상태 확인
      await this.prisma.$queryRaw`SELECT 1`;
      details.postgres = 'ok';
    } catch {
      details.postgres = 'degraded';
    }

    try {
      await this.mongoConnection.db?.admin().ping();
      details.mongodb = 'ok';
    } catch {
      details.mongodb = 'degraded';
    }

    const status: HealthStatus =
      details.postgres === 'ok' && details.mongodb === 'ok' ? 'ok' : 'degraded';

    return {
      status,
      details,
      timestamp: new Date().toISOString(),
    };
  }
}
