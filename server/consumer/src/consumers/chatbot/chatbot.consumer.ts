import { Injectable } from '@nestjs/common';
import { KafkaService } from 'src/integrations/kafka/kafka.service';
import { CONSUMER_GROUPS } from 'src/config/consumer-groups';
import { BaseConsumer } from '../base/base.consumer';
import { ChatbotRequestProcessor } from './chatbot-requests/chatbot-request.processor';

/** KafkaConsumer2: chatbot-group → ChatbotRequestProcessor */
@Injectable()
export class ChatbotConsumer extends BaseConsumer {
  constructor(
    kafkaService: KafkaService,
    chatbotRequestProcessor: ChatbotRequestProcessor,
  ) {
    super(
      kafkaService,
      CONSUMER_GROUPS.CHATBOT,
      [chatbotRequestProcessor],
      ChatbotConsumer.name,
    );
  }
}
