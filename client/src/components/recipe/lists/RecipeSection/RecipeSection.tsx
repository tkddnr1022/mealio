'use client';

import { useId, type ReactNode } from 'react';
import type { RecipeGridLayout } from '@/components/recipe/lists/recipe-grid-layout';
import { RecipeSlider } from '@/components/recipe/lists/RecipeSlider';
import type { RecipeSummary } from '@/lib/types/recipe';
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
  recipes: readonly RecipeSummary[];
  cardClassName?: string;
  peekPx?: number;
  /** 슬라이드 한 페이지당 그리드 구성. 기본 2×2(4장) */
  layout?: RecipeGridLayout;
  /** `RecipeSlider` 래퍼 className */
  sliderClassName?: string;
  /** `recipes`가 비어 있을 때 표시. 미지정 시 아무것도 렌더하지 않음 */
  emptyFallback?: ReactNode;
}

export function RecipeSection({
  className = '',
  title,
  titleId: titleIdProp,
  recipes,
  cardClassName,
  peekPx,
  layout,
  sliderClassName,
  emptyFallback,
}: RecipeSectionProps) {
  const uid = useId();
  const titleId = titleIdProp ?? `recipe-section-title-${uid}`;

  const sliderContent =
    recipes.length > 0 ? (
      <RecipeSlider
        className={sliderClassName}
        recipes={recipes}
        cardClassName={cardClassName}
        peekPx={peekPx}
        layout={layout}
      />
    ) : (
      (emptyFallback ?? null)
    );

  return (
    <section
      className={cn('flex w-full flex-col gap-4', className)}
      aria-labelledby={titleId}
      data-name="RecipeSection"
    >
      <div className="px-4">
        <h2 id={titleId}>{title}</h2>
      </div>
      {sliderContent}
    </section>
  );
}
