"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef } from "react";

import ReusableGradientCarousel from "@/components/gradient-carousel";
import cn from "@/utils/core/cn";

type JobNavItem = { slug: string; name: string; value2035: number | null };

type Props = {
  current: string;
  items: JobNavItem[];
};

const STORAGE_KEY = "labor-hub-jump-to-scroll";

function formatPercent(value: number | null): string {
  if (value == null) return "";
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${sign}${Math.abs(value).toFixed(0)}%`;
}

export function JobNavStrip({ current, items }: Props) {
  const t = useTranslations();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const activeRef = useRef<HTMLAnchorElement | null>(null);

  // Persist + restore horizontal scroll position across visits.
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const viewport = root.querySelector<HTMLDivElement>(".overflow-x-auto");
    if (!viewport) return;

    let savedScroll: number | null = null;
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = Number(raw);
        if (!Number.isNaN(parsed)) savedScroll = parsed;
      }
    } catch {
      /* ignore */
    }

    const ensureActiveVisible = () => {
      const active =
        activeRef.current ??
        viewport.querySelector<HTMLAnchorElement>("[data-active-pill='true']");
      if (!active) return;
      const vpRect = viewport.getBoundingClientRect();
      const actRect = active.getBoundingClientRect();
      const margin = 16;
      const isFullyVisible =
        actRect.left >= vpRect.left - 1 && actRect.right <= vpRect.right + 1;
      if (isFullyVisible) return;
      const offsetFromViewportLeft =
        actRect.left - vpRect.left + viewport.scrollLeft;
      const target =
        offsetFromViewportLeft - vpRect.width / 2 + actRect.width / 2;
      viewport.scrollLeft = Math.max(
        margin,
        Math.min(target, viewport.scrollWidth - viewport.clientWidth)
      );
    };

    if (savedScroll != null) viewport.scrollLeft = savedScroll;
    // Always re-center the active pill if it's off-screen after restore.
    // requestAnimationFrame so the DOM has finished laying out.
    const raf = requestAnimationFrame(ensureActiveVisible);

    const onScroll = () => {
      try {
        sessionStorage.setItem(STORAGE_KEY, String(viewport.scrollLeft));
      } catch {
        /* ignore */
      }
    };
    viewport.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
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
                    : "bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-100-dark dark:text-blue-800-dark dark:hover:bg-blue-200-dark"
                )}
              >
                <span>{item.name}</span>
                {item.value2035 != null && (
                  <span
                    className={cn(
                      "font-jetbrains-mono text-xs font-bold tabular-nums",
                      isActive ? "opacity-80" : "opacity-70"
                    )}
                  >
                    {formatPercent(item.value2035)}
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
