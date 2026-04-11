"use client";

import { Search, X } from "lucide-react";
import {
  forwardRef,
  useCallback,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type InputHTMLAttributes,
} from "react";

export type SearchBarMode = "input" | "button";

export type SearchBarProps = Readonly<
  Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "className"> & {
    className?: string;
    /** 외곽 pill 컨테이너에 붙는 클래스 */
    wrapperClassName?: string;
    /**
     * Figma variant `mode`.
     * - `input`: 편집 가능한 필드 — 포커스 링, 입력값 시 지우기 버튼.
     * - `button`: 트리거/헤더용 — 포커스 링 없음, 지우기 버튼 없음(상위가 포커스·클릭 처리).
     */
    mode?: SearchBarMode;
  }
>;

export const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(
  function SearchBar(
    {
      className = "",
      wrapperClassName = "",
      mode = "input",
      disabled,
      placeholder = "레시피 검색하기",
      id: idProp,
      "aria-label": ariaLabel,
      value: valueProp,
      defaultValue,
      onChange,
      ...inputProps
    },
    ref
  ) {
    const uid = useId();
    const id = idProp ?? uid;
    const label = ariaLabel ?? placeholder;
    const innerRef = useRef<HTMLInputElement>(null);
    const isControlled = valueProp !== undefined;
    const [internalValue, setInternalValue] = useState(
      () => (defaultValue != null ? String(defaultValue) : ""),
    );

    const valueStr = isControlled ? String(valueProp ?? "") : internalValue;
    const hasText = valueStr.length > 0;
    const isInputMode = mode === "input";

    const setRefs = useCallback(
      (el: HTMLInputElement | null) => {
        innerRef.current = el;
        if (typeof ref === "function") ref(el);
        else if (ref) ref.current = el;
      },
      [ref],
    );

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      if (!isControlled) setInternalValue(e.target.value);
      onChange?.(e);
    };

    const handleClear = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      if (!isInputMode || disabled || !hasText) return;
      const input = innerRef.current;
      if (!input) return;
      input.focus();

      const valueSetter = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value",
      )?.set;
      valueSetter?.call(input, "");

      if (!isControlled) setInternalValue("");

      onChange?.({
        target: input,
        currentTarget: input,
      } as unknown as ChangeEvent<HTMLInputElement>);
    };

    const focusRingClasses = isInputMode
      ? "focus-within:outline-none focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 focus-within:ring-offset-background"
      : "outline-none";

    return (
      <div
        data-mode={mode}
        className={`flex w-full items-center gap-3 rounded-full bg-background px-4 py-3 transition-shadow ${focusRingClasses} [&:has(input:disabled)]:opacity-50 ${wrapperClassName}`.trim()}
      >
        <div
          className="flex size-6 shrink-0 flex-col items-center justify-center overflow-hidden"
          aria-hidden
        >
          <Search
            className="size-full shrink-0 text-text-placeholder"
            strokeWidth={2}
          />
        </div>
        <input
          ref={setRefs}
          {...inputProps}
          id={id}
          type="search"
          disabled={disabled}
          placeholder={placeholder}
          aria-label={label}
          value={isControlled ? valueProp : undefined}
          defaultValue={isControlled ? undefined : defaultValue}
          onChange={handleChange}
          className={`min-h-0 min-w-0 flex-1 bg-transparent text-body text-text-primary outline-none placeholder:font-normal placeholder:text-text-placeholder disabled:cursor-not-allowed not-placeholder-shown:font-medium [&::-webkit-search-cancel-button]:hidden ${isInputMode ? "" : "cursor-pointer"} ${className}`.trim()}
        />
        {isInputMode ? (
          <button
            type="button"
            tabIndex={hasText && !disabled ? 0 : -1}
            aria-hidden={!hasText}
            aria-label={hasText ? "검색어 지우기" : undefined}
            disabled={!hasText || disabled}
            onClick={handleClear}
            className={`inline-flex size-5 shrink-0 items-center justify-center overflow-hidden text-text-placeholder transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:pointer-events-none cursor-pointer ${hasText ? "" : "invisible pointer-events-none"}`.trim()}
          >
            <X className="size-full" strokeWidth={2} aria-hidden />
          </button>
        ) : null}
      </div>
    );
  },
);
