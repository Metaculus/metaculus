"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

import cn from "@/utils/core/cn";

const glassClasses = cn(
  "max-sm:bg-gray-0/70 max-sm:dark:bg-gray-0-dark/70 sm:bg-blue-200/70 sm:dark:bg-blue-50-dark/45",
  "backdrop-blur-md",
  "border-b border-blue-400/50 dark:border-blue-400-dark/50"
);

const StickyFilterBar: React.FC<{
  children: React.ReactNode;
  desktopOnly?: boolean;
}> = ({ children, desktopOnly }) => {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const stickyRef = useRef<HTMLDivElement | null>(null);
  const obsRef = useRef<IntersectionObserver | null>(null);
  const [isStuck, setIsStuck] = useState(false);

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
  }, [setupObserver]);

  return (
    <>
      <div
        ref={sentinelRef}
        className={cn("h-0 w-full sm:h-px", desktopOnly && "max-sm:hidden")}
        aria-hidden
      />

      <div
        ref={stickyRef}
        className={cn(
          "sticky top-[calc(var(--feed-sidebar-mobile-height,0px)+var(--top-chrome-height,3rem))] z-40 sm:top-header",
          "transition-[background-color,backdrop-filter,border-color] duration-200",
          "max-sm:border-b max-sm:border-blue-400 max-sm:bg-gray-0/70 max-sm:backdrop-blur-md max-sm:dark:border-blue-700 max-sm:dark:bg-gray-0-dark/70",
          isStuck
            ? glassClasses
            : "sm:border-b sm:border-transparent sm:bg-transparent",
          desktopOnly && "max-sm:hidden"
        )}
      >
        <div className="mx-auto max-w-5xl px-2 pb-2 pt-0 [--posts-filter-rail-bleed-left:0.5rem] sm:p-4 sm:[--posts-filter-rail-bleed-left:1rem]">
          {children}
        </div>
      </div>
    </>
  );
};

export default StickyFilterBar;
