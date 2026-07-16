import { Injectable, Logger } from '@nestjs/common';
import { ChatbotEventType } from '@mealio/shared';
import { OpenAIService } from 'src/integrations/openai/openai.service';
import { ChatbotConversationRepository } from 'src/persistence/repositories/mongodb/chatbot-conversation.repository';

/** LLM 입력 길이 상한 (제목 생성에는 사용자 질문만 사용) */
const USER_MESSAGE_MAX = 2000;

/**
 * 챗봇 턴 성공 후 `chatbot_conversations` 메타를 동기화한다.
 * - `chatbot.start`: 사용자 질문으로 LLM 제목 생성 후 메타 생성(`createWithTitle`)
 * - `chatbot.message`: 마지막 활동 시각 갱신(`touchUpdatedAt`)
 */
@Injectable()
export class SyncConversationMetaHandler {
  private readonly logger = new Logger(SyncConversationMetaHandler.name);

  constructor(
    private readonly openai: OpenAIService,
    private readonly conversations: ChatbotConversationRepository,
  ) {}

  async execute(params: {
    userId: number;
    conversationId: string;
    userMessage: string;
    eventType: ChatbotEventType;
  }): Promise<void> {
    const { userId, conversationId, userMessage, eventType } = params;

    if (!conversationId || conversationId === 'unknown') {
      return;
    }

    if (eventType === ChatbotEventType.MESSAGE) {
      await this.conversations.touchUpdatedAt(userId, conversationId);
      return;
    }

    if (eventType === ChatbotEventType.START) {
      await this.syncNewConversationMeta(userId, conversationId, userMessage);
    }
  }

  private async syncNewConversationMeta(
    userId: number,
    conversationId: string,
    userMessage: string,
  ): Promise<void> {
    if (!(await this.shouldCreateTitle(userId, conversationId))) {
      return;
    }

    const question = userMessage.trim().slice(0, USER_MESSAGE_MAX);
    if (!question) {
      return;
    }

    try {
      const title = await this.generateTitle(question);
      if (!title) {
        return;
      }

      await this.conversations.createWithTitle(
        userId,
        conversationId,
        title,
        'llm',
      );
    } catch (err) {
      this.logger.warn(
        `대화 메타 저장 실패 conversationId=${conversationId}`,
        err instanceof Error ? err.stack : err,
      );
    }
  }

  private async generateTitle(question: string): Promise<string | null> {
    const { content } = await this.openai.createResponse(
      [{ role: 'user', content: question }],
      {
        instructions:
          'You write titles for cooking and ingredient assistant conversations. The text below is the user question/request. ' +
          'Summarize the conversation topic as a single-line Korean title. Output the title only. ' +
          'Keep it short (within 60 characters), with no quotes, line breaks, or emoji. No explanations or prefixes.',
        maxOutputTokens: 80,
      },
    );

    const title =
      typeof content === 'string' ? content.replace(/\s+/g, ' ').trim() : '';
    return title.length > 0 ? title : null;
  }

  private async shouldCreateTitle(
    userId: number,
    conversationId: string,
  ): Promise<boolean> {
    if (await this.conversations.hasTitle(userId, conversationId)) {
      return false;
    }
    return true;
  }
}
