import { Injectable } from '@nestjs/common';
import { KafkaService } from 'src/integrations/kafka/kafka.service';
import { CONSUMER_GROUPS } from '../../constants/consumer-groups.constants';
import { BaseConsumer } from '../base/base.consumer';
import { ChatbotRequestProcessor } from './chatbot-request.processor';

/** chatbot-group → ChatbotRequestProcessor */
@Injectable()
export class ChatbotRequestConsumer extends BaseConsumer {
  constructor(
    kafkaService: KafkaService,
    chatbotRequestProcessor: ChatbotRequestProcessor,
  ) {
    super(
      kafkaService,
      CONSUMER_GROUPS.CHATBOT,
      [chatbotRequestProcessor],
      ChatbotRequestConsumer.name,
    );
  }
}
