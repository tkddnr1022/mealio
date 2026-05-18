/** 대화 목록 커서 구분자 (`updatedAt::conversationId`) */
export const CONVERSATION_LIST_CURSOR_SEPARATOR = '::';

export interface ConversationListCursor {
  updatedAt: Date;
  /** 복합 커서. 없으면 레거시(날짜만) 커서 */
  conversationId?: string;
}

/**
 * 대화 목록 nextCursor / cursor 쿼리 파싱.
 * - 복합: `{iso}::{conversationId}`
 * - 레거시: ISO 날짜 문자열만 (하위 호환)
 */
export function parseConversationListCursor(
  raw: string,
): ConversationListCursor | null {
  if (typeof raw !== 'string') {
    return null;
  }
  const value = raw.trim();
  if (value.length === 0) {
    return null;
  }

  if (value.includes(CONVERSATION_LIST_CURSOR_SEPARATOR)) {
    const sepIndex = value.indexOf(CONVERSATION_LIST_CURSOR_SEPARATOR);
    const datePart = value.slice(0, sepIndex);
    const conversationId = value.slice(
      sepIndex + CONVERSATION_LIST_CURSOR_SEPARATOR.length,
    );
    if (!datePart || !conversationId) {
      return null;
    }
    const updatedAt = new Date(datePart);
    if (Number.isNaN(updatedAt.getTime())) {
      return null;
    }
    return { updatedAt, conversationId };
  }

  const updatedAt = new Date(value);
  if (Number.isNaN(updatedAt.getTime())) {
    return null;
  }
  return { updatedAt };
}

export function encodeConversationListCursor(
  updatedAt: Date,
  conversationId: string,
): string {
  return `${updatedAt.toISOString()}${CONVERSATION_LIST_CURSOR_SEPARATOR}${conversationId}`;
}
