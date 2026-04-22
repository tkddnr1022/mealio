import { Clock3, Flame, UsersRound } from "lucide-react";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { FlatTag } from "@/components/ui/FlatTag";

export type FlatTagItem = Readonly<{
  label: string;
  leftIcon?: ReactNode;
  accent?: boolean;
}>;

export type FlatTagsRowProps = Readonly<
  Omit<HTMLAttributes<HTMLDivElement>, "className" | "children"> & {
    className?: string;
    items?: readonly FlatTagItem[];
  }
>;

const defaultItems: readonly FlatTagItem[] = [
  { label: "Time", leftIcon: <Clock3 className="size-4 p-px" strokeWidth={2} aria-hidden /> },
  { label: "Difficulty", leftIcon: <Flame className="size-4 p-px" strokeWidth={2} aria-hidden /> },
  { label: "Servings", leftIcon: <UsersRound className="size-4 p-px" strokeWidth={2} aria-hidden /> },
];

export function FlatTagsRow({
  className = "",
  items = defaultItems,
  ...rest
}: FlatTagsRowProps) {
  return (
    <div
      className={cn(
        "hide-native-scrollbar flex w-full items-center gap-2 overflow-x-auto",
        className,
      )}
      data-name="FlatTagsRow"
      {...rest}
    >
      {items.map((item, index) => (
        <FlatTag
          key={`${item.label}-${index}`}
          label={item.label}
          leftIcon={item.leftIcon}
          accent={item.accent ?? false}
          className="shrink-0"
        />
      ))}
    </div>
  );
}
