import { MessageCircle } from 'lucide-react';
import type { HTMLAttributes } from 'react';
import { NavLink } from '@/components/ui/NavLink';
import type { ConversationListItem } from '@/lib/types/chatbot';
import { cn } from '@/lib/utils/cn';
import { IconShell } from '@/components/ui/IconShell';
import {
  toChatListTimestampLabel,
  toConversationHref,
} from '@/components/chatbot/utils/chatbot-format';

export interface ChatCardProps extends Omit<
  HTMLAttributes<HTMLElement>,
  'children'
> {
  className?: string;
  conversation: ConversationListItem;
  title?: string;
}

export function ChatCard({
  className = '',
  conversation,
  title,
  ...rest
}: ChatCardProps) {
  const updatedAtLabel = toChatListTimestampLabel(conversation.updatedAt);
  const conversationHref = toConversationHref(conversation.conversationId);

  const linkClassName =
    'card flex w-full flex-col gap-0 text-inherit no-underline outline-none transition-[opacity,colors] focus-visible:outline-(length:--border-width-focus) focus-visible:outline-offset-2 focus-visible:outline-primary-default';

  return (
    <NavLink
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
          <div className="flex min-w-0 flex-1 flex-col gap-1 overflow-hidden">
            <h3 className="min-w-0 flex-1 truncate typo-card-heading style-text-primary">
              {title ?? ''}
            </h3>
            <span className="typo-card-caption style-text-caption">
              {updatedAtLabel}
            </span>
          </div>
        </div>
      </article>
    </NavLink>
  );
}
