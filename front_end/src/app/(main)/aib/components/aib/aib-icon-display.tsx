import Image, { StaticImageData } from "next/image";

import cn from "@/utils/core/cn";

type IconLike = StaticImageData | string;

export function IconDisplay({
  icon,
  alt,
  className,
  sizes = "20px",
}: {
  icon: IconLike;
  alt: string;
  className?: string;
  sizes?: string;
}) {
  return (
    <Image
      src={icon as StaticImageData}
      alt={alt}
      fill
      sizes={sizes}
      className={cn("object-contain", className)}
    />
  );
}
