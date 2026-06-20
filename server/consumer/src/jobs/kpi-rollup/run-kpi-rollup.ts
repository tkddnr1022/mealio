import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { KpiRollupModule } from './kpi-rollup.module';
import { KpiRollupService } from './kpi-rollup.service';

/**
 * KPI 일별 롤업 CLI.
 *
 * Usage:
 *   pnpm --filter consumer run job:kpi-rollup              # 전일(UTC) 집계
 *   pnpm --filter consumer run job:kpi-rollup 2026-05-22   # 지정일 집계
 *   pnpm --filter consumer run job:kpi-rollup --backfill 7 # 최근 7일 백필
 *
 * 외부 스케줄러(cron / ECS scheduled task)에서 일 1회 호출한다.
 */
async function main(): Promise<void> {
  const logger = new Logger('KpiRollupCLI');
  const app = await NestFactory.createApplicationContext(KpiRollupModule, {
    logger: ['log', 'error', 'warn'],
  });

  const service = app.get(KpiRollupService);
  const args = process.argv.slice(2);

  const backfillIdx = args.indexOf('--backfill');
  if (backfillIdx !== -1) {
    const days = parseInt(args[backfillIdx + 1] ?? '7', 10);
    logger.log(`Backfilling ${days} days`);
    for (let i = days; i >= 1; i--) {
      const d = new Date();
      d.setUTCDate(d.getUTCDate() - i);
      await service.rollupDate(d.toISOString().slice(0, 10));
    }
  } else {
    const dateArg = args[0];
    const targetDate = dateArg ?? yesterdayUTC();
    logger.log(`Rolling up date=${targetDate}`);
    await service.rollupDate(targetDate);
  }

  await app.close();
  logger.log('Done');
}

function yesterdayUTC(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

void main();
