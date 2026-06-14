import type { HTMLAttributes, KeyboardEvent, PointerEvent } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { buildAriaLabel } from '@/lib/utils/a11y';
import { formatCookingTime } from '@/lib/utils/date';

export type RangeSliderUnit = string | 'time';
export type RangeSliderValue = { minValue: number; maxValue: number };

export interface RangeSliderProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'className'
> {
  className?: string;
  min?: number;
  max?: number;
  step?: number;
  unit?: RangeSliderUnit;
  defaultMinValue?: number;
  defaultMaxValue?: number;
  onValueChange?: (next: RangeSliderValue) => void;
}

function getSurfaceStyle(minPercent: number, maxPercent: number) {
  if (minPercent === maxPercent) {
    return {
      left: '50%',
      width: '0px',
      transform: 'translateX(-50%)',
    } as const;
  }

  return {
    left: `calc(${minPercent}% - 12px)`,
    width: `calc(${maxPercent - minPercent}% + 24px)`,
    transform: 'none',
  } as const;
}

function getThumbStyle(percent: number) {
  return {
    left: `calc(${percent}% - 12px)`,
    top: '-8px',
  } as const;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function snapToStep(value: number, min: number, step: number) {
  if (step <= 0) {
    return value;
  }

  const stepCount = Math.round((value - min) / step);
  return min + stepCount * step;
}

function toPercent(value: number, min: number, max: number) {
  if (max <= min) {
    return 0;
  }

  return ((value - min) / (max - min)) * 100;
}

export function RangeSlider({
  className = '',
  min = 0,
  max = 100,
  step = 1,
  unit = '',
  defaultMinValue,
  defaultMaxValue,
  onValueChange,
  ...rest
}: RangeSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const normalizedMin = Math.min(min, max);
  const normalizedMax = Math.max(min, max);
  const fallbackMinValue = normalizedMin;
  const fallbackMaxValue = normalizedMax;
  const showSecondThumb = true;

  const [minValue, setMinValue] = useState(() => {
    const nextMin = clamp(
      defaultMinValue ?? fallbackMinValue,
      normalizedMin,
      normalizedMax,
    );
    return nextMin;
  });
  const [maxValue, setMaxValue] = useState(() => {
    const nextMin = clamp(
      defaultMinValue ?? fallbackMinValue,
      normalizedMin,
      normalizedMax,
    );
    return clamp(
      Math.max(defaultMaxValue ?? fallbackMaxValue, nextMin),
      normalizedMin,
      normalizedMax,
    );
  });

  useEffect(() => {
    onValueChange?.({ minValue, maxValue });
  }, [maxValue, minValue, onValueChange]);

  const minPercent = useMemo(
    () => toPercent(minValue, normalizedMin, normalizedMax),
    [minValue, normalizedMax, normalizedMin],
  );
  const maxPercent = useMemo(
    () => toPercent(maxValue, normalizedMin, normalizedMax),
    [maxValue, normalizedMax, normalizedMin],
  );
  const surfaceStyle = getSurfaceStyle(minPercent, maxPercent);

  const roundedMin = Math.round(minValue);
  const roundedMax = Math.round(maxValue);
  const formatValue = (value: number) =>
    unit === 'time' ? formatCookingTime(value) : `${value}${unit}`;
  const isFull = roundedMin === normalizedMin && roundedMax === normalizedMax;
  const isEqual = roundedMin === roundedMax;
  const isLte = roundedMin === normalizedMin;
  const isGte = roundedMax === normalizedMax;

  const label = isFull
    ? '전체'
    : isEqual
      ? formatValue(roundedMin)
      : isLte
        ? `${formatValue(roundedMax)} 이하`
        : isGte
          ? `${formatValue(roundedMin)} 이상`
          : `${formatValue(roundedMin)} ~ ${formatValue(roundedMax)}`;

  const getValueFromClientX = (clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect || rect.width <= 0) {
      return minValue;
    }

    const ratio = clamp((clientX - rect.left) / rect.width, 0, 1);
    const rawValue = normalizedMin + ratio * (normalizedMax - normalizedMin);
    return clamp(
      snapToStep(rawValue, normalizedMin, step),
      normalizedMin,
      normalizedMax,
    );
  };

  const updateMinValue = (next: number) => {
    setMinValue(clamp(Math.min(next, maxValue), normalizedMin, normalizedMax));
  };

  const updateMaxValue = (next: number) => {
    setMaxValue(clamp(Math.max(next, minValue), normalizedMin, normalizedMax));
  };

  const handleTrackPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    const target = event.target;
    if (target instanceof Element && target.closest("button[role='slider']")) {
      return;
    }

    const next = getValueFromClientX(event.clientX);
    const distanceToMin = Math.abs(next - minValue);
    const distanceToMax = Math.abs(next - maxValue);

    if (distanceToMin === distanceToMax) {
      if (next >= minValue) {
        updateMaxValue(next);
        return;
      }

      updateMinValue(next);
      return;
    }

    if (distanceToMin < distanceToMax) {
      updateMinValue(next);
      return;
    }

    updateMaxValue(next);
  };

  const handleThumbPointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleThumbPointerMove =
    (thumb: 'min' | 'max') => (event: PointerEvent<HTMLButtonElement>) => {
      if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
        return;
      }

      const next = getValueFromClientX(event.clientX);
      if (thumb === 'min') {
        updateMinValue(next);
        return;
      }
      updateMaxValue(next);
    };

  const handleThumbPointerUp = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleThumbKeyDown =
    (thumb: 'min' | 'max') => (event: KeyboardEvent<HTMLButtonElement>) => {
      const multiplier =
        event.key === 'PageUp' || event.key === 'PageDown' ? 10 : 1;
      const delta = step * multiplier;
      const currentValue = thumb === 'min' ? minValue : maxValue;

      if (
        event.key === 'ArrowLeft' ||
        event.key === 'ArrowDown' ||
        event.key === 'PageDown'
      ) {
        event.preventDefault();
        const next = clamp(currentValue - delta, normalizedMin, normalizedMax);
        if (thumb === 'min') {
          updateMinValue(next);
          return;
        }
        updateMaxValue(next);
      }

      if (
        event.key === 'ArrowRight' ||
        event.key === 'ArrowUp' ||
        event.key === 'PageUp'
      ) {
        event.preventDefault();
        const next = clamp(currentValue + delta, normalizedMin, normalizedMax);
        if (thumb === 'min') {
          updateMinValue(next);
          return;
        }
        updateMaxValue(next);
      }

      if (event.key === 'Home') {
        event.preventDefault();
        if (thumb === 'min') {
          updateMinValue(normalizedMin);
          return;
        }
        updateMaxValue(minValue);
      }

      if (event.key === 'End') {
        event.preventDefault();
        if (thumb === 'min') {
          updateMinValue(maxValue);
          return;
        }
        updateMaxValue(normalizedMax);
      }
    };

  return (
    <div
      className={cn('flex w-full flex-col items-center gap-4 pb-8', className)}
      data-name="RangeSlider"
      aria-label={buildAriaLabel('section', '범위 슬라이더')}
      {...rest}
    >
      <p className="typo-label-dropdown style-text-accent">{label}</p>
      <div className="w-full px-3">
        <div
          ref={trackRef}
          className="relative h-2 w-full rounded-full bg-background-placeholder"
          onPointerDown={handleTrackPointerDown}
        >
          <div
            className="absolute top-0 h-2 rounded-full bg-primary-default"
            style={surfaceStyle}
            aria-hidden
          />
          <button
            type="button"
            className="absolute z-20 size-6 rounded-full bg-background-surface p-0.5 shadow-(--semantic-shadow-md) outline-none focus-visible:ring-2 focus-visible:ring-primary-default"
            style={getThumbStyle(minPercent)}
            role="slider"
            aria-label={buildAriaLabel('button', '최소 값')}
            aria-valuemin={normalizedMin}
            aria-valuemax={showSecondThumb ? maxValue : normalizedMax}
            aria-valuenow={Math.round(minValue)}
            onPointerDown={handleThumbPointerDown}
            onPointerMove={handleThumbPointerMove('min')}
            onPointerUp={handleThumbPointerUp}
            onPointerCancel={handleThumbPointerUp}
            onKeyDown={handleThumbKeyDown('min')}
          >
            <span className="block size-full rounded-full bg-primary-default shadow-(--semantic-shadow-sm)" />
          </button>
          {showSecondThumb && (
            <button
              type="button"
              className="absolute z-30 size-6 rounded-full bg-background-surface p-0.5 shadow-(--semantic-shadow-md) outline-none focus-visible:ring-2 focus-visible:ring-primary-default"
              style={getThumbStyle(maxPercent)}
              role="slider"
              aria-label={buildAriaLabel('button', '최대 값')}
              aria-valuemin={minValue}
              aria-valuemax={normalizedMax}
              aria-valuenow={Math.round(maxValue)}
              onPointerDown={handleThumbPointerDown}
              onPointerMove={handleThumbPointerMove('max')}
              onPointerUp={handleThumbPointerUp}
              onPointerCancel={handleThumbPointerUp}
              onKeyDown={handleThumbKeyDown('max')}
            >
              <span className="block size-full rounded-full bg-primary-default shadow-(--semantic-shadow-sm)" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
