'use client';

import { type ReactNode } from 'react';
import { BackButton } from '@/components/ui/buttons/BackButton';
import { NavLink } from '@/components/ui/NavLink';
import { APP_BRAND_NAME } from '@/lib/constants/app.constants';
import { HOME_PATH } from '@/lib/constants/routes.constants';
import { cn } from '@/lib/utils/cn';

export interface NavbarProps {
  className?: string;
  /** Figma AdditionalButtonContainer 슬롯 */
  additionalButtons?: ReactNode;
  /** 명시하지 않으면 false */
  displayBackButton?: boolean;
  onBack?: () => void;
  /** 명시하지 않으면 true */
  displayTitle?: boolean;
}

export function Navbar({
  className = '',
  additionalButtons,
  displayBackButton,
  displayTitle,
  onBack,
}: NavbarProps) {
  const showTitle = displayTitle ?? true;
  const showBack = displayBackButton ?? false;
  const right = additionalButtons ?? null;

  return (
    <header
      role="banner"
      className={cn(
        'z-40 border-b border-border-subtle bg-background-surface',
        className,
      )}
    >
      <div className="mx-auto h-12 w-full px-2">
        <div className="relative flex h-full items-center justify-center">
          {showBack && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2">
              <BackButton onClick={onBack} />
            </div>
          )}

          {showTitle ? (
            <h1 className="typo-logo-small m-0 min-w-0 max-w-[min(100vw-8rem,28rem)] text-center">
              <NavLink
                href={HOME_PATH}
                className="block truncate style-text-primary no-underline outline-none transition-colors focus-visible:outline-(length:--border-width-focus) focus-visible:outline-offset-2 focus-visible:outline-primary-default"
              >
                {APP_BRAND_NAME}
              </NavLink>
            </h1>
          ) : null}

          {right != null && (
            <div className="absolute right-0 top-1/2 -translate-y-1/2">
              <div className="flex items-center">{right}</div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
