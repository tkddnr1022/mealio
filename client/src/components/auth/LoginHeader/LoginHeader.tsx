import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export interface LoginHeaderProps extends Omit<HTMLAttributes<HTMLElement>, "children"> {
className?: string;
title?: string;
subtitle?: string;
}

export function LoginHeader({
  className = "",
  title = "Coop",
  subtitle = "나에게 딱 맞는 레시피를 찾아보세요!",
  ...rest
}: LoginHeaderProps) {
  return (
    <header
      className={cn(
        "flex w-full flex-col items-center justify-center gap-4 py-10 text-center",
        className,
      )}
      data-name="LoginHeader"
      {...rest}
    >
      <h1 className="typo-logo-large style-text-primary">{title}</h1>
      <p className="typo-body-medium style-text-secondary">{subtitle}</p>
    </header>
  );
}
