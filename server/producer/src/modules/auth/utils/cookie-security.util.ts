import { ConfigService } from '@nestjs/config';

export function isSecureCookie(config: ConfigService): boolean {
  const appEnv = config.getOrThrow<string>('APP_ENV');
  return appEnv !== 'development' && appEnv !== 'local';
}
