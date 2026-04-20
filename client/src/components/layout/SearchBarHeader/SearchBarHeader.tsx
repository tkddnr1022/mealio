"use client";

import {
  forwardRef,
  type HTMLAttributes,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import { cn } from "@/lib/utils/cn";
import { SearchBarProps, SearchBar } from "@/components/ui/SearchBar";

export type SearchBarHeaderProps = Readonly<
  Omit<
    HTMLAttributes<HTMLDivElement>,
    "onClick" | "role" | "tabIndex" | "children"
  > & {
    /** 헤더(표면·패딩·그림자) 래퍼 클래스 */
    className?: string;
    /** SearchBar pill에 전달할 추가 클래스 */
    searchBarClassName?: string;
    /** SearchBar에 그대로 전달 (readOnly·tabIndex는 헤더가 덮어씀) */
    searchBarProps?: Omit<SearchBarProps, "readOnly" | "tabIndex">;
    disabled?: boolean;
    onClick?: (e: MouseEvent<HTMLDivElement>) => void;
  }
>;

export const SearchBarHeader = forwardRef<HTMLDivElement, SearchBarHeaderProps>(
  function SearchBarHeader(
    {
      className = "",
      searchBarClassName = "",
      searchBarProps,
      disabled = false,
      onClick,
      onKeyDown,
      ...rest
    },
    ref
  ) {
    const placeholder =
      searchBarProps?.placeholder ?? "검색어를 입력해 주세요";
    const ariaLabel = searchBarProps?.["aria-label"] ?? placeholder;
    const isDisabled = disabled || !!searchBarProps?.disabled;

    const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
      onKeyDown?.(e);
      if (e.defaultPrevented || isDisabled) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onClick?.(e as unknown as MouseEvent<HTMLDivElement>);
      }
    };

    /** 트리거 pill 배경·호버(Figma 헤더 검색) — SearchBar·Input과 동일 토큰 */
    const headerSearchBarSurfaceClassName = cn(
      "bg-background",
      "transition-shadow",
      "hover:bg-toggle-unselected-hover",
      searchBarProps?.wrapperClassName,
      searchBarClassName,
    );

    return (
      <div
        ref={ref}
        className={cn(
          "flex w-full flex-col items-stretch bg-surface px-4 py-3 shadow-sm",
          className,
        )}
        {...rest}
      >
        <div
          role="button"
          tabIndex={isDisabled ? -1 : 0}
          aria-label={ariaLabel}
          aria-disabled={isDisabled || undefined}
          className={cn(
            "w-full rounded-full outline-none transition-shadow focus-visible:ring-(length:--border-width-focus) focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            isDisabled ? "pointer-events-none cursor-not-allowed" : "cursor-pointer",
          )}
          onClick={isDisabled ? undefined : onClick}
          onKeyDown={handleKeyDown}
        >
          <SearchBar
            {...searchBarProps}
            readOnly
            tabIndex={-1}
            disabled={isDisabled}
            wrapperClassName={headerSearchBarSurfaceClassName}
          />
        </div>
      </div>
    );
  },
);
