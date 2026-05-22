import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Res,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import type { Response } from 'express';
import { MetricsService } from './metrics.service';

@ApiExcludeController()
@Controller()
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get('metrics')
  @HttpCode(HttpStatus.OK)
  async getMetrics(@Res() res: Response): Promise<void> {
    if (!this.metricsService.enabled) {
      throw new ServiceUnavailableException('Metrics collection is disabled');
    }
    res.setHeader('Content-Type', this.metricsService.getContentType());
    res.send(await this.metricsService.getMetrics());
  }
}
