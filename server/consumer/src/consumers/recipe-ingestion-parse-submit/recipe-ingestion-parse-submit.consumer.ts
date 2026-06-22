import { Injectable } from '@nestjs/common';
import { CONSUMER_GROUPS } from '../../constants/consumer-groups.constants';
import { BaseConsumer } from '../base/base.consumer';
import { RecipeIngestionParseSubmitProcessor } from './recipe-ingestion-parse-submit.processor';
import { KafkaService } from 'src/integrations/kafka/kafka.service';

@Injectable()
export class RecipeIngestionParseSubmitConsumer extends BaseConsumer {
  constructor(
    kafkaService: KafkaService,
    parseSubmitProcessor: RecipeIngestionParseSubmitProcessor,
  ) {
    super(
      kafkaService,
      CONSUMER_GROUPS.RECIPE_INGESTION_PARSE_SUBMIT,
      [parseSubmitProcessor],
      RecipeIngestionParseSubmitConsumer.name,
    );
  }
}
