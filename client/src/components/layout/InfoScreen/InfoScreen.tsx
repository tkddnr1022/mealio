import Link from "next/link";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { buildAriaLabel } from "@/lib/utils/a11y";
import { IconShell } from "@/components/ui/IconShell";

export interface InfoScreenProps extends Omit<HTMLAttributes<HTMLElement>, "children"> {
  className?: string;
  title?: string;
  message?: string;
  icon?: ReactNode;
  showButton?: boolean;
  buttonLabel?: string;
  buttonHref?: string;
}

function slugifyHeadingId(raw: string): string {
  const base = raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9가-힣-]/gi, "");
  return base.length > 0 ? base : "info-screen-heading";
}

export function InfoScreen({
  className = "",
  title,
  message,
  icon,
  showButton = true,
  buttonLabel,
  buttonHref = "/",
  ...rest
}: InfoScreenProps) {
  const headingId =
    title !== undefined && title.trim().length > 0
      ? `info-screen-${slugifyHeadingId(title)}`
      : undefined;

  const linkAriaLabel = showButton ? buildAriaLabel("link", buttonLabel ?? "") : undefined;

  return (
    <section
      className={cn(
        "flex w-full flex-col items-center justify-center gap-4 p-4 text-center",
        className,
      )}
      role="region"
      aria-labelledby={headingId}
      data-name="InfoScreen"
      {...rest}
    >
      <IconShell variant="muted" size="xlarge" icon={icon} />
      {title !== undefined && title.trim().length > 0 ? (
        <h3 id={headingId} className="typo-h3 style-text-primary">
          {title}
        </h3>
      ) : null}
      <p className="typo-body-regular style-text-secondary">{message}</p>
      {showButton ? (
        <Link
          href={buttonHref}
          aria-label={linkAriaLabel}
          className="inline-flex items-center justify-center rounded-full bg-primary-default px-4 py-3 typo-label-button style-text-button-primary outline-none transition-colors hover:bg-primary-hover focus-visible:ring-(length:--border-width-focus) focus-visible:ring-primary-default focus-visible:ring-offset-2 focus-visible:ring-offset-background-primary"
        >
          {buttonLabel}
        </Link>
      ) : null}
    </section>
  );
}
