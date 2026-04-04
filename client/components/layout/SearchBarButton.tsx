"use client";

import {
  forwardRef,
  type HTMLAttributes,
  type KeyboardEvent,
  type MouseEvent,
} from "react";

import { SearchBar, type SearchBarProps } from "./SearchBar";

export type SearchBarButtonProps = Readonly<
  Omit<
    HTMLAttributes<HTMLDivElement>,
    "onClick" | "role" | "tabIndex" | "children"
  > & {
    /** 카드(표면·패딩·그림자) 래퍼 클래스 */
    className?: string;
    /** SearchBar 루트에 전달할 클래스 (호버 pill 스타일은 기본 포함) */
    searchBarClassName?: string;
    /** SearchBar에 그대로 전달 (readOnly·tabIndex는 컴포넌트가 덮어씀) */
    searchBarProps?: Omit<SearchBarProps, "readOnly" | "tabIndex">;
    disabled?: boolean;
    onClick?: (e: MouseEvent<HTMLDivElement>) => void;
  }
>;

export const SearchBarButton = forwardRef<HTMLDivElement, SearchBarButtonProps>(
  function SearchBarButton(
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

    const mergedWrapperClass = `pointer-events-none bg-background transition-shadow group-hover:bg-placeholder-surface ${searchBarProps?.wrapperClassName ?? ""} ${searchBarClassName}`.trim();

    return (
      <div
        ref={ref}
        role="button"
        tabIndex={isDisabled ? -1 : 0}
        aria-label={ariaLabel}
        aria-disabled={isDisabled || undefined}
        className={`group bg-surface px-4 py-3 shadow-sm outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background ${isDisabled ? "pointer-events-none cursor-not-allowed" : "cursor-pointer"} ${className}`.trim()}
        onClick={isDisabled ? undefined : onClick}
        onKeyDown={handleKeyDown}
        {...rest}
      >
        <SearchBar
          {...searchBarProps}
          readOnly
          tabIndex={-1}
          disabled={isDisabled}
          wrapperClassName={mergedWrapperClass}
        />
      </div>
    );
  },
);
