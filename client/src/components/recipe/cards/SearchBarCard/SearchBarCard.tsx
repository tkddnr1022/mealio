import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

import { SearchBar, type SearchBarProps } from "@/components/ui/SearchBar";

export type SearchBarCardProps = Readonly<
  Omit<HTMLAttributes<HTMLElement>, "className" | "children"> & {
    className?: string;
    heading?: string;
    searchBarProps?: SearchBarProps;
  }
>;

export function SearchBarCard({
  className = "",
  heading = "검색어",
  searchBarProps,
  ...rest
}: SearchBarCardProps) {
  return (
    <section
      className={cn(
        "card flex w-full flex-col",
        className,
      )}
      data-name="SearchBarCard"
      {...rest}
    >
      <h3 className="typo-card-heading style-text-primary">{heading}</h3>
      <SearchBar {...searchBarProps} />
    </section>
  );
}
