"use client";
import Image, { ImageProps } from "next/image";
import { FC, PropsWithChildren, useMemo, useState } from "react";

import cn from "@/utils/core/cn";

type Props = Omit<ImageProps, "fill" | "alt"> & { alt?: string };

const ImageWithFallback: FC<PropsWithChildren<Props>> = ({
  children,
  className,
  alt,
  style,
  ...imgProps
}) => {
  const [isFailed, setIsFailed] = useState(false);
  const safeAlt = useMemo(() => alt ?? "", [alt]);

  const shouldBypassOptimizer =
    imgProps.unoptimized ??
    (typeof imgProps.src === "string" && imgProps.src.startsWith("/"));

  if (isFailed) return children;

  const hasExplicitSize =
    typeof imgProps.width === "number" && typeof imgProps.height === "number";

  if (hasExplicitSize) {
    return (
      <Image
        {...imgProps}
        alt={safeAlt}
        className={className}
        style={style}
        unoptimized={shouldBypassOptimizer}
        onError={() => setIsFailed(true)}
      />
    );
  }

  return (
    <span
      className={cn("relative inline-block overflow-hidden", className)}
      style={style}
    >
      <Image
        {...imgProps}
        alt={safeAlt}
        fill
        sizes={imgProps.sizes ?? "2rem"}
        className="object-cover"
        unoptimized={shouldBypassOptimizer}
        onError={() => setIsFailed(true)}
      />
    </span>
  );
};

export default ImageWithFallback;
