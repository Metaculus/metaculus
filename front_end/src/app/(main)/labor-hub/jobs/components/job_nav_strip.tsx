"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef } from "react";

import ReusableGradientCarousel from "@/components/gradient-carousel";
import cn from "@/utils/core/cn";

import { formatSignedPercent } from "../helpers/format";

type JobNavItem = { slug: string; name: string; value2035: number | null };

type Props = {
  current: string;
  items: JobNavItem[];
};

// In-memory retained scroll position. Persists across client-side navigations
// between job pages (the module stays loaded) and resets on a true full reload
// — so switching jobs retains the strip position, while a fresh visit centers
// the active pill.
let retainedScrollLeft: number | null = null;

function valueColor(value: number | null): string {
  if (value == null) return "";
  if (value > 0) return "text-mc-option-3 dark:text-mc-option-3-dark";
  if (value < 0) return "text-mc-option-2 dark:text-mc-option-2-dark";
  return "text-blue-700 dark:text-blue-700-dark";
}

export function JobNavStrip({ current, items }: Props) {
  const t = useTranslations();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const activeRef = useRef<HTMLAnchorElement | null>(null);

  // Retain horizontal scroll across job switches; center the active pill only
  // on a fresh visit (retainedScrollLeft is null at module load).
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const viewport = root.querySelector<HTMLDivElement>(".overflow-x-auto");
    if (!viewport) return;

    const isLaidOut = () => viewport.scrollWidth > viewport.clientWidth;

    const centerActive = () => {
      const active =
        activeRef.current ??
        viewport.querySelector<HTMLAnchorElement>("[data-active-pill='true']");
      if (!active) return;
      const vpRect = viewport.getBoundingClientRect();
      const actRect = active.getBoundingClientRect();
      const offsetFromViewportLeft =
        actRect.left - vpRect.left + viewport.scrollLeft;
      const target =
        offsetFromViewportLeft - vpRect.width / 2 + actRect.width / 2;
      viewport.scrollLeft = Math.max(
        0,
        Math.min(target, viewport.scrollWidth - viewport.clientWidth)
      );
    };

    const apply = () => {
      if (!isLaidOut()) return;
      if (retainedScrollLeft != null) {
        viewport.scrollLeft = retainedScrollLeft;
      } else {
        centerActive();
        retainedScrollLeft = viewport.scrollLeft;
      }
    };

    // Two frames: the first may run before the carousel has measured, the
    // second is after layout so scrollLeft sticks.
    const raf1 = requestAnimationFrame(() => {
      apply();
      requestAnimationFrame(apply);
    });

    const onScroll = () => {
      retainedScrollLeft = viewport.scrollLeft;
    };
    viewport.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf1);
      viewport.removeEventListener("scroll", onScroll);
    };
  }, [current]);

  const handlePillRef = useCallback(
    (slug: string) => (node: HTMLAnchorElement | null) => {
      if (slug === current) activeRef.current = node;
    },
    [current]
  );

  return (
    <div ref={containerRef} className="flex items-center gap-3">
      <span className="hidden shrink-0 text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-700-dark sm:inline">
        {t("laborHubJobsJumpToLabel")}
      </span>
      <div className="min-w-0 flex-1 [&>div]:relative" data-jump-to-wrapper>
        <ReusableGradientCarousel
          items={items}
          itemClassName="w-auto"
          gapClassName="gap-2"
          slideBy={{ mode: "items", count: 3 }}
          gradientFromClass="from-gray-0 dark:from-gray-0-dark"
          gradientWidthClass="w-[60px] sm:w-[100px]"
          listClassName="px-0 pb-0"
          fadeMs={0}
          viewportClassName="[&]:overflow-x-auto"
          showArrows={true}
          arrowClassName="hidden md:inline-flex items-center justify-center w-9 h-9 rounded-full bg-blue-900 text-gray-0 dark:bg-blue-900-dark dark:text-gray-0-dark shadow-sm !transition-none"
          arrowLeftPosition="left-0"
          arrowRightPosition="right-0"
          renderItem={(item) => {
            const isActive = item.slug === current;
            return (
              <Link
                ref={handlePillRef(item.slug)}
                data-active-pill={isActive ? "true" : undefined}
                aria-current={isActive ? "page" : undefined}
                href={`/labor-hub/jobs/${item.slug}/`}
                scroll={false}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium no-underline transition-colors",
                  isActive
                    ? "bg-blue-900 text-gray-0 dark:bg-blue-900-dark dark:text-gray-0-dark"
                    : "bg-blue-200 text-blue-800 hover:bg-blue-300 dark:bg-blue-200-dark dark:text-blue-800-dark dark:hover:bg-blue-300-dark"
                )}
              >
                <span>{item.name}</span>
                {item.value2035 != null && (
                  <span
                    className={cn(
                      "font-jetbrains-mono text-sm font-bold tabular-nums",
                      valueColor(item.value2035)
                    )}
                  >
                    {formatSignedPercent(item.value2035)}
                  </span>
                )}
              </Link>
            );
          }}
        />
      </div>
    </div>
  );
}
