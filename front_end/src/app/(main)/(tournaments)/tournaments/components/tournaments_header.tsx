"use client";

import React, { useEffect, useRef, useState } from "react";

import { useBreakpoint } from "@/hooks/tailwind";
import { useTopChromeHeightPx } from "@/hooks/use_top_chrome_height";
import cn from "@/utils/core/cn";

import TournamentsTabs from "./tournament_tabs";
import TournamentsFilter from "./tournaments_filter";
import TournamentsInfoPopover from "./tournaments_popover/tournaments_info_popover";
import { useTournamentsSection } from "./tournaments_provider";
import TournamentsSearch from "./tournaments_search";
import { useTournamentsInfoDismissed } from "../hooks/use_tournaments_info_dismissed";

const POPOVER_GAP = 10;

const TournamentsHeader: React.FC = () => {
  const { current, isSearching, infoOpen, toggleInfo, closeInfo } =
    useTournamentsSection();
  const {
    dismissed,
    dismiss: infoDismiss,
    ready,
  } = useTournamentsInfoDismissed();

  const didInitDismissCheck = useRef(false);
  useEffect(() => {
    if (!ready) return;
    if (didInitDismissCheck.current) return;
    didInitDismissCheck.current = true;

    if (dismissed && infoOpen) closeInfo();
  }, [ready, dismissed, infoOpen, closeInfo]);

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const isLg = useBreakpoint("lg");
  const topChromeHeight = useTopChromeHeightPx();
  const [stuck, setStuck] = useState(!isLg);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !isLg) return;

    const obs = new IntersectionObserver(
      ([entry]) => setStuck(!entry?.isIntersecting),
      {
        root: null,
        threshold: 0,
        rootMargin: `-${topChromeHeight}px 0px 0px 0px`,
      }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [isLg, topChromeHeight]);

  const showInfo = true;

  return (
    <>
      <div ref={sentinelRef} className="h-px w-full" aria-hidden />

      <div
        id="tournamentsStickyHeader"
        className={cn(
          "sticky top-header z-40",
          stuck || !isLg ? popoverSafeGlassClasses : "bg-transparent"
        )}
      >
        <div className="mx-auto max-w-[1150px] px-3 py-2 sm:px-8 md:py-3">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <TournamentsTabs current={current} />
            </div>

            <div className="hidden items-center gap-3 lg:flex">
              {current !== "indexes" && <TournamentsFilter />}
              <TournamentsSearch />

              {showInfo && isLg && current !== "indexes" && !isSearching ? (
                <TournamentsInfoPopover
                  open={infoOpen}
                  onOpenChange={(next) => {
                    if (next) {
                      toggleInfo();
                      return;
                    }

                    infoDismiss();
                    closeInfo();
                  }}
                  offsetPx={POPOVER_GAP}
                  stickyTopPx={topChromeHeight}
                />
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const popoverSafeGlassClasses = cn(
  "bg-white/70 dark:bg-slate-950/45",
  "backdrop-blur-md supports-[backdrop-filter]:backdrop-blur-md",
  "border-b border-blue-400/50 dark:border-blue-400-dark/50"
);

export default TournamentsHeader;
