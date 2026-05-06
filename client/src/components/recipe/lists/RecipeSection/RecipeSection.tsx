'use client';

import { useId, type ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

/**
 * 홈 등 레시피 블록 (Figma RecipeSection).
 */
export interface RecipeSectionProps {
  className?: string;
  /** 섹션 제목 — 시맨틱 h2 + Card/Heading 타이포 */
  title: string;
  /** `aria-labelledby`용 id (미주입 시 훅으로 생성) */
  titleId?: string;
  children?: ReactNode;
}

export function RecipeSection({
  className = '',
  title,
  titleId: titleIdProp,
  children,
}: RecipeSectionProps) {
  const uid = useId();
  const titleId = titleIdProp ?? `recipe-section-title-${uid}`;

  return (
    <section
      className={cn('flex w-full flex-col gap-4', className)}
      aria-labelledby={titleId}
      data-name="RecipeSection"
    >
      <div className="px-4">
        <h2 id={titleId}>{title}</h2>
      </div>
      {children}
    </section>
  );
}
