import Link from 'next/link';
import type { LinkProps } from 'next/link';
import { forwardRef, type AnchorHTMLAttributes, type ReactNode } from 'react';

import { isInternalNavHref } from '@/lib/utils/isInternalNavHref';

/** `<a>`에 전달하면 안 되는 Next `Link` 전용 키 */
const NEXT_LINK_ONLY_KEYS = [
  'as',
  'replace',
  'scroll',
  'shallow',
  'passHref',
  'prefetch',
  'locale',
  'legacyBehavior',
  'onNavigate',
] as const satisfies readonly (keyof LinkProps)[];

/**
 * Next.js `Link`의 {@link LinkProps}와 앵커 공통 속성을 합친 계약(`Link`와 동등).
 */
export type NavLinkProps = Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  keyof LinkProps
> &
  LinkProps & {
    children?: ReactNode;
  };

function anchorPropsFromNavLinkRest(
  rest: Omit<NavLinkProps, 'href' | 'children'>,
): AnchorHTMLAttributes<HTMLAnchorElement> {
  const out: Record<string, unknown> = { ...rest };
  for (const key of NEXT_LINK_ONLY_KEYS) {
    delete out[key];
  }
  return out as AnchorHTMLAttributes<HTMLAnchorElement>;
}

/**
 * 앱 내 경로(`/`로 시작, `//` 제외) 또는 `href` 객체는 Next `Link`,
 * 그 외 문자열 `href`는 `<a>`로 렌더한다.
 */
export const NavLink = forwardRef<HTMLAnchorElement, NavLinkProps>(
  function NavLink({ href, children, ...rest }, ref) {
    if (typeof href !== 'string' || isInternalNavHref(href)) {
      return (
        <Link ref={ref} href={href} {...rest}>
          {children}
        </Link>
      );
    }

    return (
      <a ref={ref} href={href} {...anchorPropsFromNavLinkRest(rest)}>
        {children}
      </a>
    );
  },
);

NavLink.displayName = 'NavLink';
