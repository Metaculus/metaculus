import Image, { type ImageProps } from "next/image";
import type { CSSProperties } from "react";

import cn from "@/utils/core/cn";

type Props = {
  src: ImageProps["src"];
  alt?: string;
  className?: string;
  perspective?: number;
  origin?: "left" | "right";
  layerSrcs?: [ImageProps["src"], ImageProps["src"], ImageProps["src"]];
};

const ease = "ease-[cubic-bezier(0.16,1,0.3,1)]";

type Vars = CSSProperties & {
  ["--spi-perspective"]?: string;
  ["--spi-back"]?: string;
  ["--spi-mid"]?: string;
  ["--spi-front"]?: string;
};

export default function StackedPreviewImage({
  src,
  alt,
  className,
  perspective = 1400,
  origin = "right",
  layerSrcs,
}: Props) {
  const [backSrc, midSrc, frontSrc] = layerSrcs ?? [src, src, src];
  const originClass = origin === "right" ? "origin-right" : "origin-left";

  const sign = origin === "right" ? "-" : "";

  const styleVars: Vars = {
    "--spi-perspective": `${perspective}px`,
    "--spi-back": `rotateY(${sign}30deg) translateZ(-20px) scale(0.97)`,
    "--spi-mid": `rotateY(${sign}25deg) translateZ(-7.5px) scale(0.985)`,
    "--spi-front": `rotateY(${sign}20deg) translateZ(10px)`,
  };

  const sizeClass = "h-[50px] sm:h-[200px] w-auto";

  return (
    <div
      style={styleVars}
      className={cn(
        "relative isolate w-fit [transform-style:preserve-3d]",
        "[perspective:var(--spi-perspective)]",
        "h-[50px] sm:h-[200px]",
        className
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-0 z-0 overflow-hidden rounded",
          originClass,
          "transform-gpu opacity-0 [transform-style:preserve-3d]",
          `transition-[transform,opacity] duration-[800ms] ${ease}`,
          "group-hover/preview:opacity-100",
          "group-hover/preview:[transform:var(--spi-back)]"
        )}
      >
        <Image
          src={backSrc}
          alt=""
          height={200}
          className={cn(
            sizeClass,
            "rounded object-cover opacity-70 brightness-[0.98]"
          )}
          unoptimized
        />
      </div>

      <div
        className={cn(
          "pointer-events-none absolute inset-0 z-10 overflow-hidden rounded",
          originClass,
          "transform-gpu opacity-0 [transform-style:preserve-3d]",
          `transition-[transform,opacity] duration-[800ms] ${ease} delay-75`,
          "group-hover/preview:opacity-100",
          "group-hover/preview:[transform:var(--spi-mid)]"
        )}
      >
        <Image
          src={midSrc}
          alt=""
          height={200}
          className={cn(sizeClass, "rounded object-cover opacity-85")}
          unoptimized
        />
      </div>

      <div
        className={cn(
          "relative z-20 overflow-hidden rounded",
          originClass,
          "transform-gpu [transform-style:preserve-3d]",
          `transition-transform duration-[800ms] ${ease}`,
          "group-hover/preview:[transform:var(--spi-front)]"
        )}
      >
        <Image
          src={frontSrc}
          alt={alt ?? "Preview"}
          height={200}
          className={cn(sizeClass, "rounded object-cover")}
          unoptimized
        />
      </div>
    </div>
  );
}
