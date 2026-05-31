import { NavLink } from '@/components/ui/NavLink';
import { cn } from '@/lib/utils/cn';

const hashTagSurfaceClass =
  'inline-flex items-center rounded-full bg-accent-default px-3 py-2 style-text-accent no-underline outline-none transition-opacity hover:opacity-90 focus-visible:outline-(length:--border-width-focus) focus-visible:outline-offset-2 focus-visible:outline-primary-default';

export interface HashTagProps {
  className?: string;
  label?: string;
  href?: string;
}

export function HashTag({ className = '', label, href }: HashTagProps) {
  const content = <span className="typo-caption-regular">{`#${label}`}</span>;

  if (href) {
    return (
      <NavLink
        href={href}
        className={cn(hashTagSurfaceClass, 'shrink-0', className)}
        data-name="HashTag"
      >
        {content}
      </NavLink>
    );
  }

  return (
    <div className={cn(hashTagSurfaceClass, className)} data-name="HashTag">
      {content}
    </div>
  );
}
