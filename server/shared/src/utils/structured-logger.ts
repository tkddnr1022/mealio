import { Logger } from '@nestjs/common';

export type StructuredLogLevel = 'log' | 'warn' | 'error' | 'debug';

export interface StructuredLogFields {
  event: string;
  correlationId?: string;
  service?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  durationMs?: number;
  topic?: string;
  partition?: number;
  offset?: string;
  message?: string;
  [key: string]: unknown;
}

export function formatStructuredLog(fields: StructuredLogFields): string {
  return JSON.stringify(fields);
}

export function logStructured(
  logger: Logger,
  level: StructuredLogLevel,
  fields: StructuredLogFields,
): void {
  const payload = formatStructuredLog(fields);

  switch (level) {
    case 'error':
      logger.error(payload);
      break;
    case 'warn':
      logger.warn(payload);
      break;
    case 'debug':
      logger.debug(payload);
      break;
    default:
      logger.log(payload);
  }
}
