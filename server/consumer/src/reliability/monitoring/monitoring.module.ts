import { Global, Module } from '@nestjs/common';
import { createObservabilityConfig } from '@mealio/shared';
import { KafkaModule } from 'src/integrations/kafka/kafka.module';
import {
  ConsumerMetricsService,
  OBSERVABILITY_CONFIG,
} from './consumer-metrics.service';
import { ConsumerLagMonitor } from './consumer-lag.monitor';
import { MetricsExporterService } from './metrics-exporter.service';

@Global()
@Module({
  imports: [KafkaModule],
  providers: [
    {
      provide: OBSERVABILITY_CONFIG,
      useFactory: () => createObservabilityConfig('consumer'),
    },
    ConsumerMetricsService,
    ConsumerLagMonitor,
    MetricsExporterService,
  ],
  exports: [ConsumerMetricsService, OBSERVABILITY_CONFIG],
})
export class MonitoringModule {}
