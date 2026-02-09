import type { EachMessagePayload } from 'kafkajs';
import { Injectable } from '@nestjs/common';
import { KAFKA_DLQ_TOPICS, KAFKA_TOPICS } from '@cook/shared';
import { BaseTopicProcessor } from '../base/base.processor';
import { RetryStrategy } from '../base/retry.strategy';
import { DeadLetterHandler } from 'src/reliability/dead-letter/dlq.handler';

/** recipe-generation 토픽 전용 processor (파싱·비즈니스·DLQ). 추후 GenerateRecipeHandler 등 연동. */
@Injectable()
export class RecipeGenerationProcessor extends BaseTopicProcessor<
  Record<string, unknown>
> {
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
  ): Record<string, unknown> | null {
    const raw = message.message.value?.toString();
    if (!raw) return null;
    try {
      return JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  protected async processEvent(
    _event: Record<string, unknown>,
    _message: EachMessagePayload,
  ): Promise<void> {
    // TODO: GenerateRecipeHandler, SaveRecipeHandler, UploadImageHandler 연동
    this.logger.debug('Recipe generation event received (stub)');
  }
}
