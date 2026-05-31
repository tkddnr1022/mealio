import type { EachMessagePayload } from 'kafkajs';
import { Injectable } from '@nestjs/common';
import {
  KAFKA_DLQ_TOPICS,
  KAFKA_TOPICS,
} from '@mealio/shared';
import { BaseTopicProcessor } from '../base/base.processor';
import { RetryStrategy } from '../base/retry.strategy';
import { DeadLetterHandler } from 'src/reliability/dead-letter/dlq.handler';
import { SchemaValidator } from 'src/processing/validation/schema.validator';
import {
  PersistRecipeHandler,
  type RecipeIngestionRetrievedPayload,
} from './handlers/PersistRecipeHandler';

function isValidRecipeIngestionRetrievedPayload(
  obj: unknown,
): obj is RecipeIngestionRetrievedPayload {
  if (!obj || typeof obj !== 'object') {
    return false;
  }
  const o = obj as Record<string, unknown>;
  return typeof o.jobId === 'string' && o.jobId.length > 0;
}

/** recipe-ingestion-retrieved 토픽 전용 processor */
@Injectable()
export class RecipeIngestionPersistProcessor extends BaseTopicProcessor<RecipeIngestionRetrievedPayload> {
  private readonly schemaValidator = new SchemaValidator({
    name: RecipeIngestionPersistProcessor.name,
  });

  constructor(
    retryStrategy: RetryStrategy,
    deadLetterHandler: DeadLetterHandler,
    private readonly persistRecipeHandler: PersistRecipeHandler,
  ) {
    super(
      RecipeIngestionPersistProcessor.name,
      retryStrategy,
      deadLetterHandler,
    );
  }

  getTopic(): string {
    return KAFKA_TOPICS.RECIPE_INGESTION_RETRIEVED;
  }

  getDlqTopic(): string {
    return KAFKA_DLQ_TOPICS.RECIPE_INGESTION_RETRIEVED_DLQ;
  }

  protected parseEvent(
    message: EachMessagePayload,
  ): RecipeIngestionRetrievedPayload | null {
    return this.schemaValidator.validateFromKafkaMessage<RecipeIngestionRetrievedPayload>(
      message,
      isValidRecipeIngestionRetrievedPayload,
    );
  }

  protected async processEvent(
    event: RecipeIngestionRetrievedPayload,
    _message: EachMessagePayload,
  ): Promise<void> {
    await this.persistRecipeHandler.execute(event);
  }
}
