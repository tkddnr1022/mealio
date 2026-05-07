'use client';

import Link from 'next/link';
import { type ReactNode } from 'react';
import { BackButton } from '@/components/ui/buttons/BackButton';
import { cn } from '@/lib/utils/cn';

/** 상단 워드마크 — Figma 변수 `logo`와 동일하게 코드에서 고정 */
const NAVBAR_LOGO_TEXT = 'Coop' as const;
/** 로고 탭 시 앱 메인(레시피 탭)으로 이동 — 루트 `/` 리다이렉트와 동일 */
const NAVBAR_LOGO_HREF = '/recipe' as const;

export interface NavbarProps {
  className?: string;
  /** Figma AdditionalButtonContainer 슬롯 */
  additionalButtons?: ReactNode;
  /** 명시하지 않으면 false */
  displayBackButton?: boolean;
  onBack?: () => void;
  /** 명시하지 않으면 true */
  displayTitle?: boolean;
}

export function Navbar({
  className = '',
  additionalButtons,
  displayBackButton,
  displayTitle,
  onBack,
}: NavbarProps) {
  const showTitle = displayTitle ?? true;
  const showBack = displayBackButton ?? false;
  const right = additionalButtons ?? null;

  return (
    <header
      role="banner"
      className={cn(
        'z-40 border-b border-border-subtle bg-background-surface',
        className,
      )}
    >
      <div className="mx-auto h-12 w-full max-w-(--layout-content-max-width) px-2">
        <div className="relative flex h-full items-center justify-center">
          {showBack && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2">
              <BackButton onClick={onBack} />
            </div>
          )}

          {showTitle ? (
            <h1 className="typo-logo-small m-0 min-w-0 max-w-[min(100vw-8rem,28rem)] text-center">
              <Link
                href={NAVBAR_LOGO_HREF}
                className="block truncate style-text-primary no-underline outline-none transition-colors focus-visible:outline-(length:--border-width-focus) focus-visible:outline-offset-2 focus-visible:outline-primary-default"
              >
                {NAVBAR_LOGO_TEXT}
              </Link>
            </h1>
          ) : null}

          {right != null && (
            <div className="absolute right-0 top-1/2 -translate-y-1/2">
              <div className="flex items-center">{right}</div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
