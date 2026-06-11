'use client';

import type { HTMLAttributes } from 'react';
import { useCallback, useMemo, useState } from 'react';
import type { Swiper as SwiperType } from 'swiper';
import { A11y, Keyboard } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import type { SuggestedRecipe } from '@/lib/types/chatbot';
import { cn } from '@/lib/utils/cn';
import { SliderPagination } from '@/components/ui/SliderPagination';
import { SuggestedRecipeBubble } from '@/components/chatbot/conversation/SuggestedRecipeBubble';
import { isValidSuggestedRecipe } from '@/components/chatbot/utils/chatbot-format';

import 'swiper/css';
import 'swiper/css/a11y';

export interface SuggestedRecipeSliderProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children'
> {
  className?: string;
  items?: readonly SuggestedRecipe[];
  getImageUrl?: (recipe: SuggestedRecipe) => string | undefined;
  getImageAlt?: (recipe: SuggestedRecipe) => string | undefined;
  cardClassName?: string;
  peekPx?: number;
}

const SLIDES_OFFSET_BEFORE = 16;
const SLIDES_OFFSET_AFTER = 16;
const SPACE_BETWEEN = 16;
const DEFAULT_PEEK_PX = 16;
const MIN_SLIDE_WIDTH = 200;

export function SuggestedRecipeSlider({
  className = '',
  items = [],
  getImageUrl,
  getImageAlt,
  cardClassName = '',
  peekPx = DEFAULT_PEEK_PX,
  ...rest
}: SuggestedRecipeSliderProps) {
  const safeItems = useMemo(
    () => items.filter((item) => isValidSuggestedRecipe(item)),
    [items],
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

  if (safeItems.length === 0) {
    return null;
  }

  return (
    <section
      className={cn('flex w-full flex-col gap-4', className)}
      data-name="SuggestedRecipeSlider"
      {...rest}
    >
      <div className="min-w-0 overflow-hidden">
        <Swiper
          modules={[A11y, Keyboard]}
          slidesPerView="auto"
          spaceBetween={SPACE_BETWEEN}
          slidesOffsetBefore={SLIDES_OFFSET_BEFORE}
          slidesOffsetAfter={SLIDES_OFFSET_AFTER}
          watchOverflow
          speed={320}
          resistance
          resistanceRatio={0.65}
          keyboard={{ enabled: true, onlyInViewport: true }}
          a11y={{ enabled: true }}
          className="w-full overflow-clip"
          onSlideChange={handleSlideChange}
        >
          {safeItems.map((item) => (
            <SwiperSlide
              key={item.id}
              className="box-border! shrink-0"
              style={slideWidthStyle}
            >
              <SuggestedRecipeBubble
                recipe={item}
                imageUrl={getImageUrl?.(item) ?? item.imageUrl ?? undefined}
                imageAlt={getImageAlt?.(item)}
                className={cardClassName}
              />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      <SliderPagination
        className="w-full shrink-0"
        total={safeItems.length}
        activeIndex={activeIndex}
      />
    </section>
  );
}
