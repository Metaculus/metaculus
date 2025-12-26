"use client";

import React, { useEffect, useRef, useState } from "react";

import { useBreakpoint } from "@/hooks/tailwind";
import cn from "@/utils/core/cn";

import TournamentsTabs from "./tournament_tabs";
import TournamentsFilter from "./tournaments_filter";
import TournamentsInfoPopover from "./tournaments_popover/tournaments_info_popover";
import { useTournamentsSection } from "./tournaments_provider";
import TournamentsSearch from "./tournaments_search";

const STICKY_TOP = 48;
const POPOVER_GAP = 10;

const TournamentsHeader: React.FC = () => {
  const { current, infoOpen, toggleInfo, closeInfo } = useTournamentsSection();

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const isLg = useBreakpoint("lg");
  const [stuck, setStuck] = useState(!isLg);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !isLg) return;

    const obs = new IntersectionObserver(
      ([entry]) => setStuck(!entry?.isIntersecting),
      {
        root: null,
        threshold: 0,
        rootMargin: `-${STICKY_TOP}px 0px 0px 0px`,
      }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [isLg]);

  const showInfo = true;

  return (
    <>
      <div ref={sentinelRef} className="h-px w-full" aria-hidden />

      <div
        id="tournamentsStickyHeader"
        className={cn(
          "sticky z-40",
          "ml-[calc(50%-50dvw)] w-[100dvw]",
          !isLg && "-mt-[52px]",
          stuck || !isLg ? popoverSafeGlassClasses : "bg-transparent"
        )}
        style={{ top: STICKY_TOP }}
      >
        <div className="mx-auto max-w-[1150px] px-6 py-2 sm:px-8 md:py-3">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <TournamentsTabs current={current} />
            </div>

            {current !== "indexes" && (
              <div className="hidden items-center gap-3 lg:flex">
                <TournamentsFilter />
                <TournamentsSearch />

                {showInfo && isLg ? (
                  <TournamentsInfoPopover
                    open={infoOpen}
                    onOpenChange={(next) => (next ? toggleInfo() : closeInfo())}
                    offsetPx={POPOVER_GAP}
                    stickyTopPx={STICKY_TOP}
                  />
                ) : null}
              </div>
            )}
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
