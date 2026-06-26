import type { EachMessagePayload } from 'kafkajs';
import { Injectable } from '@nestjs/common';
import { KAFKA_DLQ_TOPICS, KAFKA_TOPICS } from '@mealio/shared';
import { BaseTopicProcessor } from '../base/base.processor';
import { RetryStrategy } from '../base/retry.strategy';
import { DeadLetterHandler } from 'src/reliability/dead-letter/dlq.handler';
import { SchemaValidator } from 'src/processing/validation/schema.validator';
import {
  isValidRecipeIngestionRunTriggerPayload,
  type RecipeIngestionParseRetrieveToPersistPayload,
} from 'src/jobs/recipe-ingestion/recipe-ingestion-range-trigger.payload';
import { PersistRecipeHandler } from './handlers/PersistRecipeHandler';

/** recipe-ingestion-parse_retrieved 토픽 전용 processor */
@Injectable()
export class RecipeIngestionPersistProcessor extends BaseTopicProcessor<RecipeIngestionParseRetrieveToPersistPayload> {
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
    return KAFKA_TOPICS.RECIPE_INGESTION_PERSIST_TRIGGERED;
  }

  getDlqTopic(): string {
    return KAFKA_DLQ_TOPICS.RECIPE_INGESTION_PERSIST_TRIGGERED_DLQ;
  }

  protected parseEvent(
    message: EachMessagePayload,
  ): RecipeIngestionParseRetrieveToPersistPayload | null {
    return this.schemaValidator.validateFromKafkaMessage<RecipeIngestionParseRetrieveToPersistPayload>(
      message,
      isValidRecipeIngestionRunTriggerPayload,
    );
  }

  protected async processEvent(
    event: RecipeIngestionParseRetrieveToPersistPayload,
    message: EachMessagePayload,
  ): Promise<void> {
    const correlationId = this.resolveCorrelationId(message);
    await this.persistRecipeHandler.execute(event, correlationId);
  }
}
