"use client";

import {
  forwardRef,
  type HTMLAttributes,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import { SearchBarProps, SearchBar } from "./SearchBar";

export type SearchBarHeaderProps = Readonly<
  Omit<
    HTMLAttributes<HTMLDivElement>,
    "onClick" | "role" | "tabIndex" | "children"
  > & {
    /** 헤더(표면·패딩·그림자) 래퍼 클래스 */
    className?: string;
    /** SearchBar pill에 전달할 클래스 (호버 배경은 기본 포함) */
    searchBarClassName?: string;
    /** SearchBar에 그대로 전달 (mode·readOnly·tabIndex는 컴포넌트가 덮어씀) */
    searchBarProps?: Omit<SearchBarProps, "mode" | "readOnly" | "tabIndex">;
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
      searchBarProps?.placeholder ?? "레시피 검색하기";
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

    const mergedWrapperClass = `bg-background transition-shadow hover:bg-placeholder-surface ${searchBarProps?.wrapperClassName ?? ""} ${searchBarClassName}`.trim();

    return (
      <div
        ref={ref}
        className={`flex w-full flex-col items-stretch bg-surface px-4 py-3 shadow-sm ${className}`.trim()}
        {...rest}
      >
        <div
          role="button"
          tabIndex={isDisabled ? -1 : 0}
          aria-label={ariaLabel}
          aria-disabled={isDisabled || undefined}
          className={`w-full rounded-full outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background ${isDisabled ? "pointer-events-none cursor-not-allowed" : "cursor-pointer"}`.trim()}
          onClick={isDisabled ? undefined : onClick}
          onKeyDown={handleKeyDown}
        >
          <SearchBar
            {...searchBarProps}
            mode="button"
            readOnly
            tabIndex={-1}
            disabled={isDisabled}
            wrapperClassName={mergedWrapperClass}
          />
        </div>
      </div>
    );
  },
);
