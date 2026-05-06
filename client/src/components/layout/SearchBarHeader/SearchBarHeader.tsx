"use client";

import Link from "next/link";
import {
  forwardRef,
  type HTMLAttributes,
} from "react";
import { cn } from "@/lib/utils/cn";
import { buildAriaLabel } from "@/lib/utils/a11y";
import { SearchBarProps, SearchBar } from "@/components/ui/SearchBar";

export interface SearchBarHeaderProps extends Omit<
    HTMLAttributes<HTMLDivElement>,
    "children" | "onClick"
  > {
className?: string;
searchBarClassName?: string;
searchBarProps?: Omit<SearchBarProps, "readOnly" | "tabIndex">;
disabled?: boolean;
href?: string;
}

export const SearchBarHeader = forwardRef<HTMLDivElement, SearchBarHeaderProps>(
  function SearchBarHeader(
    {
      className = "",
      searchBarClassName = "",
      searchBarProps,
      disabled = false,
      href = "/recipe/search",
      ...rest
    },
    ref
  ) {
    const placeholder = searchBarProps?.placeholder ?? "레시피 검색하기";
    const openSearchLabel = buildAriaLabel("link", placeholder);
    const isDisabled = disabled || !!searchBarProps?.disabled;

    /** 트리거 pill 배경·호버(Figma 헤더 검색) — SearchBar·Input과 동일 토큰 */
    const headerSearchBarSurfaceClassName = cn(
      "bg-background-primary",
      "transition-shadow",
      "hover:bg-toggle-unselected-hover",
      searchBarProps?.wrapperClassName,
      searchBarClassName,
    );

    return (
      <div
        ref={ref}
        className={cn(
          "flex w-full flex-col items-stretch bg-background-surface px-4 py-3 shadow-sm",
          className,
        )}
        {...rest}
      >
        <Link
          href={href}
          aria-label={openSearchLabel}
          aria-disabled={isDisabled || undefined}
          className={cn(
            "w-full rounded-full outline-none transition-shadow focus-visible:ring-(length:--border-width-focus) focus-visible:ring-primary-default focus-visible:ring-offset-2 focus-visible:ring-offset-background-primary",
            isDisabled ? "pointer-events-none cursor-not-allowed" : "cursor-pointer",
          )}
        >
          <SearchBar
            {...searchBarProps}
            readOnly
            tabIndex={-1}
            disabled={isDisabled}
            wrapperClassName={headerSearchBarSurfaceClassName}
          />
        </Link>
      </div>
    );
  },
);
