"use client";

import type { StaticImageData } from "next/image";
import Image from "next/image";

import openAiLight from "@/app/(main)/aib/assets/ai-models/openai.svg?url";
import openAiDark from "@/app/(main)/aib/assets/ai-models/openai_dark.svg?url";
import cn from "@/utils/core/cn";

export type IconLike = StaticImageData | string;

export const LightDarkIcon: React.FC<{
  alt: string;
  light?: IconLike;
  dark?: IconLike;
  sizePx?: number | string;
  variant?: "icon" | "logo";
  className?: string;
}> = ({ alt, light, dark, sizePx = 20, variant = "icon", className }) => {
  const lightSrc = light ?? dark ?? openAiLight;
  const darkSrc = dark ?? light ?? openAiDark;

  const px = typeof sizePx === "number" ? `${sizePx}px` : sizePx;

  if (variant === "logo") {
    const toUrl = (src: IconLike) => (typeof src === "string" ? src : src.src);

    return (
      <span
        className={cn("inline-flex items-center", className)}
        style={{ height: px }}
      >
        <img
          src={toUrl(lightSrc)}
          alt={alt}
          className="h-full w-auto object-contain dark:hidden"
          loading="lazy"
        />
        <img
          src={toUrl(darkSrc)}
          alt={alt}
          className="hidden h-full w-auto object-contain dark:block"
          loading="lazy"
        />
      </span>
    );
  }

  return (
    <span
      className={`relative inline-block h-4 w-4 sm:h-5 sm:w-5 ${className ?? ""}`}
    >
      <Image
        src={lightSrc as StaticImageData}
        alt={alt}
        fill
        sizes={px}
        className={cn("block object-contain dark:hidden", className)}
      />
      <Image
        src={darkSrc as StaticImageData}
        alt={alt}
        fill
        sizes={px}
        className={cn("hidden object-contain dark:block", className)}
      />
    </span>
  );
};
