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

export type SearchBarProps = Readonly<
  Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "className"> & {
    className?: string;
    /** 외곽 pill 컨테이너에 붙는 클래스 */
    wrapperClassName?: string;
  }
>;

export const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(
  function SearchBar(
    {
      className = "",
      wrapperClassName = "",
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
      if (disabled || !hasText) return;
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

    return (
      <div
        className={`flex w-full items-center gap-3 rounded-full bg-background px-4 py-3 transition-shadow focus-within:outline-none focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 focus-within:ring-offset-background [&:has(input:disabled)]:opacity-50 ${wrapperClassName}`.trim()}
      >
        <Search
          className="size-5 shrink-0 text-text-placeholder"
          strokeWidth={2}
          aria-hidden
        />
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
          className={`min-h-0 min-w-0 flex-1 bg-transparent text-body text-text-primary outline-none placeholder:font-normal placeholder:text-text-placeholder disabled:cursor-not-allowed not-placeholder-shown:font-medium [&::-webkit-search-cancel-button]:hidden ${className}`.trim()}
        />
        <button
          type="button"
          tabIndex={hasText && !disabled ? 0 : -1}
          aria-hidden={!hasText}
          aria-label={hasText ? "검색어 지우기" : undefined}
          disabled={!hasText || disabled}
          onClick={handleClear}
          className={`inline-flex size-5 shrink-0 items-center justify-center rounded-lg text-text-placeholder transition-colors hover:bg-placeholder-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:pointer-events-none ${!hasText ? "invisible pointer-events-none" : ""}`.trim()}
        >
          <X className="size-4" strokeWidth={2} aria-hidden />
        </button>
      </div>
    );
  },
);
