"use client";

import type { HTMLAttributes } from "react";
import {
  useCallback,
  useMemo,
  useState,
} from "react";
import type { Swiper as SwiperType } from "swiper";
import { A11y, Keyboard } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { cn } from "@/lib/utils/cn";

import "swiper/css";
import "swiper/css/a11y";

import { RecipeGrid, type RecipeGridItem } from "./RecipeGrid";
import { SliderPagination } from "./SliderPagination";

const CARDS_PER_PAGE = 4;

/** Figma / SliderPagination 정렬에 맞춘 값 — `peekPx`와 함께 슬라이드 폭 계산에 사용 */
const SLIDES_OFFSET_BEFORE = 16;
const SLIDES_OFFSET_AFTER = 16;
const SPACE_BETWEEN = 16;
const DEFAULT_PEEK_PX = 16;
const MIN_SLIDE_WIDTH = 200;

function chunkRecipes(
  items: readonly RecipeGridItem[],
  size: number,
): RecipeGridItem[][] {
  if (items.length === 0) return [];
  const out: RecipeGridItem[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

export type RecipeSliderProps = Readonly<
  Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
    /** 슬라이드에 채울 레시피(4개마다 한 페이지의 2×2 그리드) */
    recipes: readonly RecipeGridItem[];
    /** 그리드 카드에 공통 적용 */
    cardClassName?: string;
    /**
     * 다음 슬라이드가 보이는 가로 픽셀(고정).
     * 슬라이드 너비 = 컨테이너 너비 − 좌측 오프셋(16) − 슬라이드 간격(16) − peek.
     * 컨테이너가 매우 좁으면 `MIN_SLIDE_WIDTH`(200) 때문에 실제 peek은 더 작아질 수 있음.
     */
    peekPx?: number;
  }
>;

/**
 * 홈 등용 레시피 슬라이더 (Figma RecipeSlider, node 183:2136).
 * `peekPx`는 고정이고, 슬라이드 폭은 컨테이너 측정값으로 결정된다.
 */
export function RecipeSlider({
  className = "",
  recipes,
  cardClassName = "",
  peekPx = DEFAULT_PEEK_PX,
  ...rest
}: RecipeSliderProps) {
  const pages = useMemo(
    () => chunkRecipes(recipes, CARDS_PER_PAGE),
    [recipes],
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const slideWidthStyle = useMemo(
    () => ({
      width: `max(${MIN_SLIDE_WIDTH}px, calc(100% - ${SLIDES_OFFSET_BEFORE + SPACE_BETWEEN + peekPx}px))`,
    }),
    [peekPx],
  );

  const handleSlideChange = useCallback((swiper: SwiperType) => {
    setActiveIndex(swiper.activeIndex);
  }, []);

  if (pages.length === 0) {
    return null;
  }
  // TODO: CLS 최적화를 위한 SSR placeholder 추가
  return (
    <div
      className={cn("flex w-full flex-col gap-4", className)}
      data-name="RecipeSlider"
      {...rest}
    >
      <div className="min-w-0 overflow-hidden">
        <Swiper
          modules={[A11y, Keyboard]}
          slidesPerView="auto"
          spaceBetween={SPACE_BETWEEN}
          slidesOffsetBefore={SLIDES_OFFSET_BEFORE}
          slidesOffsetAfter={SLIDES_OFFSET_AFTER}
          // centeredSlides
          watchOverflow
          speed={320}
          resistance
          resistanceRatio={0.65}
          keyboard={{ enabled: true, onlyInViewport: true }}
          a11y={{ enabled: true }}
          className="w-full overflow-clip"
          onSlideChange={handleSlideChange}
        >
          {pages.map((pageRecipes, pageIndex) => (
            <SwiperSlide
              key={pageIndex}
              className="box-border! shrink-0"
              style={slideWidthStyle}
            >
              <RecipeGrid recipes={pageRecipes} cardClassName={cardClassName} />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      <SliderPagination
        className="w-full shrink-0"
        total={pages.length}
        activeIndex={activeIndex}
      />
    </div>
  );
}
