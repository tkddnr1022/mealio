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

import { Input } from "./Input";

export type SearchBarProps = Readonly<
  Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "className"> & {
    className?: string;
    /** 외곽 pill 컨테이너에 붙는 클래스 */
    wrapperClassName?: string;
  }
>;

/** 편집 필드는 기본 사용. 헤더 트리거는 `readOnly` + `tabIndex={-1}` (`SearchBarHeader` 참고). */
export const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(
  function SearchBar(
    {
      className = "",
      wrapperClassName = "",
      readOnly,
      disabled,
      placeholder = "검색어를 입력해 주세요",
      id: idProp,
      "aria-label": ariaLabel,
      value: valueProp,
      defaultValue,
      onChange,
      ...inputProps
    },
    ref,
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
    const isEditable = !readOnly;

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
      if (!isEditable || disabled || !hasText) return;
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
      <Input
        ref={setRefs}
        {...inputProps}
        id={id}
        type="search"
        readOnly={readOnly}
        disabled={disabled}
        placeholder={placeholder}
        aria-label={label}
        value={isControlled ? valueProp : undefined}
        defaultValue={isControlled ? undefined : defaultValue}
        onChange={handleChange}
        focusWithinRing={isEditable}
        wrapperClassName={wrapperClassName}
        startAdornment={
          <Search
            className="size-full shrink-0 text-text-placeholder"
            strokeWidth={2}
          />
        }
        endAdornment={
          isEditable ? (
            <button
              type="button"
              tabIndex={hasText && !disabled ? 0 : -1}
              aria-hidden={!hasText}
              aria-label={hasText ? "검색어 지우기" : undefined}
              disabled={!hasText || disabled}
              onClick={handleClear}
              className={`inline-flex size-5 shrink-0 items-center justify-center overflow-hidden text-text-placeholder transition-colors focus-visible:outline-(length:--border-width-focus) focus-visible:outline-offset-2 focus-visible:outline-primary disabled:pointer-events-none cursor-pointer ${hasText ? "" : "invisible pointer-events-none"}`.trim()}
            >
              <X className="size-full" strokeWidth={2} aria-hidden />
            </button>
          ) : null
        }
        className={`${isEditable ? "" : "cursor-pointer"} ${className}`.trim()}
      />
    );
  },
);
