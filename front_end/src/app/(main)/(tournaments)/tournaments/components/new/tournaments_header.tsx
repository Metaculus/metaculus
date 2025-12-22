"use client";

import React, { ChangeEvent, useEffect, useRef, useState } from "react";

import ExpandableSearchInput from "@/components/expandable_search_input";
import useSearchInputState from "@/hooks/use_search_input_state";
import cn from "@/utils/core/cn";

import TournamentsTabs from "./tournament_tabs";
import TournamentsFilter from "./tournaments_filter";
import TournamentsInfoPopover from "./tournaments_info_popover";
import { useTournamentsSection } from "./tournaments_provider";
import { TOURNAMENTS_SEARCH } from "../../constants/query_params";

const STICKY_TOP = 48;
const POPOVER_GAP = 10;

const TournamentsHeader: React.FC = () => {
  const { current, infoOpen, toggleInfo, closeInfo } = useTournamentsSection();

  const [searchQuery, setSearchQuery] = useSearchInputState(
    TOURNAMENTS_SEARCH,
    {
      mode: "client",
      debounceTime: 300,
      modifySearchParams: true,
    }
  );

  const [draftQuery, setDraftQuery] = useState(searchQuery);
  useEffect(() => setDraftQuery(searchQuery), [searchQuery]);

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    const next = event.target.value;
    setDraftQuery(next);
    setSearchQuery(next);
  };

  const handleSearchErase = () => {
    setDraftQuery("");
    setSearchQuery("");
  };

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

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
  }, []);

  const showInfo = true;

  return (
    <>
      <div ref={sentinelRef} className="h-px w-full" aria-hidden />

      <div
        id="tournamentsStickyHeader"
        className={cn(
          "sticky z-40",
          "ml-[calc(50%-50dvw)] w-[100dvw]",
          stuck ? popoverSafeGlassClasses : "bg-transparent"
        )}
        style={{ top: STICKY_TOP }}
      >
        <div className="mx-auto max-w-[1150px] px-6 py-3 sm:px-8">
          <div className="flex items-center justify-between">
            <TournamentsTabs current={current} />

            <div className="flex items-center gap-3">
              <TournamentsFilter />

              <ExpandableSearchInput
                value={draftQuery}
                onChange={handleSearchChange}
                onErase={handleSearchErase}
                placeholder="search..."
                expandedWidthClassName="w-[176px]"
                buttonClassName="h-9 w-9 border-[1px] [&_svg]:text-blue-700 [&_svg]:dark:text-blue-700-dark border-blue-400 dark:border-blue-400-dark"
              />

              {showInfo ? (
                <TournamentsInfoPopover
                  open={infoOpen}
                  onOpenChange={(next) => (next ? toggleInfo() : closeInfo())}
                  offsetPx={POPOVER_GAP}
                  stickyTopPx={STICKY_TOP}
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
