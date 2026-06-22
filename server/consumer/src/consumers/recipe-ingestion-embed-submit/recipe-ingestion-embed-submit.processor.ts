import { Injectable } from '@nestjs/common';
import type { EachMessagePayload } from 'kafkajs';
import { KAFKA_DLQ_TOPICS, KAFKA_TOPICS } from '@mealio/shared';
import { SchemaValidator } from 'src/processing/validation/schema.validator';
import { DeadLetterHandler } from 'src/reliability/dead-letter/dlq.handler';
import {
  isValidRecipeIngestionRunTriggerPayload,
  type RecipeIngestionPersistToEmbedSubmitPayload,
} from 'src/jobs/recipe-ingestion/recipe-ingestion-range-trigger.payload';
import { BaseTopicProcessor } from '../base/base.processor';
import { RetryStrategy } from '../base/retry.strategy';
import { EmbedSubmitRecipeIngestionHandler } from './handlers/EmbedSubmitRecipeIngestionHandler';

@Injectable()
export class RecipeIngestionEmbedSubmitProcessor extends BaseTopicProcessor<RecipeIngestionPersistToEmbedSubmitPayload> {
  private readonly schemaValidator = new SchemaValidator({
    name: RecipeIngestionEmbedSubmitProcessor.name,
  });

  constructor(
    retryStrategy: RetryStrategy,
    deadLetterHandler: DeadLetterHandler,
    private readonly handler: EmbedSubmitRecipeIngestionHandler,
  ) {
    super(
      RecipeIngestionEmbedSubmitProcessor.name,
      retryStrategy,
      deadLetterHandler,
    );
  }

  getTopic(): string {
    return KAFKA_TOPICS.RECIPE_INGESTION_EMBED_SUBMIT_TRIGGERED;
  }

  getDlqTopic(): string {
    return KAFKA_DLQ_TOPICS.RECIPE_INGESTION_EMBED_SUBMIT_TRIGGERED_DLQ;
  }

  protected parseEvent(
    message: EachMessagePayload,
  ): RecipeIngestionPersistToEmbedSubmitPayload | null {
    return this.schemaValidator.validateFromKafkaMessage(
      message,
      isValidRecipeIngestionRunTriggerPayload,
    );
  }

  protected async processEvent(
    event: RecipeIngestionPersistToEmbedSubmitPayload,
    _message: EachMessagePayload,
  ): Promise<void> {
    await this.handler.execute(event);
  }
}
