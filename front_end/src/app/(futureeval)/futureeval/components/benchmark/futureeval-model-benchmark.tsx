"use client";

import Link from "next/link";
import React, { useMemo } from "react";

import ReusableGradientCarousel from "@/components/gradient-carousel";
import Button from "@/components/ui/button";
import cn from "@/utils/core/cn";

import { FE_COLORS, FE_TYPOGRAPHY } from "../../theme";
import FutureEvalComingSoonBanner from "../futureeval-coming-soon-banner";
import FutureEvalModelBar from "./futureeval-model-bar";
import { useFutureEvalLeaderboard } from "../leaderboard/futureeval-leaderboard-provider";
import {
  aggregateKind,
  entryIconPair,
  entryLabel,
  getUpcomingModels,
  isAggregate,
  shouldDisplayEntry,
} from "../leaderboard/utils";

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
      return ["community", "pros"].includes(kind ?? "");
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

  // Get top 3 upcoming models (closest to qualifying)
  const upcomingModels = useMemo(
    () => getUpcomingModels(leaderboard.entries ?? []),
    [leaderboard.entries]
  );

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
      const name = entryLabel(entry);
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
        <div className="w-full text-left">
          {/* Title */}
          <div className="flex items-center gap-3">
            <h3 className={`m-0 ${FE_TYPOGRAPHY.h2} ${FE_COLORS.textHeading}`}>
              Model Leaderboard
            </h3>
          </div>
          {/* Subtitle row - two column layout */}
          <div className="mt-3 grid grid-cols-1 items-start gap-4 sm:grid-cols-2">
            <div>
              <p
                className={`m-0 ${FE_TYPOGRAPHY.body} ${FE_COLORS.textSubheading}`}
              >
                Uses our unified forecasting score. Updates daily.{" "}
                <Link
                  href="/futureeval/methodology#model-leaderboard"
                  className={`${FE_COLORS.textAccent} whitespace-nowrap`}
                >
                  Learn More
                </Link>
              </p>
            </div>
            <div className="flex justify-center sm:justify-end">
              <FutureEvalComingSoonBanner models={upcomingModels} />
            </div>
          </div>
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
      <div className="mx-auto mt-8">
        <Button
          href="/futureeval/leaderboard"
          className={cn(
            "border",
            FE_COLORS.borderPrimary,
            FE_COLORS.textAccent,
            "hover:opacity-80"
          )}
        >
          View the Full Leaderboard
        </Button>
      </div>
    </div>
  );
};

export default FutureEvalModelBenchmark;
