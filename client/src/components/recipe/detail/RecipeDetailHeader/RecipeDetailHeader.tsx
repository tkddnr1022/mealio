import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export interface RecipeDetailHeaderProps extends Omit<HTMLAttributes<HTMLElement>, "children"> {
className?: string;
category?: string;
title?: string;
description?: string;
}

export function RecipeDetailHeader({
  className = "",
  category,
  title,
  description,
  ...rest
}: RecipeDetailHeaderProps) {
  return (
    <header
      className={cn("flex w-full flex-col items-start gap-3", className)}
      data-name="RecipeDetailHeader"
      {...rest}
    >
      <div className="inline-flex items-center rounded-full bg-tag-accent px-4 py-2">
        <span className="typo-caption-regular style-text-accent">{category ?? ""}</span>
      </div>
      <h1 className="style-text-primary">{title ?? ""}</h1>
      <p className="typo-body-regular style-text-secondary">{description ?? ""}</p>
    </header>
  );
}
