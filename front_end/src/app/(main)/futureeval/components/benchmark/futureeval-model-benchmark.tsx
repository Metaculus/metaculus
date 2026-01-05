"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import React, { useMemo } from "react";

import ReusableGradientCarousel from "@/components/gradient-carousel";

import FutureEvalModelBar from "./futureeval-model-bar";
import { useAIBLeaderboard } from "../../../aib/components/aib/leaderboard/aib-leaderboard-provider";
import {
  aggregateKind,
  entryIconPair,
  entryLabel,
  isAggregate,
  shouldDisplayEntry,
} from "../../../aib/components/aib/leaderboard/utils";

const MAX_VISIBLE_BOTS = 18; // 18 bots + up to 2 aggregates = ~20 total
const MIN_HEIGHT_PCT = 20;
const MAX_HEIGHT_PCT = 100;

const FutureEvalModelBenchmark: React.FC = () => {
  const t = useTranslations();
  const { leaderboard } = useAIBLeaderboard();

  const entries = useMemo(() => {
    const allEntries = leaderboard.entries ?? [];

    // Get aggregate entries (Community Prediction and Pros)
    const aggregates = allEntries.filter((e) => {
      if (!isAggregate(e)) return false;
      const kind = aggregateKind(e);
      return kind === "community";
    });

    // Get bot entries that should be displayed
    const bots = allEntries
      .filter((e) => !isAggregate(e) && shouldDisplayEntry(e, 300))
      .sort((a, b) => {
        if (a.rank != null && b.rank != null) return a.rank - b.rank;
        return b.score - a.score;
      })
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
      const name = entryLabel(entry, t);
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
  }, [entries, scaleHeight, t]);

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="mb-0 text-center sm:mb-1">
        <h3 className="m-0 text-[24px] font-bold leading-[116%] text-blue-800 dark:text-blue-800-dark sm:text-[32px] sm:leading-[40px] lg:text-4xl">
          {t("aibBenchModelsTitle")}
        </h3>
        <p className="m-0 mt-3 text-balance font-geist-mono text-sm text-blue-700 dark:text-blue-700-dark sm:text-base">
          {t("aibBenchModelsBlurb")}{" "}
          <Link
            href="/futureeval/leaderboard"
            className="text-blue-700 hover:text-blue-800 dark:text-blue-700-dark hover:dark:text-blue-800-dark"
          >
            {t("aibViewFullLeaderboard")}
          </Link>
        </p>
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
          gradientFromClass="from-gray-0 dark:from-gray-950"
          arrowClassName="w-8 h-8 sm:w-10 sm:h-10 text-blue-700 dark:text-blue-700-dark bg-gray-0 dark:bg-gray-0-dark rounded-full shadow-md border border-blue-700 dark:border-blue-700-dark"
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
