'use client';

import { Send } from 'lucide-react';
import type { HTMLAttributes, SubmitEventHandler } from 'react';
import { cn } from '@/lib/utils/cn';
import { buildAriaLabel } from '@/lib/utils/a11y';
import { Input } from '@/components/ui/Input';

export interface ChatComposerProps extends Omit<
  HTMLAttributes<HTMLElement>,
  'children'
> {
  className?: string;
  value?: string;
  placeholder?: string;
  /** true면 입력·전송 비활성화 */
  disabled?: boolean;
  onValueChange?: (value: string) => void;
  onSubmitMessage?: (value: string) => void;
}

export function ChatComposer({
  className = '',
  value,
  placeholder = '메시지를 입력하세요',
  disabled = false,
  onValueChange,
  onSubmitMessage,
  ...rest
}: ChatComposerProps) {
  const inputValue = value ?? '';
  const isFilled = inputValue.trim().length > 0;
  const effectivePlaceholder = disabled
    ? '채팅을 전송할 수 없어요'
    : placeholder;

  const handleSubmit: SubmitEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    if (disabled || !isFilled) return;
    onSubmitMessage?.(inputValue);
  };

  return (
    <footer
      className={cn(
        'w-full border-t border-border-subtle bg-background-surface px-4 py-4',
        className,
      )}
      data-name="ChatComposer"
      {...rest}
    >
      <form
        className="flex w-full items-center justify-end gap-3"
        onSubmit={handleSubmit}
      >
        <Input
          wrapperClassName="flex-1"
          focusWithinRing
          placeholder={effectivePlaceholder}
          aria-label={buildAriaLabel('input', effectivePlaceholder)}
          value={inputValue}
          disabled={disabled}
          onChange={(event) => onValueChange?.(event.target.value)}
          className={cn(
            'typo-body-regular',
            isFilled
              ? 'typo-search-bar-value style-text-primary'
              : 'style-text-placeholder',
          )}
        />
        <button
          type="submit"
          aria-label={buildAriaLabel('button', '메시지 전송')}
          disabled={disabled || !isFilled}
          className={cn(
            'inline-flex size-12 shrink-0 items-center justify-center rounded-full transition-colors',
            isFilled
              ? 'bg-primary-default style-text-button-primary'
              : 'bg-indicator-inactive style-text-button-primary',
          )}
        >
          <Send className="size-5" strokeWidth={2} aria-hidden />
        </button>
      </form>
    </footer>
  );
}
