import type { AnchorHTMLAttributes, HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export type LoginFooterLink = Readonly<{
  label: string;
  href?: string;
}>;

export interface LoginFooterProps extends Omit<HTMLAttributes<HTMLElement>, "children"> {
className?: string;
leftLink?: LoginFooterLink;
rightLink?: LoginFooterLink;
linkProps?: Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "children">;
}

export function LoginFooter({
  className = "",
  leftLink = { label: "이용약관", href: "#" },
  rightLink = { label: "개인정보 처리방침", href: "#" },
  linkProps,
  ...rest
}: LoginFooterProps) {
  return (
    <footer
      className={cn("flex w-full items-start justify-center gap-4", className)}
      data-name="LoginFooter"
      {...rest}
    >
      <a className="typo-caption-regular style-text-caption" href={leftLink.href} {...linkProps}>
        {leftLink.label}
      </a>
      <span aria-hidden className="self-stretch py-1">
        <span className="block h-full w-px bg-border-subtle" />
      </span>
      <a className="typo-caption-regular style-text-caption" href={rightLink.href} {...linkProps}>
        {rightLink.label}
      </a>
    </footer>
  );
}
