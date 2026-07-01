import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import {
  Counter,
  Gauge,
  Histogram,
  Registry,
  collectDefaultMetrics,
} from 'prom-client';
import type { ObservabilityConfig } from '@mealio/shared';

export const OBSERVABILITY_CONFIG = 'OBSERVABILITY_CONFIG';

const HTTP_DURATION_BUCKETS_MS = [5, 10, 25, 50, 100, 200, 500, 1000, 2000];
const DB_DURATION_BUCKETS_MS = [1, 5, 10, 25, 50, 100, 250, 500, 1000, 2000];

@Injectable()
export class MetricsService implements OnModuleInit {
  readonly registry: Registry;
  readonly enabled: boolean;

  private httpRequestDurationMs?: Histogram<string>;
  private httpRequestsTotal?: Counter<string>;
  private httpInflightRequests?: Gauge<string>;
  private dbQueryDurationMs?: Histogram<string>;
  private dbQueriesTotal?: Counter<string>;
  private slowQueriesTotal?: Counter<string>;
  private rateLimitBlockedTotal?: Counter<string>;

  constructor(
    @Inject(OBSERVABILITY_CONFIG)
    private readonly observability: ObservabilityConfig,
  ) {
    this.enabled = observability.metricsEnabled;
    this.registry = new Registry();
    this.registry.setDefaultLabels({
      service: observability.serviceName,
    });

    if (!this.enabled) {
      return;
    }

    this.httpRequestDurationMs = new Histogram({
      name: 'http_request_duration_ms',
      help: 'HTTP request duration in milliseconds',
      labelNames: ['method', 'route', 'status_code'] as const,
      buckets: HTTP_DURATION_BUCKETS_MS,
      registers: [this.registry],
    });

    this.httpRequestsTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total HTTP requests',
      labelNames: ['method', 'route', 'status_code'] as const,
      registers: [this.registry],
    });

    this.httpInflightRequests = new Gauge({
      name: 'http_inflight_requests',
      help: 'In-flight HTTP requests',
      registers: [this.registry],
    });

    this.dbQueryDurationMs = new Histogram({
      name: 'db_query_duration_ms',
      help: 'Database query duration in milliseconds',
      labelNames: ['engine', 'operation'] as const,
      buckets: DB_DURATION_BUCKETS_MS,
      registers: [this.registry],
    });

    this.dbQueriesTotal = new Counter({
      name: 'db_queries_total',
      help: 'Total database queries',
      labelNames: ['engine', 'operation'] as const,
      registers: [this.registry],
    });

    this.slowQueriesTotal = new Counter({
      name: 'slow_queries_total',
      help: 'Slow database queries exceeding threshold',
      labelNames: ['engine', 'operation'] as const,
      registers: [this.registry],
    });

    this.rateLimitBlockedTotal = new Counter({
      name: 'rate_limit_blocked_total',
      help: 'API requests blocked by Redis rate limit middleware (HTTP 429)',
      registers: [this.registry],
    });
  }

  onModuleInit(): void {
    if (!this.enabled) {
      return;
    }
    collectDefaultMetrics({ register: this.registry });
  }

  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  getContentType(): string {
    return this.registry.contentType;
  }

  recordHttpRequest(
    method: string,
    route: string,
    statusCode: number,
    durationMs: number,
  ): void {
    if (!this.enabled) {
      return;
    }
    const labels = {
      method,
      route: normalizeRoute(route),
      status_code: String(statusCode),
    };
    this.httpRequestDurationMs!.observe(labels, durationMs);
    this.httpRequestsTotal!.inc(labels);
  }

  recordDbQuery(
    engine: 'prisma' | 'mongoose',
    operation: string,
    durationMs: number,
  ): void {
    if (!this.enabled) {
      return;
    }
    const op = sanitizeLabel(operation);
    const labels = { engine, operation: op };
    this.dbQueryDurationMs!.observe(labels, durationMs);
    this.dbQueriesTotal!.inc(labels);
  }

  recordSlowQuery(engine: 'prisma' | 'mongoose', operation: string): void {
    if (!this.enabled) {
      return;
    }
    this.slowQueriesTotal!.inc({
      engine,
      operation: sanitizeLabel(operation),
    });
  }

  incHttpInflight(): void {
    if (this.enabled) {
      this.httpInflightRequests!.inc();
    }
  }

  decHttpInflight(): void {
    if (this.enabled) {
      this.httpInflightRequests!.dec();
    }
  }

  recordRateLimitBlocked(): void {
    if (this.enabled) {
      this.rateLimitBlockedTotal!.inc();
    }
  }
}

function normalizeRoute(path: string): string {
  return path.split('?')[0] || '/';
}

function sanitizeLabel(value: string): string {
  const trimmed = value.trim().slice(0, 64);
  return trimmed.length > 0 ? trimmed : 'unknown';
}
