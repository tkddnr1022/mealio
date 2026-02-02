import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';
import {
  ChatbotRequestEvent,
  KAFKA_TOPICS,
  createKafkaConfig,
  getChatbotStreamChannel,
  RedisService,
  type ChatbotStreamEvent,
} from '@cook/shared';
import { ProcessChatHandler } from './handlers/process-chat.handler.js';
import { SaveChatLogHandler } from './handlers/save-chat-log.handler.js';
import { UpdateContextHandler } from './handlers/update-context.handler.js';

@Injectable()
export class ChatbotRequestConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ChatbotRequestConsumer.name);
  private kafka!: Kafka;
  private consumer!: Consumer;
  private isRunning = false;

  constructor(
    private readonly redisService: RedisService,
    private readonly processChatHandler: ProcessChatHandler,
    private readonly saveChatLogHandler: SaveChatLogHandler,
    private readonly updateContextHandler: UpdateContextHandler,
  ) {}

  async onModuleInit(): Promise<void> {
    const kafkaConfig = createKafkaConfig('consumer');
    this.kafka = new Kafka(kafkaConfig);
    this.consumer = this.kafka.consumer({
      groupId: process.env.KAFKA_CONSUMER_GROUP_ID || 'cook-chatbot-consumers',
    });

    try {
      await this.consumer.connect();
      await this.consumer.subscribe({
        topic: KAFKA_TOPICS.CHATBOT_REQUESTS,
        fromBeginning: false,
      });

      await this.consumer.run({
        eachMessage: async (payload: EachMessagePayload) => {
          await this.handleMessage(payload);
        },
      });

      this.isRunning = true;
      this.logger.log(
        `ChatbotRequestConsumer is running (topic=${KAFKA_TOPICS.CHATBOT_REQUESTS})`,
      );
    } catch (error) {
      this.logger.error('Failed to start ChatbotRequestConsumer', error as Error);
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (!this.consumer || !this.isRunning) {
      return;
    }

    try {
      await this.consumer.disconnect();
      this.logger.log('ChatbotRequestConsumer disconnected');
    } catch (error) {
      this.logger.error(
        'Error while disconnecting ChatbotRequestConsumer',
        error as Error,
      );
    }
  }

  private async handleMessage({ message }: EachMessagePayload): Promise<void> {
    if (!message.value) {
      this.logger.warn('Received message without value, skipping');
      return;
    }

    let event: ChatbotRequestEvent;
    try {
      event = JSON.parse(message.value.toString()) as ChatbotRequestEvent;
    } catch (error) {
      this.logger.error('Failed to parse ChatbotRequestEvent', error as Error);
      return;
    }

    try {
      const processed = await this.processChatHandler.execute(event);
      await this.saveChatLogHandler.execute(event, processed);
      await this.updateContextHandler.execute(event, processed);

      if (event.streamChannelId) {
        await this.publishStreamEvents(event, processed.reply, processed.suggestedRecipes);
      }
    } catch (error) {
      this.logger.error('Error while handling chatbot request', error as Error);
      if (event.streamChannelId) {
        await this.publishStreamError(event.streamChannelId, '챗봇 응답 처리 중 오류가 발생했습니다.');
      }
    }
  }

  private async publishStreamEvents(
    event: ChatbotRequestEvent,
    reply: string,
    suggestedRecipes: Array<{ id: number; title: string; matchScore: number }> | null,
  ): Promise<void> {
    const channel = getChatbotStreamChannel(event.streamChannelId!);
    const client = this.redisService.getClient();

    // 1페이즈에서는 단일 청크 + done 조합으로 구현
    const chunkPayload: ChatbotStreamEvent = {
      type: 'chunk',
      data: reply,
    };
    const donePayload: ChatbotStreamEvent = {
      type: 'done',
      data: {
        conversationId: event.conversationId ?? event.sessionId ?? 'unknown',
        message: reply,
        suggestedRecipes: suggestedRecipes ?? undefined,
      },
    };

    await client.publish(channel, JSON.stringify(chunkPayload));
    await client.publish(channel, JSON.stringify(donePayload));
  }

  private async publishStreamError(
    streamChannelId: string,
    message: string,
  ): Promise<void> {
    const channel = getChatbotStreamChannel(streamChannelId);
    const client = this.redisService.getClient();
    const errorPayload: ChatbotStreamEvent = {
      type: 'error',
      data: { message },
    };
    await client.publish(channel, JSON.stringify(errorPayload));
  }
}

