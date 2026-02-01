import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { KafkaProducerService } from '../../infrastructure/kafka/producer.service';
import { RedisService } from '../../infrastructure/cache/redis.service';
import { KAFKA_TOPICS } from '../../shared/constants/kafka-topics';
import { getChatbotStreamChannel } from '../../shared/constants/redis-channels';
import type { ChatbotRequestEvent } from '../../shared/types/events';
import type { SendMessageDto } from './dto/send-message.dto';
import type { ChatbotResponseDto } from './dto/chatbot-response.dto';
import { ChatbotLogRepository } from '../../infrastructure/database/repositories/mongodb/chatbot-log.repository';
import type { ConversationHistoryDto } from './dto/conversation-history.dto';
import type { ConversationListDto } from './dto/conversation-list.dto';
import type { ChatbotStreamEvent } from './types/stream-event.types';

/** SSE 스트림 대기 최대 시간 (ms). 이 시간 내에 done/error가 오지 않으면 연결 종료 */
const STREAM_TIMEOUT_MS = 120_000;

export interface StreamMessageCallbacks {
  /** SSE 데이터 한 줄 전송 (data: ...\n\n 형식으로 호출 측에서 조합 가능) */
  write: (data: string) => void;
  /** 정상 종료 */
  end: () => void;
  /** 오류 종료 */
  error: (err: Error) => void;
}

/**
 * 챗봇 서비스
 * - POST /chatbot/messages: Kafka로 요청 전달 (Consumer에서 GPT 호출·ChatbotLog 저장)
 *   - SSE 스트리밍: Kafka 발행 후 Redis 구독으로 Consumer가 보낸 청크/종료를 클라이언트에 전달
 * - GET /chatbot/conversations: 해당 유저의 대화 목록(conversationId) 조회
 * - GET /chatbot/conversations/:id: MongoDB에서 대화 히스토리 조회 (추천 레시피는 ID 배열만 반환)
 */
@Injectable()
export class ChatbotService {
  private readonly logger = new Logger(ChatbotService.name);

  constructor(
    private readonly kafkaProducer: KafkaProducerService,
    private readonly redisService: RedisService,
    private readonly chatbotLogRepository: ChatbotLogRepository,
  ) {}

  /**
   * 사용자 메시지를 Kafka(chatbot-requests)로 발행하고, 접수 응답을 반환한다.
   * 실제 AI 응답은 Consumer가 처리 후 MongoDB에 저장되며, GET /conversations/:id로 조회 가능.
   */
  async sendMessage(userId: number, dto: SendMessageDto): Promise<ChatbotResponseDto> {
    const conversationId =
      dto.conversationId ?? `conv_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
    const sessionId = conversationId;

    const event: ChatbotRequestEvent = {
      userId,
      message: dto.message,
      conversationId,
      sessionId,
      timestamp: new Date().toISOString(),
    };

    await this.kafkaProducer.emit(
      KAFKA_TOPICS.CHATBOT_REQUESTS,
      event,
      `user_${userId}`,
    );

    return {
      conversationId,
      message:
        '요청을 접수했습니다. 잠시 후 대화 내역을 조회해 주세요.',
      suggestedRecipes: null,
    };
  }

  /**
   * SSE 스트리밍: Kafka에 이벤트 발행 후 Redis 채널 구독하여 Consumer가 보낸 청크/종료를
   * write/end/error 콜백으로 전달한다. 타임아웃 시 자동 종료.
   */
  async streamMessage(
    userId: number,
    dto: SendMessageDto,
    callbacks: StreamMessageCallbacks,
  ): Promise<void> {
    const streamChannelId = `stream_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
    const conversationId =
      dto.conversationId ?? `conv_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
    const sessionId = conversationId;
    const channel = getChatbotStreamChannel(streamChannelId);

    const event: ChatbotRequestEvent = {
      userId,
      message: dto.message,
      conversationId,
      sessionId,
      streamChannelId,
      timestamp: new Date().toISOString(),
    };

    await this.kafkaProducer.emit(
      KAFKA_TOPICS.CHATBOT_REQUESTS,
      event,
      `user_${userId}`,
    );

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let unsubscribe: (() => Promise<void>) | null = null;
    let ended = false;

    const finish = (fn: () => void) => {
      if (ended) return;
      ended = true;
      if (timeoutId) clearTimeout(timeoutId);
      unsubscribe?.().catch((err) => this.logger.warn('Unsubscribe error', err));
      fn();
    };

    timeoutId = setTimeout(() => {
      finish(() =>
        callbacks.error(new Error('스트림 응답 시간이 초과되었습니다.')),
      );
    }, STREAM_TIMEOUT_MS);

    unsubscribe = await this.redisService.subscribe(channel, (raw: string) => {
      try {
        const payload = JSON.parse(raw) as ChatbotStreamEvent;
        callbacks.write(raw);

        if (payload.type === 'done' || payload.type === 'error') {
          finish(() => {
            if (payload.type === 'error') {
              callbacks.error(new Error(payload.data.message));
            } else {
              callbacks.end();
            }
          });
        }
      } catch (err) {
        finish(() =>
          callbacks.error(
            err instanceof Error ? err : new Error(String(err)),
          ),
        );
      }
    });
  }

  /**
   * 해당 유저의 대화 목록을 조회한다 (conversationId + lastMessageAt, 최신 순, 커서 페이지네이션).
   */
  async getConversationList(
    userId: number,
    limit: number = 20,
    cursor?: string,
  ): Promise<ConversationListDto> {
    const { items, nextCursor } =
      await this.chatbotLogRepository.findConversationListByUserId(userId, {
        limit,
        cursor,
      });
    return {
      items: items.map((item) => ({
        conversationId: item.conversationId,
        lastMessageAt: new Date(item.lastMessageAt).toISOString(),
      })),
      nextCursor,
    };
  }

  /**
   * conversationId로 대화 히스토리를 조회한다 (MongoDB ChatbotLog). 본인 대화만 조회.
   * 추천 레시피는 ID 배열만 반환 (상세는 GET /api/v1/recipes/summaries 벌크 조회).
   */
  async getConversationHistory(
    userId: number,
    conversationId: string,
  ): Promise<ConversationHistoryDto | null> {
    const logs = await this.chatbotLogRepository.findByConversationId(
      conversationId,
      userId,
    );
    if (logs.length === 0) {
      return null;
    }

    const messages = logs.map((log) => {
      const raw = log as {
        role: string;
        message: string;
        createdAt?: Date;
        context?: { suggestedRecipeIds?: number[] };
      };
      const suggestedRecipeIds = raw.context?.suggestedRecipeIds ?? [];
      return {
        role: raw.role as 'user' | 'assistant' | 'system',
        message: raw.message,
        suggestedRecipeIds:
          suggestedRecipeIds.length > 0 ? suggestedRecipeIds : null,
        createdAt: raw.createdAt
          ? new Date(raw.createdAt).toISOString()
          : '',
      };
    });

    return {
      conversationId,
      messages,
    };
  }
}
