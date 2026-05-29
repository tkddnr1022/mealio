import Image, { type ImageProps } from 'next/image';
import { forwardRef, type ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';
import { isNativeImageSrc } from '@/lib/utils/isNativeImageSrc';

/** `<img>`에 전달하면 안 되는 Next `Image` 전용 키 */
const NEXT_IMAGE_ONLY_KEYS = [
  'loader',
  'placeholder',
  'blurDataURL',
  'overrideSrc',
  'onLoadingComplete',
  'lazyBoundary',
  'lazyRoot',
] as const satisfies readonly (keyof ImageProps)[];

export type AdaptiveImageProps = {
  src: string;
  alt: string;
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
  quality?: number;
  unoptimized?: boolean;
  width?: number | `${number}`;
  height?: number | `${number}`;
} & Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  'src' | 'alt' | 'width' | 'height'
>;

function imgPropsFromAdaptiveImageRest(
  rest: Omit<AdaptiveImageProps, 'src' | 'alt'>,
): ImgHTMLAttributes<HTMLImageElement> {
  const out: Record<string, unknown> = { ...rest };
  for (const key of NEXT_IMAGE_ONLY_KEYS) {
    delete out[key];
  }
  delete out.fill;
  delete out.priority;
  delete out.quality;
  delete out.unoptimized;
  return out as ImgHTMLAttributes<HTMLImageElement>;
}

/**
 * `src`가 외부·data URL이면 `<img>`, 앱 내 정적 경로 등은 `next/image`로 렌더한다.
 * {@link isNativeImageSrc} 규칙을 따른다.
 */
export const AdaptiveImage = forwardRef<HTMLImageElement, AdaptiveImageProps>(
  function AdaptiveImage(
    {
      src,
      alt,
      fill = false,
      sizes,
      priority,
      unoptimized,
      width,
      height,
      className,
      loading,
      ...rest
    },
    ref,
  ) {
    if (isNativeImageSrc(src)) {
      const imgClassName = fill
        ? cn('absolute inset-0 size-full object-cover', className)
        : className;

      return (
        <img
          ref={ref}
          src={src}
          alt={alt}
          width={fill ? undefined : width}
          height={fill ? undefined : height}
          sizes={sizes}
          loading={priority ? 'eager' : loading}
          className={imgClassName}
          {...imgPropsFromAdaptiveImageRest(rest)}
        />
      );
    }

    return (
      <Image
        ref={ref}
        src={src}
        alt={alt}
        fill={fill}
        sizes={sizes}
        priority={priority}
        unoptimized={unoptimized}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        className={className}
        loading={loading}
        {...rest}
      />
    );
  },
);

AdaptiveImage.displayName = 'AdaptiveImage';
