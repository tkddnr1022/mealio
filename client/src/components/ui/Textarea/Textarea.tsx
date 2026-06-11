'use client';

import {
  forwardRef,
  useCallback,
  useLayoutEffect,
  useRef,
  type HTMLAttributes,
  type KeyboardEventHandler,
  type ReactNode,
  type TextareaHTMLAttributes,
} from 'react';
import { cn } from '@/lib/utils/cn';

const LINE_HEIGHT_PX = 24;
const DEFAULT_MAX_LINES = 5;

export type TextareaShellProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  'className' | 'children'
>;

export interface TextareaProps extends Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  'className' | 'rows'
> {
  className?: string;
  wrapperClassName?: string;
  wrapperProps?: TextareaShellProps;
  startAdornment?: ReactNode;
  endAdornment?: ReactNode;
  focusWithinRing?: boolean;
  /** true면 높이가 내용에 맞게 자동 조절된다. */
  autoGrow?: boolean;
  /** autoGrow 시 최대 줄 수. */
  maxLines?: number;
  /** Enter(Shift 미입력) 시 호출. 기본 동작을 막고 콜백만 실행한다. */
  onEnterSubmit?: () => void;
}

const focusWithinRingClasses =
  'focus-within:outline-none focus-within:ring-(length:--border-width-focus) focus-within:ring-primary-default focus-within:ring-offset-2 focus-within:ring-offset-background-primary';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea(
    {
      className = '',
      wrapperClassName = '',
      wrapperProps,
      startAdornment,
      endAdornment,
      focusWithinRing = true,
      autoGrow = true,
      maxLines = DEFAULT_MAX_LINES,
      onEnterSubmit,
      disabled,
      value,
      defaultValue,
      onChange,
      onKeyDown,
      ...textareaProps
    },
    ref,
  ) {
    const innerRef = useRef<HTMLTextAreaElement>(null);

    const setTextareaRef = useCallback(
      (node: HTMLTextAreaElement | null) => {
        innerRef.current = node;
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      },
      [ref],
    );

    const maxHeightPx = LINE_HEIGHT_PX * maxLines;

    const adjustHeight = useCallback(() => {
      if (!autoGrow) return;

      const textarea = innerRef.current;
      if (!textarea) return;

      textarea.style.height = 'auto';
      const nextHeight = Math.min(textarea.scrollHeight, maxHeightPx);
      textarea.style.height = `${nextHeight}px`;
      textarea.style.overflowY =
        textarea.scrollHeight > maxHeightPx ? 'auto' : 'hidden';
    }, [autoGrow, maxHeightPx]);

    useLayoutEffect(() => {
      adjustHeight();
    }, [value, defaultValue, adjustHeight]);

    const handleKeyDown: KeyboardEventHandler<HTMLTextAreaElement> = (
      event,
    ) => {
      onKeyDown?.(event);
      if (event.defaultPrevented) return;
      if (event.key !== 'Enter' || event.shiftKey || !onEnterSubmit) return;
      event.preventDefault();
      onEnterSubmit();
    };

    return (
      <div
        {...wrapperProps}
        className={cn(
          'flex w-full items-center gap-3 bg-background-primary px-4 py-3 transition-[border-radius,box-shadow] [&:has(textarea:disabled)]:opacity-50',
          'rounded-2xl',
          focusWithinRing ? focusWithinRingClasses : 'outline-none',
          wrapperClassName,
        )}
      >
        {startAdornment ? (
          <div
            className="flex size-6 shrink-0 flex-col items-center justify-center overflow-hidden"
            aria-hidden
          >
            {startAdornment}
          </div>
        ) : null}
        <textarea
          ref={setTextareaRef}
          rows={1}
          {...textareaProps}
          value={value}
          defaultValue={defaultValue}
          disabled={disabled}
          onChange={(event) => {
            onChange?.(event);
            adjustHeight();
          }}
          onKeyDown={handleKeyDown}
          className={cn(
            'typo-body-regular placeholder:typo-search-bar-value min-h-6 min-w-0 flex-1 resize-none overflow-hidden bg-transparent style-text-primary outline-none placeholder:style-text-placeholder disabled:cursor-not-allowed',
            className,
          )}
        />
        {endAdornment ? (
          <div className="flex shrink-0 items-center justify-center">
            {endAdornment}
          </div>
        ) : null}
      </div>
    );
  },
);
