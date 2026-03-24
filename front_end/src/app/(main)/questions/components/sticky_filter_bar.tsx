"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

import { useContentTranslatedBannerContext } from "@/contexts/translations_banner_context";
import cn from "@/utils/core/cn";

const glassClasses = cn(
  "bg-blue-200/70 dark:bg-blue-50-dark/45",
  "backdrop-blur-md",
  "border-b border-blue-400/50 dark:border-blue-400-dark/50"
);

const StickyFilterBar: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const stickyRef = useRef<HTMLDivElement | null>(null);
  const obsRef = useRef<IntersectionObserver | null>(null);
  const [isStuck, setIsStuck] = useState(false);

  const { bannerIsVisible: isTranslationBannerVisible } =
    useContentTranslatedBannerContext();

  const setupObserver = useCallback(() => {
    const sentinel = sentinelRef.current;
    const sticky = stickyRef.current;
    if (!sentinel || !sticky) return;

    obsRef.current?.disconnect();

    const stickyTop = Math.round(parseFloat(getComputedStyle(sticky).top));

    const obs = new IntersectionObserver(
      ([entry]) => setIsStuck(!entry?.isIntersecting),
      {
        root: null,
        threshold: 0,
        rootMargin: `-${stickyTop}px 0px 0px 0px`,
      }
    );

    obs.observe(sentinel);
    obsRef.current = obs;
  }, []);

  useEffect(() => {
    // rAF ensures the new sticky top class is applied before we read getComputedStyle
    const rafId = requestAnimationFrame(() => {
      setupObserver();
    });

    const mql = window.matchMedia("(min-width: 640px)");
    const onBreakpoint = () => setupObserver();
    mql.addEventListener("change", onBreakpoint);

    const ro = new ResizeObserver(() => setupObserver());
    if (stickyRef.current) ro.observe(stickyRef.current);

    return () => {
      cancelAnimationFrame(rafId);
      obsRef.current?.disconnect();
      mql.removeEventListener("change", onBreakpoint);
      ro.disconnect();
    };
  }, [setupObserver, isTranslationBannerVisible]);

  return (
    <>
      <div ref={sentinelRef} className="h-px w-full" aria-hidden />

      <div
        ref={stickyRef}
        className={cn(
          "sticky z-40",
          isTranslationBannerVisible
            ? "top-[calc(var(--feed-sidebar-mobile-height,0px)+6rem)] sm:top-20"
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
