import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ChatbotConversation,
  type ChatbotConversationDocument,
} from '@mealio/shared';

const TITLE_MAX_LENGTH = 120;

@Injectable()
export class ChatbotConversationRepository {
  constructor(
    @InjectModel(ChatbotConversation.name)
    private readonly model: Model<ChatbotConversationDocument>,
  ) {}

  async hasTitle(userId: number, conversationId: string): Promise<boolean> {
    const doc = await this.model
      .findOne({ userId, conversationId })
      .select('title')
      .lean()
      .exec();
    const t = doc?.title;
    return typeof t === 'string' && t.trim().length > 0;
  }

  /**
   * 대화 메타를 만든다: 동일 (userId, conversationId) 문서가 없으면 **생성**한다.
   * `touchUpdatedAt` 등으로 제목 없는 행만 있는 경우에는 제목만 채운다.
   * 이미 비어 있지 않은 제목이 있으면 변경하지 않는다.
   */
  async createWithTitle(
    userId: number,
    conversationId: string,
    title: string,
    titleSource: 'llm' | 'manual' = 'llm',
  ): Promise<void> {
    const trimmed = title.trim().slice(0, TITLE_MAX_LENGTH);
    if (!trimmed) return;

    const existing = await this.model
      .findOne({ userId, conversationId })
      .select('title')
      .lean()
      .exec();

    if (!existing) {
      await this.model.create({
        userId,
        conversationId,
        title: trimmed,
        titleSource,
      });
      return;
    }

    const t = existing.title;
    if (typeof t === 'string' && t.trim().length > 0) {
      return;
    }

    await this.model
      .updateOne(
        { userId, conversationId },
        { $set: { title: trimmed, titleSource } },
      )
      .exec();
  }

  /**
   * 대화 활동 시각 갱신(메타 행이 없으면 제목 없이 생성).
   * 목록 정렬은 이 컬렉션의 updatedAt를 사용한다.
   */
  async touchUpdatedAt(userId: number, conversationId: string): Promise<void> {
    if (!conversationId || conversationId === 'unknown') {
      return;
    }
    const now = new Date();
    await this.model
      .updateOne(
        { userId, conversationId },
        {
          $set: { updatedAt: now },
          $setOnInsert: {
            userId,
            conversationId,
            createdAt: now,
          },
        },
        { upsert: true },
      )
      .exec();
  }

  async getLastResponseId(
    userId: number,
    conversationId: string,
  ): Promise<string | undefined> {
    if (!conversationId || conversationId === 'unknown') {
      return undefined;
    }
    const doc = await this.model
      .findOne({ userId, conversationId })
      .select('lastResponseId')
      .lean()
      .exec();
    const id = doc?.lastResponseId;
    return typeof id === 'string' && id.length > 0 ? id : undefined;
  }

  /**
   * Responses API 체이닝용 lastResponseId 저장(메타 행이 없으면 생성).
   */
  async saveLastResponseId(
    userId: number,
    conversationId: string,
    responseId: string,
  ): Promise<void> {
    if (!conversationId || conversationId === 'unknown' || !responseId) {
      return;
    }
    const now = new Date();
    await this.model
      .updateOne(
        { userId, conversationId },
        {
          $set: { lastResponseId: responseId, updatedAt: now },
          $setOnInsert: {
            userId,
            conversationId,
            createdAt: now,
          },
        },
        { upsert: true },
      )
      .exec();
  }
}
