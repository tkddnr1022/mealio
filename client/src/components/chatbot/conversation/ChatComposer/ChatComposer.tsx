"use client";

import { Send } from "lucide-react";
import type { FormEvent, HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";
import { Input } from "@/components/ui/Input";

export type ChatComposerProps = Readonly<
  Omit<HTMLAttributes<HTMLElement>, "children"> & {
    className?: string;
    filled?: boolean;
    value?: string;
    placeholder?: string;
    onValueChange?: (value: string) => void;
    onSubmitMessage?: (value: string) => void;
  }
>;

export function ChatComposer({
  className = "",
  filled = false,
  value,
  placeholder = "메시지를 입력하세요",
  onValueChange,
  onSubmitMessage,
  ...rest
}: ChatComposerProps) {
  const inputValue = value ?? (filled ? "한식 레시피 추천해줘" : "");
  const isFilled = inputValue.trim().length > 0;

  const handleSubmit = (event: FormEvent<HTMLElement>) => {
    event.preventDefault();
    if (!isFilled) return;
    onSubmitMessage?.(inputValue);
  };

  return (
    <footer
      className={cn(
        "w-full border-t border-border-subtle bg-background-surface px-4 py-4",
        className,
      )}
      data-name="ChatComposer"
      {...rest}
    >
      <form className="flex w-full items-center justify-end gap-3" onSubmit={handleSubmit}>
        <Input
          wrapperClassName="flex-1"
          focusWithinRing
          placeholder={placeholder}
          value={inputValue}
          onChange={(event) => onValueChange?.(event.target.value)}
          className={cn(
            "typo-body-regular",
            isFilled ? "typo-search-bar-value style-text-primary" : "style-text-placeholder",
          )}
        />
        <button
          type="submit"
          aria-label="메시지 전송"
          disabled={!isFilled}
          className={cn(
            "inline-flex size-12 shrink-0 items-center justify-center rounded-full transition-colors",
            isFilled ? "bg-primary-default style-text-button-primary" : "bg-indicator-inactive style-text-button-primary",
          )}
        >
          <Send className="size-5" strokeWidth={2} aria-hidden />
        </button>
      </form>
    </footer>
  );
}
