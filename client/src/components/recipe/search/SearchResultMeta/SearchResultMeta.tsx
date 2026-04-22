import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";
import {
  FilterDropdown,
  type FilterDropdownProps,
} from "@/components/ui/dropdown/FilterDropdown";

export type SearchResultMetaProps = Readonly<
  Omit<HTMLAttributes<HTMLElement>, "className" | "children"> & {
    className?: string;
    totalCount?: number;
    filterDropdownProps?: FilterDropdownProps;
  }
>;

export function SearchResultMeta({
  className = "",
  totalCount = 1,
  filterDropdownProps,
  ...rest
}: SearchResultMetaProps) {
  return (
    <section
      className={cn("flex w-full items-center justify-between", className)}
      data-name="SearchResultMeta"
      {...rest}
    >
      <p className="typo-caption-regular style-text-secondary">
        총 <span className="style-text-accent">{totalCount}</span>개
      </p>
      <FilterDropdown className="min-w-0 flex-1" {...filterDropdownProps} />
    </section>
  );
}
