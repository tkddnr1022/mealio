/**
 * MongoDB 시드 stub — 데이터 삽입 없음.
 * 인덱스 동기화: `pnpm run db:mongoose:sync-indexes`
 * 실행: `pnpm run db:mongoose:seed`
 */
import { loadEnvFiles } from '../../config/load-env-files';

loadEnvFiles();

async function main(): Promise<void> {
  if (!process.env.MONGODB_URL) {
    throw new Error('MONGODB_URL is required');
  }

  console.log('⏭️ Mongoose seed skipped (stub). No data inserted.');
}

main().catch((error) => {
  console.error('❌ Mongoose seed failed:', error);
  process.exit(1);
});
