import type { Metadata, Viewport } from 'next';
import { Geist_Mono, Noto_Sans_KR, Plus_Jakarta_Sans } from 'next/font/google';
import { GoogleAnalytics } from '@next/third-parties/google';
import { AnalyticsAuthSync } from '@/components/observability/AnalyticsAuthSync';
import { ObservabilityBootstrap } from '@/components/observability/ObservabilityBootstrap';
import { AppRootFrame } from '@/components/layout/AppRootFrame';
import { AuthProvider } from '@/lib/auth/auth-context';
import { getMetadataBase } from '@/lib/config/app.config';
import {
  APP_BRAND_NAME,
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  THEME_COLOR,
} from '@/lib/constants/app.constants';
import { env } from '@/lib/config/env';
import { AppQueryClientProvider } from '@/lib/queries/query-client.provider';
import { ToastProvider } from '@/lib/toast';
import './globals.css';

const notoSansKr = Noto_Sans_KR({
  variable: '--font-noto-sans-kr',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: '--font-plus-jakarta-sans',
  subsets: ['latin'],
  weight: ['800'],
  display: 'swap',
});

export const viewport: Viewport = {
  themeColor: THEME_COLOR,
};

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: {
    default: APP_BRAND_NAME,
    template: `%s | ${APP_BRAND_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: APP_BRAND_NAME,
  keywords: [...SITE_KEYWORDS],
  authors: [{ name: APP_BRAND_NAME }],
  creator: APP_BRAND_NAME,
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: '/',
    siteName: APP_BRAND_NAME,
    title: APP_BRAND_NAME,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: '/android-chrome-512x512.png',
        width: 512,
        height: 512,
        alt: APP_BRAND_NAME,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: APP_BRAND_NAME,
    description: SITE_DESCRIPTION,
    images: ['/android-chrome-512x512.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

/**
 * 루트 레이아웃(서버 컴포넌트). 전역 클라이언트 Provider는 아래 순서로 감싼다.
 *
 * `AppQueryClientProvider` → `ToastProvider` → `AuthProvider` → `AppRootFrame`
 * (쿼리 캐시 `onError` 시점에 Toast 브리지가 등록되도록 Query가 바깥에 있음)
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${notoSansKr.variable} ${geistMono.variable} ${plusJakartaSans.variable}`}
    >
      <body className="antialiased">
        <ObservabilityBootstrap />
        <AppQueryClientProvider>
          <ToastProvider>
            <AuthProvider>
              <AnalyticsAuthSync />
              <AppRootFrame>{children}</AppRootFrame>
            </AuthProvider>
          </ToastProvider>
        </AppQueryClientProvider>
      </body>
      {env.gaMeasurementId ? (
        <GoogleAnalytics gaId={env.gaMeasurementId} />
      ) : null}
    </html>
  );
}
