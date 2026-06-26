import { Injectable } from '@nestjs/common';
import type { EachMessagePayload } from 'kafkajs';
import { KAFKA_DLQ_TOPICS, KAFKA_TOPICS } from '@mealio/shared';
import { SchemaValidator } from 'src/processing/validation/schema.validator';
import { DeadLetterHandler } from 'src/reliability/dead-letter/dlq.handler';
import {
  isValidRecipeIngestionRunTriggerPayload,
  type RecipeIngestionFetchToParseSubmitPayload,
} from 'src/jobs/recipe-ingestion/recipe-ingestion-range-trigger.payload';
import { BaseTopicProcessor } from '../base/base.processor';
import { RetryStrategy } from '../base/retry.strategy';
import { ParseSubmitRecipeIngestionHandler } from './handlers/ParseSubmitRecipeIngestionHandler';

@Injectable()
export class RecipeIngestionParseSubmitProcessor extends BaseTopicProcessor<RecipeIngestionFetchToParseSubmitPayload> {
  private readonly schemaValidator = new SchemaValidator({
    name: RecipeIngestionParseSubmitProcessor.name,
  });

  constructor(
    retryStrategy: RetryStrategy,
    deadLetterHandler: DeadLetterHandler,
    private readonly handler: ParseSubmitRecipeIngestionHandler,
  ) {
    super(
      RecipeIngestionParseSubmitProcessor.name,
      retryStrategy,
      deadLetterHandler,
    );
  }

  getTopic(): string {
    return KAFKA_TOPICS.RECIPE_INGESTION_PARSE_SUBMIT_TRIGGERED;
  }

  getDlqTopic(): string {
    return KAFKA_DLQ_TOPICS.RECIPE_INGESTION_PARSE_SUBMIT_TRIGGERED_DLQ;
  }

  protected parseEvent(
    message: EachMessagePayload,
  ): RecipeIngestionFetchToParseSubmitPayload | null {
    return this.schemaValidator.validateFromKafkaMessage(
      message,
      isValidRecipeIngestionRunTriggerPayload,
    );
  }

  protected async processEvent(
    event: RecipeIngestionFetchToParseSubmitPayload,
    message: EachMessagePayload,
  ): Promise<void> {
    const correlationId = this.resolveCorrelationId(message);
    await this.handler.execute(event, correlationId);
  }
}
