"use client";

import { useTranslations } from "next-intl";
import { FC, RefObject, useCallback, useEffect, useRef, useState } from "react";

import Button from "@/components/ui/button";
import LayoutSwitcher from "@/components/ui/layout_switcher";
import cn from "@/utils/core/cn";

import { InitiativesInventoryFilter, InitiativesInventoryView } from "../types";

const RAIL_FADE =
  "linear-gradient(to right, black calc(100% - 24px), transparent)";

type Props = {
  filters: InitiativesInventoryFilter[];
  activeFilterId: string;
  onFilterChange: (filterId: string) => void;
  view: InitiativesInventoryView;
  onViewChange: (view: InitiativesInventoryView) => void;
  resultsId?: string;
  containerRef: RefObject<HTMLDivElement | null>;
};

// Floats over the inventory instead of taking a row: the negative margins
// cancel the box's height, so it sticks under the site header without
// pushing content down and still stops at the end of the inventory. On mobile
// it becomes the feed's frosted bar once stuck.
const InventoryToolbar: FC<Props> = ({
  filters,
  activeFilterId,
  onFilterChange,
  view,
  onViewChange,
  resultsId,
  containerRef,
}) => {
  const t = useTranslations();
  const railRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [canScrollRail, setCanScrollRail] = useState(false);
  const [isStuck, setIsStuck] = useState(false);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    const bar = containerRef.current;
    if (!sentinel || !bar) return;

    let observer: IntersectionObserver | undefined;
    const observe = () => {
      observer?.disconnect();
      const stickyTop = Math.max(
        0,
        Math.round(parseFloat(getComputedStyle(bar).top) || 0)
      );
      observer = new IntersectionObserver(
        ([entry]) => {
          if (!entry) return;
          setIsStuck(
            !entry.isIntersecting &&
              entry.boundingClientRect.top < (entry.rootBounds?.top ?? 0)
          );
        },
        { rootMargin: `-${stickyTop}px 0px 0px 0px` }
      );
      observer.observe(sentinel);
    };

    observe();
    const resizeObserver = new ResizeObserver(observe);
    resizeObserver.observe(bar);

    return () => {
      observer?.disconnect();
      resizeObserver.disconnect();
    };
  }, [containerRef]);

  const updateRailFade = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;
    setCanScrollRail(rail.scrollLeft + rail.clientWidth < rail.scrollWidth - 1);
  }, []);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;

    const observer = new ResizeObserver(updateRailFade);
    observer.observe(rail);
    if (rail.firstElementChild) observer.observe(rail.firstElementChild);
    rail.addEventListener("scroll", updateRailFade, { passive: true });

    return () => {
      observer.disconnect();
      rail.removeEventListener("scroll", updateRailFade);
    };
  }, [updateRailFade, view]);

  return (
    <>
      <div ref={sentinelRef} aria-hidden="true" className="h-0" />
      <div
        ref={containerRef}
        className={cn(
          "pointer-events-none sticky top-[calc(var(--top-chrome-height,3rem)+0.75rem)] z-20 flex items-center gap-3 sm:-mb-[38px] sm:h-[38px]",
          "max-sm:top-header max-sm:-mx-5 max-sm:-mb-[43px] max-sm:-mt-2 max-sm:h-[51px] max-sm:border-b max-sm:border-transparent max-sm:px-5 max-sm:py-2 max-sm:transition-[background-color,backdrop-filter,border-color] max-sm:duration-200",
          isStuck &&
            "max-sm:pointer-events-auto max-sm:border-blue-400 max-sm:bg-gray-0/70 max-sm:backdrop-blur-md max-sm:dark:border-blue-700 max-sm:dark:bg-gray-0-dark/70"
        )}
      >
        {view === "list" && (
          <div
            ref={railRef}
            role="group"
            aria-label={t("initiativesInventoryFilterLabel")}
            className="pointer-events-auto min-w-0 overflow-x-auto no-scrollbar"
            style={
              canScrollRail
                ? { maskImage: RAIL_FADE, WebkitMaskImage: RAIL_FADE }
                : undefined
            }
          >
            <div className="flex w-max gap-1.5 sm:gap-2">
              {filters.map(({ id, labelKey }) => {
                const isActive = id === activeFilterId;

                return (
                  <Button
                    key={id}
                    variant={isActive ? "primary" : "tertiary"}
                    size="md"
                    aria-pressed={isActive}
                    aria-controls={resultsId}
                    onClick={() => onFilterChange(id)}
                    className="shrink-0 max-sm:h-7 max-sm:px-3 max-sm:py-0 max-sm:text-sm max-sm:font-medium max-sm:leading-5"
                  >
                    {t(labelKey)}
                  </Button>
                );
              })}
            </div>
          </div>
        )}

        <LayoutSwitcher
          value={view}
          onChange={onViewChange}
          className="pointer-events-auto ml-auto shrink-0"
        />
      </div>
    </>
  );
};

export default InventoryToolbar;
