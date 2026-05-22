import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import type { Connection } from 'mongoose';
import { MetricsService } from './metrics.service';
import { SlowQueryMonitor } from './slow-query.interceptor';

@Injectable()
export class MongooseMetrics implements OnModuleInit {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly metricsService: MetricsService,
    private readonly slowQueryMonitor: SlowQueryMonitor,
  ) {}

  onModuleInit(): void {
    if (!this.metricsService.enabled) {
      return;
    }

    const metricsService = this.metricsService;
    const slowQueryMonitor = this.slowQueryMonitor;

    this.connection.plugin((schema) => {
      schema.pre(/^(find|count|update|delete|save|insert)/i, function () {
        (this as { _metricsStart?: number })._metricsStart = Date.now();
      });

      schema.post(/^(find|count|update|delete|save|insert)/i, function () {
        const start = (this as { _metricsStart?: number })._metricsStart;
        if (start === undefined) {
          return;
        }
        const durationMs = Date.now() - start;
        const operation = inferMongooseOperation(this);
        metricsService.recordDbQuery('mongoose', operation, durationMs);
        slowQueryMonitor.recordIfSlow('mongoose', operation, durationMs, {
          collection: (this as { collection?: { name?: string } }).collection
            ?.name,
        });
      });
    });
  }
}

function inferMongooseOperation(ctx: unknown): string {
  const op = (ctx as { op?: string }).op;
  if (op) {
    return op;
  }
  const constructorName = (ctx as { constructor?: { name?: string } }).constructor
    ?.name;
  return constructorName ?? 'unknown';
}
