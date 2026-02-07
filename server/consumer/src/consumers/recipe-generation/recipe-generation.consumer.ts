import { Injectable } from '@nestjs/common';
import { KafkaService } from 'src/integrations/kafka/kafka.service';
import { CONSUMER_GROUPS } from 'src/config/consumer-groups';
import { BaseConsumer } from '../base/base.consumer';
import { RecipeGenerationProcessor } from './recipe-generation/recipe-generation.processor';

/** KafkaConsumer1: recipe-generation-group → RecipeGenerationProcessor */
@Injectable()
export class RecipeGenerationConsumer extends BaseConsumer {
  constructor(
    kafkaService: KafkaService,
    recipeGenerationProcessor: RecipeGenerationProcessor,
  ) {
    super(
      kafkaService,
      CONSUMER_GROUPS.RECIPE_GENERATION,
      [recipeGenerationProcessor],
      RecipeGenerationConsumer.name,
    );
  }
}
