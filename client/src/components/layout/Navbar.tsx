"use client";

import { ArrowLeft, Heart, Plus, Share2 } from "lucide-react";

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

export type NavbarProps = Readonly<{
  className?: string;
  title: string;
  variant?: NavbarVariant;
  onBack?: () => void;
  onAdd?: () => void;
  onLike?: () => void;
  onShare?: () => void;
}>;

const spacer = (
  <span className="inline-block shrink-0" aria-hidden />
);

export function Navbar({
  className = "",
  title,
  variant = "Empty",
  onBack,
  onAdd,
  onLike,
  onShare,
}: NavbarProps) {
  const showTitle = variant === "Empty" || variant === "AddOnly";
  const showBack =
    (variant === "BackOnly" ||
      variant === "AddWithBack" ||
      variant === "EngageWithBack") &&
    onBack != null;

  const leading = showBack ? (
    <button
      type="button"
      className="touch-target-icon"
      aria-label="뒤로 가기"
      onClick={onBack}
    >
      <ArrowLeft className="size-6" strokeWidth={2} aria-hidden />
    </button>
  ) : (
    spacer
  );

  const right =
    variant === "AddOnly" || variant === "AddWithBack" ? (
      <button
        type="button"
        className="touch-target-icon"
        aria-label="추가"
        onClick={onAdd}
      >
        <Plus className="size-6" strokeWidth={2} aria-hidden />
      </button>
    ) : variant === "EngageWithBack" ? (
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="touch-target-icon"
          aria-label="좋아요"
          onClick={onLike}
        >
          <Heart className="size-6" strokeWidth={2} aria-hidden />
        </button>
        <button
          type="button"
          className="touch-target-icon"
          aria-label="공유"
          onClick={onShare}
        >
          <Share2 className="size-6" strokeWidth={2} aria-hidden />
        </button>
      </div>
    ) : (
      spacer
    );

  return (
    <header
      role="banner"
      className={`z-40 border-b border-border-subtle bg-surface ${className}`.trim()}
    >
      <div className="mx-auto grid h-12 w-full max-w-[1200px] grid-cols-[minmax(2.75rem,1fr)_auto_minmax(2.75rem,1fr)] items-center gap-2 px-2">
        <div className="flex justify-start">{leading}</div>

        {showTitle ? (
          <div className="flex min-w-0 max-w-[min(100vw-8rem,28rem)] items-center justify-center">
            <h1 className="font-logo! truncate text-center text-[20px] leading-[31px] font-extrabold text-text-primary">
              {title}
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
