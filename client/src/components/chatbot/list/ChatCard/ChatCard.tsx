import { MessageCircle } from 'lucide-react';
import Link from 'next/link';
import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';
import { IconShell } from '@/components/ui/IconShell';
import { formatRelativeTime, type DateInput } from '@/lib/utils/date';

export interface ChatCardProps extends Omit<
  HTMLAttributes<HTMLElement>,
  'children'
> {
  className?: string;
  /** `/chatbot/{conversationId}` 대화 화면으로 이동 */
  conversationId: string;
  title?: string;
  timestamp?: DateInput;
  lastMessage?: string;
}

export function ChatCard({
  className = '',
  conversationId,
  title,
  timestamp = new Date(),
  lastMessage,
  ...rest
}: ChatCardProps) {
  const formattedTimestamp = formatRelativeTime(timestamp);
  const conversationHref = `/chatbot/${encodeURIComponent(conversationId)}`;

  const linkClassName =
    'card flex w-full flex-col gap-0 text-inherit no-underline outline-none transition-[opacity,colors] focus-visible:outline-(length:--border-width-focus) focus-visible:outline-offset-2 focus-visible:outline-primary-default';

  return (
    <Link
      href={conversationHref}
      className={cn(linkClassName, className)}
      data-name="ChatCard"
      {...rest}
    >
      <article className="contents">
        <div className="flex w-full items-start gap-4">
          <IconShell
            variant="accent"
            size="large"
            icon={
              <MessageCircle className="size-6" strokeWidth={2} aria-hidden />
            }
          />
          <div className="flex min-w-0 flex-1 flex-col gap-2 overflow-hidden">
            <div className="flex w-full items-center justify-between">
              <h3 className="min-w-0 flex-1 truncate typo-card-heading style-text-primary">
                {title ?? ''}
              </h3>
              <span className="ml-3 shrink-0 typo-card-caption style-text-caption">
                {formattedTimestamp}
              </span>
            </div>
            <p className="line-clamp-2 typo-card-body style-text-secondary">
              {lastMessage ?? ''}
            </p>
          </div>
        </div>
      </article>
    </Link>
  );
}
