/**
 * Redis Pub/Sub 채널 상수
 * 챗봇 SSE 스트리밍: Producer가 구독하고, Consumer가 스트림 청크/종료 메시지를 발행한다.
 */

export const CHATBOT_STREAM_CHANNEL_PREFIX = 'chatbot:stream:';

/**
 * 스트림 채널 키 생성
 * @param streamChannelId 요청별 고유 ID (예: stream_xxx)
 */
export function getChatbotStreamChannel(streamChannelId: string): string {
  return `${CHATBOT_STREAM_CHANNEL_PREFIX}${streamChannelId}`;
}
