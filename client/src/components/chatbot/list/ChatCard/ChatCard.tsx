import { MessageCircle } from "lucide-react";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";
import { IconShell } from "@/components/ui/IconShell";

export type ChatCardProps = Readonly<
  Omit<HTMLAttributes<HTMLElement>, "children"> & {
    className?: string;
    title?: string;
    timestamp?: string;
    lastMessage?: string;
  }
>;

export function ChatCard({
  className = "",
  title = "Title",
  timestamp = "Timestamp",
  lastMessage = "LastMessage",
  ...rest
}: ChatCardProps) {
  return (
    <article
      className={cn("card flex w-full flex-col gap-0", className)}
      data-name="ChatCard"
      {...rest}
    >
      <div className="flex w-full items-start gap-4">
        <IconShell
          variant="accent"
          size="large"
          icon={<MessageCircle className="size-6" strokeWidth={2} aria-hidden />}
        />
        <div className="flex min-w-0 flex-1 flex-col gap-2 overflow-hidden">
          <div className="flex w-full items-center justify-between">
            <h3 className="min-w-0 flex-1 truncate typo-card-heading style-text-primary">
              {title}
            </h3>
            <span className="ml-3 shrink-0 typo-card-caption style-text-caption">
              {timestamp}
            </span>
          </div>
          <p className="line-clamp-2 typo-card-body style-text-secondary">
            {lastMessage}
          </p>
        </div>
      </div>
    </article>
  );
}
