import {
  BookOpenText,
  LogIn,
  MessageCircle,
  PencilLine,
  Search,
  UserPlus,
  Utensils,
} from 'lucide-react';
import type { HTMLAttributes, ReactNode } from 'react';
import { IconShell } from '@/components/ui/IconShell';
import type { UserActivityItem } from '@/lib/types/user';
import { cn } from '@/lib/utils/cn';
import { formatRelativeTime } from '@/lib/utils/date';

export interface ActivityCardProps extends Omit<
  HTMLAttributes<HTMLElement>,
  'children'
> {
  className?: string;
  item: UserActivityItem;
}

interface ActivityPresentation {
  summary: string;
  icon: ReactNode;
}

function toActivityPresentation(type: string): ActivityPresentation {
  switch (type) {
    case 'recipe.view':
      return {
        summary: '레시피를 조회했어요',
        icon: <BookOpenText className="size-5" strokeWidth={2} aria-hidden />,
      };
    case 'recipe.favorites_add':
      return {
        summary: '레시피를 즐겨찾기에 추가했어요',
        icon: <BookOpenText className="size-5" strokeWidth={2} aria-hidden />,
      };
    case 'recipe.favorites_remove':
      return {
        summary: '레시피 즐겨찾기를 해제했어요',
        icon: <BookOpenText className="size-5" strokeWidth={2} aria-hidden />,
      };
    case 'recipe.share':
      return {
        summary: '레시피를 공유했어요',
        icon: <BookOpenText className="size-5" strokeWidth={2} aria-hidden />,
      };
    case 'search.query':
      return {
        summary: '레시피를 검색했어요',
        icon: <Search className="size-5" strokeWidth={2} aria-hidden />,
      };
    case 'search.click':
      return {
        summary: '검색 결과를 선택했어요',
        icon: <Search className="size-5" strokeWidth={2} aria-hidden />,
      };
    case 'signup':
      return {
        summary: '회원가입을 완료했어요',
        icon: <UserPlus className="size-5" strokeWidth={2} aria-hidden />,
      };
    case 'login':
      return {
        summary: '로그인했어요',
        icon: <LogIn className="size-5" strokeWidth={2} aria-hidden />,
      };
    case 'chatbot.message':
    case 'chatbot.start':
      return {
        summary: '챗봇과 대화를 나눴어요',
        icon: <MessageCircle className="size-5" strokeWidth={2} aria-hidden />,
      };
    case 'nickname.update':
      return {
        summary: '닉네임을 변경했어요',
        icon: <PencilLine className="size-5" strokeWidth={2} aria-hidden />,
      };
    case 'ingredient.add':
      return {
        summary: '식재료를 추가했어요',
        icon: <Utensils className="size-5" strokeWidth={2} aria-hidden />,
      };
    case 'ingredient.remove':
      return {
        summary: '식재료를 삭제했어요',
        icon: <Utensils className="size-5" strokeWidth={2} aria-hidden />,
      };
    case 'ingredient.update':
      return {
        summary: '식재료 정보를 수정했어요',
        icon: <Utensils className="size-5" strokeWidth={2} aria-hidden />,
      };
    case 'ingredient.favorites_add':
      return {
        summary: '즐겨찾는 식재료를 추가했어요',
        icon: <Utensils className="size-5" strokeWidth={2} aria-hidden />,
      };
    case 'ingredient.favorites_remove':
      return {
        summary: '즐겨찾는 식재료를 삭제했어요',
        icon: <Utensils className="size-5" strokeWidth={2} aria-hidden />,
      };
    case 'ingredient.favorites_update':
      return {
        summary: '즐겨찾는 식재료를 수정했어요',
        icon: <Utensils className="size-5" strokeWidth={2} aria-hidden />,
      };
    default:
      return {
        summary: '활동을 기록했어요',
        icon: <MessageCircle className="size-5" strokeWidth={2} aria-hidden />,
      };
  }
}

export function ActivityCard({
  className = '',
  item,
  ...rest
}: ActivityCardProps) {
  const presentation = toActivityPresentation(item.type);
  const occurredAtLabel = formatRelativeTime(item.occurredAt);

  return (
    <article
      className={cn('card flex w-full items-center gap-4', className)}
      data-name="ActivityCard"
      {...rest}
    >
      <IconShell variant="accent" size="large" icon={presentation.icon} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="min-w-0 flex-1 typo-body-medium style-text-primary">
          {presentation.summary}
        </p>
        <span className="typo-card-caption style-text-caption">
          {occurredAtLabel}
        </span>
      </div>
    </article>
  );
}
