/**
 * Mongoose 스키마 인덱스를 MongoDB에 동기화한다.
 * Prisma migrate deploy와 함께 배포 파이프라인에서 실행한다.
 *
 * 실행: pnpm run mongoose:sync-indexes (shared)
 *       pnpm run db:mongoose:sync-indexes (monorepo root)
 */
import { loadEnvFiles } from '../../config/load-env-files';
import mongoose, { type Connection, type Schema } from 'mongoose';
import {
  ChatbotConversation,
  ChatbotConversationSchema,
  ChatbotLog,
  ChatbotLogSchema,
  EventLog,
  EventLogSchema,
  Inventory,
  InventorySchema,
  KpiRollup,
  KpiRollupSchema,
  RecipeIngestionJob,
  RecipeIngestionJobSchema,
  RecipeIngestionState,
  RecipeIngestionStateSchema,
} from './schemas';

const SHARED_MODELS: ReadonlyArray<{
  name: string;
  schema: Schema;
}> = [
  { name: EventLog.name, schema: EventLogSchema },
  { name: ChatbotLog.name, schema: ChatbotLogSchema },
  { name: ChatbotConversation.name, schema: ChatbotConversationSchema },
  { name: Inventory.name, schema: InventorySchema },
  { name: KpiRollup.name, schema: KpiRollupSchema },
  { name: RecipeIngestionJob.name, schema: RecipeIngestionJobSchema },
  { name: RecipeIngestionState.name, schema: RecipeIngestionStateSchema },
];

function registerModels(connection: Connection): void {
  for (const { name, schema } of SHARED_MODELS) {
    if (connection.models[name] == null) {
      connection.model(name, schema);
    }
  }
}

async function logIndexDiff(connection: Connection): Promise<void> {
  for (const { name } of SHARED_MODELS) {
    const model = connection.models[name];
    if (model == null) {
      continue;
    }

    const { toCreate, toDrop } = await model.diffIndexes();
    if (toCreate.length === 0 && toDrop.length === 0) {
      console.log(`  · ${name}: 변경 없음`);
      continue;
    }

    console.log(
      `  · ${name}: 생성 ${toCreate.length}건, 삭제 ${toDrop.length}건`,
    );
    for (const index of toCreate) {
      console.log(`      + ${JSON.stringify(index)}`);
    }
    for (const index of toDrop) {
      console.log(`      - ${JSON.stringify(index)}`);
    }
  }
}

async function main(): Promise<void> {
  loadEnvFiles();

  const uri = process.env.MONGODB_URL;
  if (uri == null || uri.trim() === '') {
    throw new Error('MONGODB_URL is required');
  }

  console.log('🔄 Mongoose index sync 시작...');

  await mongoose.connect(uri, {
    readPreference: 'primary',
  });

  const connection = mongoose.connection;
  registerModels(connection);

  console.log('📋 동기화 전 diff:');
  await logIndexDiff(connection);

  const droppedByModel = await connection.syncIndexes({
    continueOnError: false,
  });

  console.log('✅ 동기화 결과:');
  for (const { name } of SHARED_MODELS) {
    const dropped = droppedByModel[name] ?? [];
    if (dropped.length === 0) {
      console.log(`  ✓ ${name}: 스키마 인덱스와 일치`);
      continue;
    }
    console.log(`  ✓ ${name}: 제거된 인덱스 ${dropped.join(', ')}`);
  }

  console.log('✅ Mongoose index sync 완료');
}

main()
  .catch((error: unknown) => {
    console.error('❌ Mongoose index sync 실패:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
