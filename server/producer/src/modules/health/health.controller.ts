import { Controller, Get, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  HealthService,
  LivenessResponse,
  ReadinessResponse,
} from './health.service';

@ApiTags('Internal')
@Controller()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get('health')
  @ApiOperation({ summary: '애플리케이션 liveness 체크' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '애플리케이션이 기동 중(liveness ok)',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['ok', 'degraded'] },
        timestamp: { type: 'string', format: 'date-time' },
      },
    },
  })
  async getHealth(): Promise<LivenessResponse> {
    return this.healthService.getLiveness();
  }

  @Get('ready')
  @ApiOperation({ summary: '애플리케이션 readiness 체크' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '주요 의존성이 준비됨(readiness ok/degraded)',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['ok', 'degraded'] },
        timestamp: { type: 'string', format: 'date-time' },
        details: {
          type: 'object',
          properties: {
            app: { type: 'string', enum: ['ok', 'degraded'] },
            postgres: {
              type: 'string',
              enum: ['ok', 'degraded', 'unknown'],
            },
            mongodb: {
              type: 'string',
              enum: ['ok', 'degraded', 'unknown'],
            },
          },
        },
      },
    },
  })
  async getReady(): Promise<ReadinessResponse> {
    return this.healthService.getReadiness();
  }
}
