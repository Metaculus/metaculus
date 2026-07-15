"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useLayoutEffect, useRef } from "react";

import ReusableGradientCarousel from "@/components/gradient-carousel";
import cn from "@/utils/core/cn";

import { formatSignedPercent } from "../helpers/format";

// useLayoutEffect on the client (so the scroll position is set before paint),
// useEffect on the server (avoids the SSR warning).
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

type JobNavItem = { slug: string; name: string; value2035: number | null };

type Props = {
  current: string;
  items: JobNavItem[];
};

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

  // Center the active pill instantly on mount (fresh load and client-side
  // job→job navigation). Runs after layout but before paint, so the strip is
  // already in position with no visible scroll animation, and the active chip
  // is always revealed regardless of where it sits in the list.
  useIsomorphicLayoutEffect(() => {
    const viewport =
      containerRef.current?.querySelector<HTMLDivElement>(".overflow-x-auto");
    const active =
      activeRef.current ??
      viewport?.querySelector<HTMLAnchorElement>("[data-active-pill='true']");
    if (!viewport || !active) return;

    const vp = viewport.getBoundingClientRect();
    const a = active.getBoundingClientRect();
    const target =
      viewport.scrollLeft + (a.left - vp.left) - (vp.width - a.width) / 2;
    viewport.scrollLeft = Math.max(
      0,
      Math.min(target, viewport.scrollWidth - viewport.clientWidth)
    );
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
          gradientWidthClass="w-[15px] sm:w-[100px]"
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
