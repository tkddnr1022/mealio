import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { IconShell } from "@/components/ui/IconShell";

export interface InfoScreenProps extends Omit<HTMLAttributes<HTMLElement>, "children"> {
className?: string;
title?: string;
message?: string;
icon?: ReactNode;
showButton?: boolean;
buttonLabel?: string;
onButtonClick?: () => void;
}

export function InfoScreen({
  className = "",
  title,
  message,
  icon,
  showButton = true,
  buttonLabel,
  onButtonClick,
  ...rest
}: InfoScreenProps) {
  return (
    <section
      className={cn(
        "flex w-full flex-col items-center justify-center gap-4 p-4 text-center",
        className,
      )}
      data-name="InfoScreen"
      {...rest}
    >
      <IconShell variant="muted" size="xlarge" icon={icon} />
      <h3 className="typo-h3 style-text-primary">{title}</h3>
      <p className="typo-body-regular style-text-secondary">{message}</p>
      {showButton ? (
        <button
          type="button"
          onClick={onButtonClick}
          className="inline-flex items-center justify-center rounded-full bg-primary-default px-4 py-3 typo-label-button style-text-button-primary outline-none transition-colors hover:bg-primary-hover focus-visible:ring-(length:--border-width-focus) focus-visible:ring-primary-default focus-visible:ring-offset-2 focus-visible:ring-offset-background-primary"
        >
          {buttonLabel}
        </button>
      ) : null}
    </section>
  );
}
