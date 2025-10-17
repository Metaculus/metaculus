import Image, { StaticImageData } from "next/image";
import React, { ComponentType, SVGProps } from "react";

import cn from "@/utils/core/cn";

type IconLike = StaticImageData | ComponentType<SVGProps<SVGSVGElement>>;

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
  const isStatic = icon && typeof icon === "object" && "src" in icon;

  if (isStatic) {
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

  const Svg = icon as ComponentType<SVGProps<SVGSVGElement>>;
  return (
    <Svg
      role="img"
      aria-label={alt}
      className={cn("h-full w-full", className)}
    />
  );
}
