'use client';

import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';

import { MainContent } from '@/components/layout/MainContent';
import { Navbar } from '@/components/layout/Navbar';

export interface LegalDocumentViewProps {
  title: string;
  /** 예: `2026년 7월 23일` */
  effectiveDate?: string;
  children: ReactNode;
}

export interface LegalSectionProps {
  title: string;
  children: ReactNode;
}

/** 법적 고지·약관 본문의 조항 블록 */
export function LegalSection({ title, children }: LegalSectionProps) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="typo-h3 style-text-primary m-0">{title}</h2>
      <div className="flex flex-col gap-2 typo-body-regular style-text-primary">
        {children}
      </div>
    </section>
  );
}

/**
 * 이용약관·개인정보 처리방침·도움말 등 텍스트 중심 페이지 셸.
 * Navbar: 로고 숨김, 뒤로가기 표시.
 */
export function LegalDocumentView({
  title,
  effectiveDate,
  children,
}: LegalDocumentViewProps) {
  const router = useRouter();

  return (
    <>
      <Navbar
        displayTitle={false}
        displayBackButton
        onBack={() => router.back()}
      />
      <MainContent>
        <article className="flex w-full flex-col gap-6">
          <header className="flex flex-col gap-2">
            <h1 className="typo-h2 style-text-primary m-0">{title}</h1>
            {effectiveDate ? (
              <p className="typo-caption-regular style-text-secondary m-0">
                시행일: {effectiveDate}
              </p>
            ) : null}
          </header>
          {children}
        </article>
      </MainContent>
    </>
  );
}
