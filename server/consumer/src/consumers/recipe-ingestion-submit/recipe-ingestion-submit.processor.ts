import type { EachMessagePayload } from 'kafkajs';
import { Injectable } from '@nestjs/common';
import { KAFKA_DLQ_TOPICS, KAFKA_TOPICS } from '@mealio/shared';
import { BaseTopicProcessor } from '../base/base.processor';
import { RetryStrategy } from '../base/retry.strategy';
import { DeadLetterHandler } from 'src/reliability/dead-letter/dlq.handler';
import { SchemaValidator } from 'src/processing/validation/schema.validator';
import {
  isValidRecipeIngestionRunTriggerPayload,
  type RecipeIngestionFetchCompletedPayload,
} from 'src/jobs/recipe-ingestion/recipe-ingestion-range-trigger.payload';
import { SubmitRecipeIngestionHandler } from './handlers/SubmitRecipeIngestionHandler';

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
      isValidRecipeIngestionRunTriggerPayload,
    );
  }

  protected async processEvent(
    event: RecipeIngestionFetchCompletedPayload,
    _message: EachMessagePayload,
  ): Promise<void> {
    await this.submitRecipeIngestionHandler.execute(event);
  }
}
