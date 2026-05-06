'use client';

import Link from 'next/link';
import { AddButton } from '@/components/ui/buttons/AddButton';
import { BackButton } from '@/components/ui/buttons/BackButton';
import { LikeButton } from '@/components/ui/buttons/LikeButton';
import { ShareButton } from '@/components/ui/buttons/ShareButton';
import { cn } from '@/lib/utils/cn';

/**
 * - `Empty`: 우측 없음, 뒤로 없음 (`onBack` 무시)
 * - `AddOnly`: 우측 추가만, 뒤로 없음 (`onBack` 무시)
 * - `BackOnly`: 뒤로만 (`onBack` 있을 때)
 * - `AddWithBack`: 우측 추가 + `onBack` 있으면 뒤로
 * - `EngageWithBack`: 좋아요·공유 + `onBack` 있으면 뒤로
 */
export type NavbarVariant =
  | 'Empty'
  | 'AddOnly'
  | 'BackOnly'
  | 'AddWithBack'
  | 'EngageWithBack';

/** 상단 워드마크 — Figma 변수 `logo`와 동일하게 코드에서 고정 */
const NAVBAR_LOGO_TEXT = 'Coop' as const;
/** 로고 탭 시 앱 메인(레시피 탭)으로 이동 — 루트 `/` 리다이렉트와 동일 */
const NAVBAR_LOGO_HREF = '/recipe' as const;

export interface NavbarProps {
  className?: string;
  variant?: NavbarVariant;
  onBack?: () => void;
  onAdd?: () => void;
  onLike?: () => void;
  onShare?: () => void;
  /** `EngageWithBack` — 찜 여부(Figma LikeButton true/false) */
  isFavorite?: boolean;
}

const spacer = <span className="inline-block shrink-0" aria-hidden />;

export function Navbar({
  className = '',
  variant = 'Empty',
  onBack,
  onAdd,
  onLike,
  onShare,
  isFavorite = false,
}: NavbarProps) {
  const showTitle = variant === 'Empty' || variant === 'AddOnly';
  const showBack =
    (variant === 'BackOnly' ||
      variant === 'AddWithBack' ||
      variant === 'EngageWithBack') &&
    onBack != null;

  const leading = showBack ? <BackButton onClick={onBack} /> : spacer;

  const right =
    variant === 'AddOnly' || variant === 'AddWithBack' ? (
      <AddButton onClick={onAdd} />
    ) : variant === 'EngageWithBack' ? (
      <div className="flex items-center gap-2">
        <LikeButton isFavorite={isFavorite} onClick={onLike} />
        <ShareButton onClick={onShare} />
      </div>
    ) : (
      spacer
    );

  return (
    <header
      role="banner"
      className={cn(
        'z-40 border-b border-border-subtle bg-background-surface',
        className,
      )}
    >
      <div className="mx-auto grid h-12 w-full max-w-(--layout-content-max-width) grid-cols-[minmax(var(--spacing-11),1fr)_auto_minmax(var(--spacing-11),1fr)] items-center gap-2 px-2">
        <div className="flex justify-start">{leading}</div>

        {showTitle ? (
          <div className="flex min-w-0 max-w-[min(100vw-8rem,28rem)] items-center justify-center">
            <h1 className="typo-logo-small m-0 min-w-0 w-full text-center font-[inherit]">
              <Link
                href={NAVBAR_LOGO_HREF}
                className="block truncate text-center style-text-primary no-underline outline-none transition-colors focus-visible:outline-(length:--border-width-focus) focus-visible:outline-offset-2 focus-visible:outline-primary-default"
              >
                {NAVBAR_LOGO_TEXT}
              </Link>
            </h1>
          </div>
        ) : (
          <div aria-hidden />
        )}

        <div className="flex justify-end">{right}</div>
      </div>
    </header>
  );
}
