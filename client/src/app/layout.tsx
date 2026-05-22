import type { Metadata, Viewport } from 'next';
import { Geist_Mono, Noto_Sans_KR, Plus_Jakarta_Sans } from 'next/font/google';
import { Suspense } from 'react';
import { AnalyticsAuthSync } from '@/components/observability/AnalyticsAuthSync';
import { ObservabilityBootstrap } from '@/components/observability/ObservabilityBootstrap';
import { AppRootFrame } from '@/components/layout/AppRootFrame';
import { AuthProvider } from '@/lib/auth/auth-context';
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

const siteName = 'Mealio';
const siteDescription =
  '보유 재료와 취향에 맞춘 AI 레시피 추천. 재료·관심 항목 관리, 레시피 검색, 맞춤 추천 챗봇을 제공합니다.';

function getMetadataBase(): URL {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) {
    try {
      return new URL(explicit);
    } catch {
      /* fallthrough: invalid URL ignored */
    }
  }
  if (process.env.VERCEL_URL) {
    return new URL(`https://${process.env.VERCEL_URL}`);
  }
  return new URL('http://localhost:3000');
}

const themeColor = '#c2410c';

export const viewport: Viewport = {
  themeColor,
};

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: {
    default: siteName,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  applicationName: siteName,
  keywords: [
    'Mealio',
    '밀리오',
    '레시피',
    'AI 레시피',
    '맞춤 레시피',
    '재료 관리',
    '요리',
  ],
  authors: [{ name: siteName }],
  creator: siteName,
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
    siteName,
    title: siteName,
    description: siteDescription,
    images: [
      {
        url: '/android-chrome-512x512.png',
        width: 512,
        height: 512,
        alt: siteName,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteName,
    description: siteDescription,
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
        <Suspense fallback={null}>
          <ObservabilityBootstrap />
        </Suspense>
        <AppQueryClientProvider>
          <ToastProvider>
            <AuthProvider>
              <AnalyticsAuthSync />
              <AppRootFrame>{children}</AppRootFrame>
            </AuthProvider>
          </ToastProvider>
        </AppQueryClientProvider>
      </body>
    </html>
  );
}
