import { config } from 'dotenv';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

export function resolveEnvFilePaths(cwd = process.cwd()): string[] {
  const appEnv = process.env.APP_ENV;
  return [resolve(cwd, `.env.${appEnv}.local`), resolve(cwd, '.env.local')];
}

/** NestJS ConfigModule envFilePath와 동일한 우선순위로 dotenv 파일을 로드한다. */
export function loadEnvFiles(cwd = process.cwd()): void {
  const paths = resolveEnvFilePaths(cwd);
  for (const envPath of [...paths]) {
    console.log(`Loading env file: ${envPath}`);
    if (existsSync(envPath)) {
      config({ path: envPath });
    } else {
      console.warn(`Env file not found: ${envPath}`);
    }
  }
}
