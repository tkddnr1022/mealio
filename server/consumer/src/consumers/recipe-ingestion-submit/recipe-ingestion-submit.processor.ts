import type { EachMessagePayload } from 'kafkajs';
import { Injectable } from '@nestjs/common';
import { KAFKA_DLQ_TOPICS, KAFKA_TOPICS } from '@mealio/shared';
import { BaseTopicProcessor } from '../base/base.processor';
import { RetryStrategy } from '../base/retry.strategy';
import { DeadLetterHandler } from 'src/reliability/dead-letter/dlq.handler';
import { SchemaValidator } from 'src/processing/validation/schema.validator';
import type { RecipeIngestionFetchCompletedPayload } from 'src/jobs/recipe-ingestion-fetch/services/fetch.service';
import { SubmitRecipeIngestionHandler } from './handlers/SubmitRecipeIngestionHandler';

function isValidRecipeIngestionFetchCompletedPayload(
  obj: unknown,
): obj is RecipeIngestionFetchCompletedPayload {
  if (!obj || typeof obj !== 'object') {
    return false;
  }
  const o = obj as Record<string, unknown>;
  return (
    typeof o.startIdx === 'number' &&
    Number.isFinite(o.startIdx) &&
    typeof o.endIdx === 'number' &&
    Number.isFinite(o.endIdx) &&
    typeof o.fetchedCount === 'number' &&
    Number.isFinite(o.fetchedCount) &&
    o.fetchedCount > 0 &&
    typeof o.triggeredAt === 'string' &&
    o.triggeredAt.length > 0
  );
}

/** recipe-ingestion-fetch-completed 토픽 전용 processor */
@Injectable()
export class RecipeIngestionSubmitProcessor extends BaseTopicProcessor<RecipeIngestionFetchCompletedPayload> {
  private readonly schemaValidator = new SchemaValidator({
    name: RecipeIngestionSubmitProcessor.name,
  });

  constructor(
    retryStrategy: RetryStrategy,
    deadLetterHandler: DeadLetterHandler,
    private readonly submitRecipeIngestionHandler: SubmitRecipeIngestionHandler,
  ) {
    super(
      RecipeIngestionSubmitProcessor.name,
      retryStrategy,
      deadLetterHandler,
    );
  }

  getTopic(): string {
    return KAFKA_TOPICS.RECIPE_INGESTION_FETCH_COMPLETED;
  }

  getDlqTopic(): string {
    return KAFKA_DLQ_TOPICS.RECIPE_INGESTION_FETCH_COMPLETED_DLQ;
  }

  protected parseEvent(
    message: EachMessagePayload,
  ): RecipeIngestionFetchCompletedPayload | null {
    return this.schemaValidator.validateFromKafkaMessage<RecipeIngestionFetchCompletedPayload>(
      message,
      isValidRecipeIngestionFetchCompletedPayload,
    );
  }

  protected async processEvent(
    event: RecipeIngestionFetchCompletedPayload,
    _message: EachMessagePayload,
  ): Promise<void> {
    await this.submitRecipeIngestionHandler.execute(event);
  }
}
