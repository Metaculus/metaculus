"use client";

import Link from "next/link";
import React, { useMemo } from "react";

import ReusableGradientCarousel from "@/components/gradient-carousel";

import { FE_COLORS, FE_TYPOGRAPHY } from "../../theme";
import FutureEvalInfoPopover from "../futureeval-info-popover";
import FutureEvalModelBar from "./futureeval-model-bar";
import { useFutureEvalLeaderboard } from "../leaderboard/futureeval-leaderboard-provider";
import {
  aggregateKind,
  entryIconPair,
  entryLabel,
  isAggregate,
  shouldDisplayEntry,
} from "../leaderboard/utils";

// Mock translation function for entryLabel - returns hardcoded English values
const mockTranslate = ((key: string) => {
  const translations: Record<string, string> = {
    communityPrediction: "Community Prediction",
    aibLegendPros: "Pro Forecasters",
  };
  return translations[key] ?? key;
}) as ReturnType<typeof import("next-intl").useTranslations>;

const MAX_VISIBLE_BOTS = 18; // 18 bots + up to 2 aggregates = ~20 total
const MIN_HEIGHT_PCT = 20;
const MAX_HEIGHT_PCT = 100;

const FutureEvalModelBenchmark: React.FC = () => {
  const { leaderboard } = useFutureEvalLeaderboard();

  const entries = useMemo(() => {
    const allEntries = leaderboard.entries ?? [];

    // Get aggregate entries (Community Prediction and Pros)
    const aggregates = allEntries.filter((e) => {
      if (!isAggregate(e)) return false;
      const kind = aggregateKind(e);
      return kind === "community";
    });

    // Get bot entries that should be displayed, sorted by score (highest first)
    const bots = allEntries
      .filter((e) => !isAggregate(e) && shouldDisplayEntry(e, 300))
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_VISIBLE_BOTS);

    // Combine and sort by score (highest first)
    const combined = [...aggregates, ...bots];
    combined.sort((a, b) => b.score - a.score);

    return combined;
  }, [leaderboard.entries]);

  // Scale heights relative to min/max scores
  const scaleHeight = useMemo(() => {
    if (entries.length === 0) return () => MIN_HEIGHT_PCT;
    const scores = entries.map((e) => e.score);
    const maxScore = Math.max(...scores);
    const minScore = Math.min(...scores);
    const range = maxScore - minScore;

    if (range <= 0) return () => MAX_HEIGHT_PCT;

    return (score: number) => {
      const normalized = (score - minScore) / range;
      return MIN_HEIGHT_PCT + normalized * (MAX_HEIGHT_PCT - MIN_HEIGHT_PCT);
    };
  }, [entries]);

  const items = useMemo(() => {
    return entries.map((entry) => {
      const name = entryLabel(entry, mockTranslate);
      const { light, dark } = entryIconPair(entry);
      const aggregate = isAggregate(entry);

      return {
        id: String(entry.user?.id ?? name),
        name,
        score: entry.score,
        contributionCount: entry.contribution_count ?? 0,
        iconLight: light,
        iconDark: dark,
        isAggregate: aggregate,
        heightPct: scaleHeight(entry.score),
      };
    });
  }, [entries, scaleHeight]);

  if (items.length === 0) {
    return null;
  }

  return (
    <div id="model-leaderboard" className="flex scroll-mt-24 flex-col">
      {/* Header */}
      <div className="mb-0 flex items-start justify-between gap-4 sm:mb-1">
        <div className="text-left">
          {/* Title with info popover inline on desktop */}
          <div className="flex items-center gap-3">
            <h3 className={`m-0 ${FE_TYPOGRAPHY.h2} ${FE_COLORS.textHeading}`}>
              Model Leaderboard
            </h3>
            {/* Info popover - inline on desktop (sm+) */}
            <div className="hidden sm:block">
              <FutureEvalInfoPopover />
            </div>
          </div>
          <p
            className={`m-0 mt-3 ${FE_TYPOGRAPHY.body} ${FE_COLORS.textSubheading}`}
          >
            Updated every day based on our standardized forecasting performance
            measurement methodology.
          </p>
          <Link
            href="/futureeval/leaderboard"
            className={`mt-2 inline-block ${FE_TYPOGRAPHY.link} ${FE_COLORS.textAccent}`}
          >
            View full leaderboard
          </Link>
        </div>
        {/* Info popover - right aligned on mobile only */}
        <div className="block sm:hidden">
          <FutureEvalInfoPopover />
        </div>
      </div>

      {/* Horizontal bar chart carousel */}
      <div className="h-[280px] sm:h-[340px]">
        <ReusableGradientCarousel
          items={items}
          renderItem={(item) => (
            <FutureEvalModelBar
              heightPct={item.heightPct}
              model={{
                id: item.id,
                name: item.name,
                score: item.score,
                contributionCount: item.contributionCount,
                iconLight: item.iconLight,
                iconDark: item.iconDark,
                isAggregate: item.isAggregate,
              }}
            />
          )}
          itemClassName="w-[40px] sm:w-[64px] h-full"
          gapClassName="gap-1 sm:gap-2"
          gradientFromClass={FE_COLORS.gradientFrom}
          arrowLeftPosition="left-1 sm:left-[18px]"
          arrowRightPosition="right-1 sm:right-[18px]"
          slideBy={{ mode: "items", count: 3 }}
          showArrows={true}
          wheelToHorizontal={false}
          className="h-full"
          viewportClassName="h-full overflow-y-hidden"
          listClassName="h-full items-stretch -ml-2"
        />
      </div>
    </div>
  );
};

export default FutureEvalModelBenchmark;
