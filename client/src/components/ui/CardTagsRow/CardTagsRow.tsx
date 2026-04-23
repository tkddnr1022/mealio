import { Clock3, Flame, UsersRound } from "lucide-react";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { CardTag } from "@/components/ui/CardTag";

export type CardTagItem = Readonly<{
  label: string;
  leftIcon?: ReactNode;
}>;

export type CardTagsRowProps = Readonly<
  Omit<HTMLAttributes<HTMLDivElement>, "className" | "children"> & {
    className?: string;
    items?: readonly CardTagItem[];
  }
>;

const defaultItems: readonly CardTagItem[] = [
  {
    label: "Time",
    leftIcon: <Clock3 className="size-5 p-0.5 style-text-accent" strokeWidth={2} aria-hidden />,
  },
  {
    label: "Difficulty",
    leftIcon: <Flame className="size-5 p-0.5 style-text-accent" strokeWidth={2} aria-hidden />,
  },
  {
    label: "Servings",
    leftIcon: <UsersRound className="size-5 p-0.5 style-text-accent" strokeWidth={2} aria-hidden />,
  },
];

export function CardTagsRow({
  className = "",
  items = defaultItems,
  ...rest
}: CardTagsRowProps) {
  return (
    <div
      className={cn("flex w-full flex-wrap items-start gap-3", className)}
      data-name="CardTagsRow"
      {...rest}
    >
      {items.map((item, index) => (
        <CardTag
          key={`${item.label}-${index}`}
          label={item.label}
          leftIcon={item.leftIcon}
        />
      ))}
    </div>
  );
}
