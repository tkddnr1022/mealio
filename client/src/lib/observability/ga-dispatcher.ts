'use client';

import type { AnalyticsDispatcher, AnalyticsPayload } from './analytics';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

let gaScriptLoading: Promise<void> | null = null;

function loadGaScript(measurementId: string): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.gtag) return Promise.resolve();
  if (gaScriptLoading) return gaScriptLoading;

  gaScriptLoading = new Promise((resolve, reject) => {
    window.dataLayer = window.dataLayer ?? [];
    window.gtag = function gtag(...args: unknown[]) {
      window.dataLayer?.push(args);
    };
    window.gtag('js', new Date());
    window.gtag('config', measurementId, { send_page_view: false });

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load GA4 script'));
    document.head.appendChild(script);
  });

  return gaScriptLoading;
}

/**
 * GA4(gtag)용 analytics dispatcher.
 */
export function createGa4Dispatcher(measurementId: string): AnalyticsDispatcher {
  return (payload: AnalyticsPayload) => {
    void loadGaScript(measurementId)
      .then(() => {
        if (!window.gtag) return;
        if (payload.type === 'page_view') {
          window.gtag('event', 'page_view', {
            page_path: payload.path,
            page_location:
              typeof window !== 'undefined' ? window.location.href : payload.path,
            page_title: document.title,
            ...payload.params,
          });
          return;
        }
        window.gtag('event', payload.name, {
          ...payload.props,
          page_path: payload.path,
        });
      })
      .catch(() => {
        // GA 로드 실패는 앱 흐름을 막지 않는다
      });
  };
}
