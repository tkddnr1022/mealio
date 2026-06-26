import { Logger } from '@nestjs/common';
import {
  logIngestion,
  logIngestionError,
  logRecipeIngestionCli,
  RECIPE_INGESTION_LOG_EVENTS,
} from '../recipe-ingestion-logger';

describe('recipe-ingestion-logger', () => {
  let logger: Logger;

  beforeEach(() => {
    logger = {
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    } as unknown as Logger;
  });

  it('logIngestion emits JSON with service and stage', () => {
    logIngestion(logger, 'log', {
      event: RECIPE_INGESTION_LOG_EVENTS.STAGE_STARTED,
      stage: 'fetch',
      correlationId: 'abc123',
    });

    expect(logger.log).toHaveBeenCalledWith(
      JSON.stringify({
        service: 'consumer',
        event: RECIPE_INGESTION_LOG_EVENTS.STAGE_STARTED,
        stage: 'fetch',
        correlationId: 'abc123',
      }),
    );
  });

  it('logIngestionError includes errorName and stack', () => {
    const error = new Error('batch failed');
    logIngestionError(
      logger,
      {
        event: RECIPE_INGESTION_LOG_EVENTS.BATCH_FAILED,
        stage: 'parse-submit',
        batchId: 'batch-1',
      },
      error,
    );

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('"errorName":"Error"'),
      error.stack,
    );
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('"message":"batch failed"'),
      error.stack,
    );
  });

  it('logRecipeIngestionCli sets cli event and correlationId', () => {
    logRecipeIngestionCli(
      logger,
      'log',
      RECIPE_INGESTION_LOG_EVENTS.CLI_COMPLETED,
      'persist',
      'corr-1',
      { outcome: 'success', persistedCount: 3 },
    );

    expect(logger.log).toHaveBeenCalledWith(
      JSON.stringify({
        service: 'consumer',
        event: RECIPE_INGESTION_LOG_EVENTS.CLI_COMPLETED,
        stage: 'persist',
        correlationId: 'corr-1',
        outcome: 'success',
        persistedCount: 3,
      }),
    );
  });
});
