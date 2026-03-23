"use client";

import React, { useEffect, useRef, useState } from "react";

import { useContentTranslatedBannerContext } from "@/contexts/translations_banner_context";
import cn from "@/utils/core/cn";

const STICKY_TOP = 48;

const glassClasses = cn(
  "bg-blue-200/70 dark:bg-blue-50-dark/45",
  "backdrop-blur-md supports-[backdrop-filter]:backdrop-blur-md",
  "border-b border-blue-400/50 dark:border-blue-400-dark/50"
);

const StickyFilterBar: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [isStuck, setIsStuck] = useState(false);

  const { bannerIsVisible: isTranslationBannerVisible } =
    useContentTranslatedBannerContext();

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => setIsStuck(!entry?.isIntersecting),
      {
        root: null,
        threshold: 0,
        rootMargin: `-${STICKY_TOP}px 0px 0px 0px`,
      }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <>
      <div ref={sentinelRef} className="h-px w-full" aria-hidden />

      <div
        className={cn(
          "sticky z-40",
          isTranslationBannerVisible
            ? "top-[calc(var(--feed-sidebar-mobile-height,0px)+3rem)] sm:top-24 lg:top-header"
            : "top-[calc(var(--feed-sidebar-mobile-height,0px)+3rem)] sm:top-header",
          "transition-[background-color,backdrop-filter,border-color] duration-200",
          isStuck ? glassClasses : "border-b border-transparent bg-transparent"
        )}
      >
        <div className="mx-auto max-w-5xl p-2 pt-2.5 sm:p-4">{children}</div>
      </div>
    </>
  );
};

export default StickyFilterBar;
