import type { EachMessagePayload } from 'kafkajs';
import { Injectable } from '@nestjs/common';
import { KAFKA_DLQ_TOPICS, KAFKA_TOPICS } from '@mealio/shared';
import { BaseTopicProcessor } from '../base/base.processor';
import { RetryStrategy } from '../base/retry.strategy';
import { DeadLetterHandler } from 'src/reliability/dead-letter/dlq.handler';
import { SchemaValidator } from 'src/processing/validation/schema.validator';

type RecipeGenerationEvent = Record<string, unknown>;

function isRecipeGenerationEvent(obj: unknown): obj is RecipeGenerationEvent {
  return !!obj && typeof obj === 'object';
}

/** recipe-generation 토픽 전용 processor (파싱·비즈니스·DLQ). 추후 GenerateRecipeHandler 등 연동. */
@Injectable()
export class RecipeGenerationProcessor extends BaseTopicProcessor<RecipeGenerationEvent> {
  private readonly schemaValidator = new SchemaValidator({
    name: RecipeGenerationProcessor.name,
  });

  constructor(
    retryStrategy: RetryStrategy,
    deadLetterHandler: DeadLetterHandler,
  ) {
    super(RecipeGenerationProcessor.name, retryStrategy, deadLetterHandler);
  }

  getTopic(): string {
    return KAFKA_TOPICS.RECIPE_GENERATION;
  }

  getDlqTopic(): string {
    return KAFKA_DLQ_TOPICS.RECIPE_GENERATION_DLQ;
  }

  protected parseEvent(
    message: EachMessagePayload,
  ): RecipeGenerationEvent | null {
    return this.schemaValidator.validateFromKafkaMessage<RecipeGenerationEvent>(
      message,
      isRecipeGenerationEvent,
    );
  }

  protected async processEvent(
    _event: RecipeGenerationEvent,
    _message: EachMessagePayload,
  ): Promise<void> {
    // TODO: GenerateRecipeHandler, SaveRecipeHandler, UploadImageHandler 연동
    this.logger.debug('Recipe generation event received (stub)');
  }
}
