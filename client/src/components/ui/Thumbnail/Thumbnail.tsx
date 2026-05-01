import Image from "next/image";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export interface ThumbnailProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
className?: string;
imageUrl: string;
imageAlt?: string;
square?: boolean;
}

export function Thumbnail({
  className = "",
  imageUrl,
  imageAlt = "",
  square = true,
  ...rest
}: ThumbnailProps) {
  return (
    <div
      className={cn(
        "relative w-full overflow-hidden bg-background-placeholder",
        square ? "aspect-square" : "aspect-video",
        className,
      )}
      data-name="Thumbnail"
      {...rest}
    >
      <Image
        alt={imageAlt}
        className="object-cover"
        src={imageUrl}
        fill
        sizes={square ? "(max-width: 767px) 60vw, 360px" : "(max-width: 767px) 90vw, 360px"}
        unoptimized
      />
    </div>
  );
}
