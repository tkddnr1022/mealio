import { Injectable } from '@nestjs/common';
import { CONSUMER_GROUPS } from 'src/constants/consumer-groups.constants';
import { KafkaService } from 'src/integrations/kafka/kafka.service';
import { BaseConsumer } from '../base/base.consumer';
import { RecipeIngestionEmbedSubmitProcessor } from './recipe-ingestion-embed-submit.processor';

@Injectable()
export class RecipeIngestionEmbedSubmitConsumer extends BaseConsumer {
  constructor(
    kafkaService: KafkaService,
    embedSubmitProcessor: RecipeIngestionEmbedSubmitProcessor,
  ) {
    super(
      kafkaService,
      CONSUMER_GROUPS.RECIPE_INGESTION_EMBED_SUBMIT,
      [embedSubmitProcessor],
      RecipeIngestionEmbedSubmitConsumer.name,
    );
  }
}
