"use client";

import { useTranslations } from "next-intl";
import { FC, Ref, useCallback, useEffect, useRef, useState } from "react";

import Button from "@/components/ui/button";
import LayoutSwitcher from "@/components/ui/layout_switcher";

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
  containerRef?: Ref<HTMLDivElement>;
};

// Floats over the inventory instead of taking a row: the negative margin
// cancels the box's height, so it sticks under the site header without
// pushing content down and still stops at the end of the inventory.
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
  const [canScrollRail, setCanScrollRail] = useState(false);

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
    <div
      ref={containerRef}
      className="pointer-events-none sticky top-[calc(var(--top-chrome-height,3rem)+0.75rem)] z-20 -mb-[34px] flex h-[34px] items-center gap-3 sm:-mb-[38px] sm:h-[38px]"
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
  );
};

export default InventoryToolbar;
