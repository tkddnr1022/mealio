"use client";

import { AddButton } from "@/components/ui/AddButton";
import { BackButton } from "@/components/ui/BackButton";
import { LikeButton } from "@/components/ui/LikeButton";
import { ShareButton } from "@/components/ui/ShareButton";

/**
 * - `Empty`: 우측 없음, 뒤로 없음 (`onBack` 무시)
 * - `AddOnly`: 우측 추가만, 뒤로 없음 (`onBack` 무시)
 * - `BackOnly`: 뒤로만 (`onBack` 있을 때)
 * - `AddWithBack`: 우측 추가 + `onBack` 있으면 뒤로
 * - `EngageWithBack`: 좋아요·공유 + `onBack` 있으면 뒤로
 */
export type NavbarVariant =
  | "Empty"
  | "AddOnly"
  | "BackOnly"
  | "AddWithBack"
  | "EngageWithBack";

/** 상단 워드마크 — Figma 변수 `logo`와 동일하게 코드에서 고정 */
const NAVBAR_LOGO_TEXT = "Coop" as const;

export type NavbarProps = Readonly<{
  className?: string;
  variant?: NavbarVariant;
  onBack?: () => void;
  onAdd?: () => void;
  onLike?: () => void;
  onShare?: () => void;
  /** `EngageWithBack` — 찜 여부(Figma LikeButton true/false) */
  isFavorite?: boolean;
}>;

const spacer = (
  <span className="inline-block shrink-0" aria-hidden />
);

export function Navbar({
  className = "",
  variant = "Empty",
  onBack,
  onAdd,
  onLike,
  onShare,
  isFavorite = false,
}: NavbarProps) {
  const showTitle = variant === "Empty" || variant === "AddOnly";
  const showBack =
    (variant === "BackOnly" ||
      variant === "AddWithBack" ||
      variant === "EngageWithBack") &&
    onBack != null;

  const leading = showBack ? (
    <BackButton onClick={onBack} />
  ) : (
    spacer
  );

  const right =
    variant === "AddOnly" || variant === "AddWithBack" ? (
      <AddButton onClick={onAdd} />
    ) : variant === "EngageWithBack" ? (
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
      className={`z-40 border-b border-border-subtle bg-surface ${className}`.trim()}
    >
      <div className="mx-auto grid h-12 w-full max-w-[var(--layout-content-max-width)] grid-cols-[minmax(var(--spacing-11),1fr)_auto_minmax(var(--spacing-11),1fr)] items-center gap-2 px-2">
        <div className="flex justify-start">{leading}</div>

        {showTitle ? (
          <div className="flex min-w-0 max-w-[min(100vw-8rem,28rem)] items-center justify-center">
            <h1 className="typography-logo-small truncate text-center text-text-primary">
              {NAVBAR_LOGO_TEXT}
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
