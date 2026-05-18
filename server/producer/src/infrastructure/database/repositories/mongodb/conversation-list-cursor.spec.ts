import {
  CONVERSATION_LIST_CURSOR_SEPARATOR,
  encodeConversationListCursor,
  parseConversationListCursor,
} from './conversation-list-cursor';

describe('conversation-list-cursor', () => {
  const updatedAt = new Date('2025-01-24T00:00:00.000Z');
  const conversationId = 'conv_abc1234567890ab';

  describe('encodeConversationListCursor', () => {
    it('updatedAt와 conversationId를 구분자로 연결한다', () => {
      expect(encodeConversationListCursor(updatedAt, conversationId)).toBe(
        `2025-01-24T00:00:00.000Z${CONVERSATION_LIST_CURSOR_SEPARATOR}${conversationId}`,
      );
    });
  });

  describe('parseConversationListCursor', () => {
    it('복합 커서를 파싱한다', () => {
      const encoded = encodeConversationListCursor(updatedAt, conversationId);
      expect(parseConversationListCursor(encoded)).toEqual({
        updatedAt,
        conversationId,
      });
    });

    it('레거시 ISO 날짜만 커서를 파싱한다', () => {
      expect(parseConversationListCursor('2025-01-24T00:00:00.000Z')).toEqual({
        updatedAt,
      });
    });

    it('빈 문자열·잘못된 값은 null을 반환한다', () => {
      expect(parseConversationListCursor('')).toBeNull();
      expect(parseConversationListCursor('not-a-date')).toBeNull();
      expect(
        parseConversationListCursor('2025-01-24T00:00:00.000Z::'),
      ).toBeNull();
      expect(parseConversationListCursor('::conv_only')).toBeNull();
    });
  });
});
