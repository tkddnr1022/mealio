'use client';

import { RecipeSection } from '@/components/recipe';

/**
 * 개인 맞춤형 레시피 목록(CSR) 자리.
 * 추후 `getRecipeList` + 인증 또는 전용 추천 API를 연결한다.
 * ISR 공개 섹션과 분리되어 쿠키·세션 의존을 이 블록에만 둘 수 있다.
 */
export function PersonalizedRecipeSection() {
  return (
    <RecipeSection title="맞춤 레시피">
      <div
        className="flex flex-col gap-3 px-4"
        aria-busy="true"
        aria-label="맞춤 레시피 로딩 중"
      >
        <p className="typo-body-regular style-text-caption">
          로그인 시 취향에 맞는 레시피를 곧 이곳에서 보여 드릴 예정입니다.
        </p>
        <div className="flex gap-3 overflow-hidden pb-1" role="presentation">
          {[0, 1, 2].map((key) => (
            <div
              key={key}
              className="h-40 min-w-[140px] shrink-0 animate-pulse rounded-lg bg-(--ref-color-border-muted)"
            />
          ))}
        </div>
      </div>
    </RecipeSection>
  );
}
