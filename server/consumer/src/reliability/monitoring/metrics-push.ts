import { Logger } from '@nestjs/common';
import { Pushgateway } from 'prom-client';
import { ConsumerMetricsService } from './consumer-metrics.service';

/**
 * CLI batch job 종료 직전 Pushgateway로 in-memory 메트릭을 push한다.
 * push 실패는 warn 로그만 남기고 CLI 종료 코드에 영향을 주지 않는다.
 */
export async function pushCliMetrics(
  metrics: ConsumerMetricsService,
  pushgatewayUrl: string | undefined,
  stage: string,
  logger: Logger,
): Promise<void> {
  if (!metrics.enabled || !pushgatewayUrl) {
    return;
  }

  const gateway = new Pushgateway(pushgatewayUrl, {}, metrics.registry);

  try {
    await gateway.pushAdd({
      jobName: 'recipe_ingestion_cli',
      groupings: { stage },
    });
  } catch (err) {
    logger.warn(`Pushgateway push failed: ${String(err)}`);
  }
}
