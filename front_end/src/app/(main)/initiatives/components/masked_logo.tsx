import Image from "next/image";
import { CSSProperties, FC } from "react";

import cn from "@/utils/core/cn";

import { resolveAssetSource } from "../helpers/assets";

type Props = {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  imageClassName?: string;
};

// Paints the logo's silhouette with the element's background colour, so
// single-colour SVGs can follow text colour and theme. The transparent image
// underneath keeps intrinsic sizing and alt text.
const MaskedLogo: FC<Props> = ({
  src,
  alt,
  width,
  height,
  className,
  imageClassName,
}) => {
  const source = resolveAssetSource(src);
  const mask = `url(${JSON.stringify(source.src)})`;

  return (
    <span
      className={cn("inline-block forced-colors:bg-[CanvasText]", className)}
      style={
        {
          maskImage: mask,
          WebkitMaskImage: mask,
          maskSize: "contain",
          WebkitMaskSize: "contain",
          maskRepeat: "no-repeat",
          WebkitMaskRepeat: "no-repeat",
          maskPosition: "center",
          WebkitMaskPosition: "center",
        } as CSSProperties
      }
    >
      <Image
        src={source.src}
        unoptimized={source.unoptimized}
        alt={alt}
        width={width}
        height={height}
        draggable={false}
        className={cn("block opacity-0", imageClassName)}
      />
    </span>
  );
};

export default MaskedLogo;
