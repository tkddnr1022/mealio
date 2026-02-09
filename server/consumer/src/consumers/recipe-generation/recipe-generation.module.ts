import { Module } from '@nestjs/common';
import { KafkaModule } from 'src/integrations/kafka/kafka.module';
import { RetryStrategy } from '../base/retry.strategy';
import { DeadLetterHandler } from 'src/reliability/dead-letter/dlq.handler';
import { RecipeGenerationProcessor } from './recipe-generation.processor';
import { RecipeGenerationConsumer } from './recipe-generation.consumer';

@Module({
  imports: [KafkaModule],
  providers: [
    RetryStrategy,
    DeadLetterHandler,
    RecipeGenerationProcessor,
    RecipeGenerationConsumer,
  ],
  exports: [RecipeGenerationProcessor],
})
export class RecipeGenerationModule {}
