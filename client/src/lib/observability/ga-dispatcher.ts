'use client';

import { sendGAEvent } from '@next/third-parties/google';
import type { AnalyticsDispatcher, AnalyticsPayload } from './analytics';

/**
 * GA4(gtag)용 analytics dispatcher.
 *
 * 스크립트 로딩은 루트 레이아웃의 `GoogleAnalytics` 컴포넌트(@next/third-parties)가 담당하며,
 * 본 디스패처는 `sendGAEvent`를 통해 dataLayer에 커스텀 이벤트를 푸시한다.
 * page_view는 `GoogleAnalytics` + Enhanced Measurement가 자동 처리하므로 여기서 전송하지 않는다.
 */
export function createGa4Dispatcher(): AnalyticsDispatcher {
  return (payload: AnalyticsPayload) => {
    if (payload.type === 'page_view') return;
    try {
      sendGAEvent('event', payload.name, payload.props ?? {});
    } catch {
      // GA 전송 실패는 앱 흐름을 막지 않는다
    }
  };
}
