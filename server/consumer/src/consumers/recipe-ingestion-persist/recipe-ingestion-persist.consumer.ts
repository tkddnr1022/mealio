import { Injectable } from '@nestjs/common';
import { KafkaService } from 'src/integrations/kafka/kafka.service';
import { CONSUMER_GROUPS } from '../../constants/consumer-groups.constants';
import { BaseConsumer } from '../base/base.consumer';
import { RecipeIngestionPersistProcessor } from './recipe-ingestion-persist.processor';

/** recipe-ingestion-persist-group → RecipeIngestionPersistProcessor */
@Injectable()
export class RecipeIngestionPersistConsumer extends BaseConsumer {
  constructor(
    kafkaService: KafkaService,
    recipeIngestionPersistProcessor: RecipeIngestionPersistProcessor,
  ) {
    super(
      kafkaService,
      CONSUMER_GROUPS.RECIPE_INGESTION_PERSIST,
      [recipeIngestionPersistProcessor],
      RecipeIngestionPersistConsumer.name,
    );
  }
}
