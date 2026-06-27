import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { createServer, type Server } from 'node:http';
import type { ObservabilityConfig } from '@mealio/shared';
import { MetricsService, OBSERVABILITY_CONFIG } from './metrics.service';

/**
 * Producer용 Prometheus scrape HTTP 엔드포인트 (METRICS_PORT).
 */
@Injectable()
export class MetricsExporterService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MetricsExporterService.name);
  private server: Server | null = null;

  constructor(
    private readonly metrics: MetricsService,
    @Inject(OBSERVABILITY_CONFIG)
    private readonly observability: ObservabilityConfig,
  ) {}

  onModuleInit(): void {
    if (!this.observability.metricsEnabled) {
      return;
    }

    const port = this.observability.metricsPort;
    this.server = createServer((req, res) => {
      if (req.url !== '/metrics') {
        res.statusCode = 404;
        res.end('Not Found');
        return;
      }
      void (async () => {
        try {
          const body = await this.metrics.getMetrics();
          res.statusCode = 200;
          res.setHeader('Content-Type', this.metrics.getContentType());
          res.end(body);
        } catch (error) {
          res.statusCode = 500;
          res.end((error as Error).message);
        }
      })();
    });

    this.server.listen(port, () => {
      this.logger.log(`Prometheus metrics listening on :${port}/metrics`);
    });
  }

  onModuleDestroy(): void {
    if (this.server) {
      this.server.close();
      this.server = null;
    }
  }
}
