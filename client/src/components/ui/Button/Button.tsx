import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
} from 'react';
import { NavLink } from '@/components/ui/NavLink';
import { buildAriaLabel } from '@/lib/utils/a11y';
import { cn } from '@/lib/utils/cn';

export type ButtonVariant = 'primary' | 'secondary';
export type ButtonSize = 'large' | 'medium';

type ButtonVisualProps = Readonly<{
  className?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  label?: string;
  children?: ReactNode;
}>;

type ButtonOwnHtmlKeys =
  | 'className'
  | 'children'
  | 'variant'
  | 'size'
  | 'label'
  | 'aria-label';

/** 기본 `<button>` — `href` 없음 */
export type ButtonAsButtonProps = ButtonVisualProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, ButtonOwnHtmlKeys | 'href'> & {
    href?: undefined;
  };

/** 네비게이션·외부 이동 — `href` 필수 (`Link` 또는 `<a>`) */
export type ButtonAsLinkProps = ButtonVisualProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, ButtonOwnHtmlKeys | 'href'> & {
    href: string;
    /** 링크 모드에서 시각·포인터 비활성 */
    disabled?: boolean;
  };

export type ButtonProps = ButtonAsButtonProps | ButtonAsLinkProps;

function isButtonAsLink(props: ButtonProps): props is ButtonAsLinkProps {
  return typeof props.href === 'string' && props.href.length > 0;
}

/** `label` → 문자열 `children` 순으로 접근 가능한 이름 후보 */
function a11yNameFromContent(
  label: string | undefined,
  children: ReactNode,
): string {
  const fromLabel = label?.trim() ?? '';
  if (fromLabel.length > 0) return fromLabel;
  if (typeof children === 'string') return children.trim();
  if (typeof children === 'number') return String(children);
  return '';
}

/** 보이는 내용이 평문만이면 보조 이름(`aria-label`) 없이 콘텐츠로 충분 */
function buttonShowsOnlyPlainText(
  label: string | undefined,
  children: ReactNode,
): boolean {
  if (children == null || children === false || children === true)
    return Boolean(label?.trim());
  if (typeof children === 'string' || typeof children === 'number') return true;
  return false;
}

export function Button(props: ButtonProps) {
  const {
    className = '',
    variant = 'primary',
    size = 'large',
    label,
    children,
  } = props;

  const content = children ?? label;

  const disabledNative = isButtonAsLink(props)
    ? !!props.disabled
    : !!props.disabled;

  const a11yName = a11yNameFromContent(label, children);
  const ariaLabelForLink = buildAriaLabel('link', a11yName);
  const ariaLabelForButton = !buttonShowsOnlyPlainText(label, children)
    ? buildAriaLabel('button', a11yName)
    : undefined;

  const baseClassName =
    'inline-flex w-full items-center justify-center px-4 outline-none transition-colors focus-visible:outline-(length:--border-width-focus) focus-visible:outline-offset-2 focus-visible:outline-primary-default';
  const sizeClassName =
    size === 'large'
      ? 'rounded-full py-3 typo-label-button'
      : 'rounded-xl py-3 typo-label-dropdown';

  const toneClassName =
    variant === 'primary'
      ? disabledNative
        ? 'bg-primary-inactive style-text-disabled'
        : 'bg-primary-default style-text-button-primary hover:bg-primary-hover'
      : 'bg-secondary-default style-text-button-secondary hover:bg-secondary-hover';

  const surfaceClassName = cn(
    baseClassName,
    sizeClassName,
    toneClassName,
    className,
  );

  if (isButtonAsLink(props)) {
    const {
      href,
      disabled: linkDisabled,
      className: _c,
      variant: _v,
      size: _s,
      label: _l,
      children: _ch,
      ...anchorRest
    } = props;

    if (linkDisabled) {
      return (
        <span
          className={cn(surfaceClassName, 'cursor-not-allowed no-underline')}
          aria-disabled
          aria-label={ariaLabelForLink}
        >
          {content}
        </span>
      );
    }

    const linkClassName = cn(surfaceClassName, 'no-underline');

    return (
      <NavLink
        href={href}
        className={linkClassName}
        {...anchorRest}
        aria-label={ariaLabelForLink}
      >
        {content}
      </NavLink>
    );
  }

  const {
    type = 'button',
    disabled,
    className: _c2,
    variant: _v2,
    size: _s2,
    label: _l2,
    children: _ch2,
    ...buttonRest
  } = props;

  const isDisabled = !!disabled;

  return (
    <button
      type={type}
      className={surfaceClassName}
      disabled={isDisabled}
      aria-disabled={isDisabled || undefined}
      {...buttonRest}
      {...(ariaLabelForButton !== undefined
        ? { 'aria-label': ariaLabelForButton }
        : {})}
    >
      {content}
    </button>
  );
}
