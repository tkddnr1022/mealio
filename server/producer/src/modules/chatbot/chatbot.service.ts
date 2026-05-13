import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { KafkaProducerService } from '../../infrastructure/kafka/producer.service';
import {
  RedisService,
  KAFKA_TOPICS,
  getChatbotStreamChannel,
  CHATBOT_STREAM_EVENT_TYPES,
  ChatbotEventType,
  type ChatbotRequestEvent,
  type ChatbotStreamEvent,
} from '@mealio/shared';
import type { SendMessageDto } from './dto/send-message.dto';
import { ChatbotLogRepository } from '../../infrastructure/database/repositories/mongodb/chatbot-log.repository';
import { ChatbotConversationRepository } from '../../infrastructure/database/repositories/mongodb/chatbot-conversation.repository';
import { UserRepository } from '../../infrastructure/database/repositories/postgresql/user.repository';
import type { ConversationHistoryDto } from './dto/conversation-history.dto';
import type { SuggestedRecipeSummary } from '@mealio/shared';
import type { ConversationListDto } from './dto/conversation-list.dto';

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
 * - GET /chatbot/conversations/:id: MongoDB에서 대화 히스토리 조회 (추천 레시피는 요약 배열 반환)
 */
@Injectable()
export class ChatbotService {
  private readonly logger = new Logger(ChatbotService.name);

  constructor(
    private readonly kafkaProducer: KafkaProducerService,
    private readonly redisService: RedisService,
    private readonly chatbotLogRepository: ChatbotLogRepository,
    private readonly chatbotConversationRepository: ChatbotConversationRepository,
    private readonly userRepository: UserRepository,
  ) {}

  /**
   * SSE 스트리밍: Kafka에 이벤트 발행 후 Redis 채널 구독하여 Consumer가 보낸 청크/종료를
   * write/end/error 콜백으로 전달한다. 타임아웃 시 자동 종료.
   */
  async streamMessage(
    userId: number,
    dto: SendMessageDto,
    callbacks: StreamMessageCallbacks,
  ): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      callbacks.error(new Error('사용자를 찾을 수 없습니다.'));
      return;
    }
    if (user.creditBalance <= 0) {
      callbacks.error(new Error('크레딧이 부족합니다.'));
      return;
    }

    const streamChannelId = `stream_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
    const conversationId =
      dto.conversationId ??
      `conv_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
    const channel = getChatbotStreamChannel(streamChannelId);

    const type = dto.conversationId
      ? ChatbotEventType.MESSAGE
      : ChatbotEventType.START;

    const event: ChatbotRequestEvent = {
      userId,
      message: dto.message,
      type,
      conversationId,
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
      unsubscribe?.().catch((err) =>
        this.logger.warn('Unsubscribe error', err),
      );
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

        if (
          payload.type === CHATBOT_STREAM_EVENT_TYPES.DONE ||
          payload.type === CHATBOT_STREAM_EVENT_TYPES.ERROR
        ) {
          finish(() => {
            if (payload.type === CHATBOT_STREAM_EVENT_TYPES.ERROR) {
              callbacks.error(new Error(payload.data.message));
            } else {
              callbacks.end();
            }
          });
        }
      } catch (err) {
        finish(() =>
          callbacks.error(err instanceof Error ? err : new Error(String(err))),
        );
      }
    });
  }

  /**
   * 해당 유저의 대화 목록을 조회한다 (메타 `updatedAt` 기준 최신 순, 커서 페이지네이션).
   */
  async getConversationList(
    userId: number,
    limit: number = 20,
    cursor?: string,
  ): Promise<ConversationListDto> {
    const { items, nextCursor } =
      await this.chatbotConversationRepository.findConversationListByUserId(
        userId,
        {
          limit,
          cursor,
        },
      );
    return {
      items: items.map((item) => ({
        conversationId: item.conversationId,
        title: item.title,
        updatedAt: item.updatedAt.toISOString(),
      })),
      nextCursor,
    };
  }

  /**
   * conversationId로 대화 히스토리를 조회한다 (MongoDB ChatbotLog). 본인 대화만 조회.
   * 추천 레시피는 `SuggestedRecipeSummary` 형태의 배열로 반환한다.
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

    const meta =
      await this.chatbotConversationRepository.findMetaByConversationId(
        userId,
        conversationId,
      );
    const title = meta?.title ?? null;

    const messages = logs.map((log) => {
      const raw = log as {
        role: string;
        message: string;
        createdAt?: Date;
        context?: { suggestedRecipes?: SuggestedRecipeSummary[] };
      };
      const suggestedRecipes = raw.context?.suggestedRecipes;
      return {
        role: raw.role as 'user' | 'assistant' | 'system',
        message: raw.message,
        suggestedRecipes:
          suggestedRecipes && suggestedRecipes.length > 0
            ? suggestedRecipes.map((r) => ({
                id: r.id,
                title: r.title,
                categoryId: r.categoryId,
                categoryName: r.categoryName,
                imageUrl: r.imageUrl ?? null,
              }))
            : null,
        createdAt: raw.createdAt ? new Date(raw.createdAt).toISOString() : '',
      };
    });

    return {
      conversationId,
      title,
      messages,
    };
  }
}
