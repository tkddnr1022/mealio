import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ChatbotConversation,
  type ChatbotConversationDocument,
} from '@mealio/shared';
import {
  encodeConversationListCursor,
  parseConversationListCursor,
} from './conversation-list-cursor';

export interface ConversationMetaListItem {
  conversationId: string;
  title: string | null;
  updatedAt: Date;
}

/** 단건 대화 메타 (목록 항목과 동일 스키마 필드; 없으면 null) */
export interface ConversationMeta {
  conversationId: string;
  title: string | null;
  updatedAt: Date | null;
  titleSource: string | null;
}

@Injectable()
export class ChatbotConversationRepository {
  constructor(
    @InjectModel(ChatbotConversation.name)
    private readonly model: Model<ChatbotConversationDocument>,
  ) {}

  /**
   * 메타 컬렉션 기준 대화 목록 (정렬·커서: updatedAt + conversationId).
   * 과거 로그만 있고 메타가 없는 대화는 목록에 나오지 않는다.
   */
  async findConversationListByUserId(
    userId: number,
    params: { limit: number; cursor?: string },
  ): Promise<{
    items: ConversationMetaListItem[];
    nextCursor: string | null;
  }> {
    const limit = Number(params.limit);
    const { cursor } = params;
    const take = Math.min(limit + 1, 101);

    const filter: Record<string, unknown> = { userId };
    if (cursor) {
      const parsed = parseConversationListCursor(cursor);
      if (parsed) {
        if (parsed.conversationId) {
          filter.$or = [
            { updatedAt: { $lt: parsed.updatedAt } },
            {
              updatedAt: parsed.updatedAt,
              conversationId: { $lt: parsed.conversationId },
            },
          ];
        } else {
          filter.updatedAt = { $lt: parsed.updatedAt };
        }
      }
    }

    const docs = await this.model
      .find(filter)
      .sort({ updatedAt: -1, conversationId: -1 })
      .limit(take)
      .select('conversationId title updatedAt')
      .lean()
      .exec();

    const hasMore = docs.length > limit;
    const slice = hasMore ? docs.slice(0, limit) : docs;

    const items: ConversationMetaListItem[] = slice.map((d) => {
      const t = d.title;
      const title =
        typeof t === 'string' && t.trim().length > 0 ? t.trim() : null;
      const u = d.updatedAt;
      return {
        conversationId: d.conversationId,
        title,
        updatedAt: u instanceof Date ? u : new Date(u ?? 0),
      };
    });

    const lastItem = items[items.length - 1];
    const nextCursor =
      hasMore && lastItem
        ? encodeConversationListCursor(
            lastItem.updatedAt,
            lastItem.conversationId,
          )
        : null;

    return { items, nextCursor };
  }

  /**
   * 사용자 소유 단일 대화 메타 조회. 문서가 없으면 null.
   */
  async findMetaByConversationId(
    userId: number,
    conversationId: string,
  ): Promise<ConversationMeta | null> {
    const doc = await this.model
      .findOne({ userId, conversationId })
      .select('conversationId title titleSource updatedAt')
      .lean()
      .exec();
    if (!doc) {
      return null;
    }

    const rawTitle = doc.title;
    const title =
      typeof rawTitle === 'string' && rawTitle.trim().length > 0
        ? rawTitle.trim()
        : null;

    const u = doc.updatedAt;
    const updatedAt =
      u instanceof Date ? u : u != null ? new Date(u as string | number) : null;

    const ts = doc.titleSource;
    const titleSource =
      typeof ts === 'string' && ts.trim().length > 0 ? ts.trim() : null;

    return {
      conversationId: doc.conversationId,
      title,
      updatedAt,
      titleSource,
    };
  }
}
