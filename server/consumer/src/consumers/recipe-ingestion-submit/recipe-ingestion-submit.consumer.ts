import { Injectable } from '@nestjs/common';
import { KafkaService } from 'src/integrations/kafka/kafka.service';
import { CONSUMER_GROUPS } from '../../constants/consumer-groups.constants';
import { BaseConsumer } from '../base/base.consumer';
import { RecipeIngestionSubmitProcessor } from './recipe-ingestion-submit.processor';

/** recipe-ingestion-submit-group → RecipeIngestionSubmitProcessor */
@Injectable()
export class RecipeIngestionSubmitConsumer extends BaseConsumer {
  constructor(
    kafkaService: KafkaService,
    recipeIngestionSubmitProcessor: RecipeIngestionSubmitProcessor,
  ) {
    super(
      kafkaService,
      CONSUMER_GROUPS.RECIPE_INGESTION_SUBMIT,
      [recipeIngestionSubmitProcessor],
      RecipeIngestionSubmitConsumer.name,
    );
  }
}
