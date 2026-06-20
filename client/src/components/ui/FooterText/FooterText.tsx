import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

export interface FooterTextProps extends Omit<
  HTMLAttributes<HTMLParagraphElement>,
  'children'
> {
  className?: string;
  children: ReactNode;
}

export function FooterText({
  className = '',
  children,
  ...rest
}: FooterTextProps) {
  return (
    <p
      className={cn('text-center typo-small style-text-disabled', className)}
      data-name="FooterText"
      {...rest}
    >
      {children}
    </p>
  );
}
