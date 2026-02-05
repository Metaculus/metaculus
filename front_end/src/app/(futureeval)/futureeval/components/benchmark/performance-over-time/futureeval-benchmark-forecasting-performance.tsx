"use client";

import { useCallback, useMemo, useState } from "react";
import type { CallbackArgs } from "victory-core";

import { METAC_COLORS } from "@/constants/colors";
import useAppTheme from "@/hooks/use_app_theme";

import { BenchmarkChart } from "./benchmark-chart";
import { BenchmarkChartLegend } from "./benchmark-chart-legend";
import { safeIndex } from "./helpers";
import { getAggregates, getBots } from "./mapping";
import {
  calculateSotaCrossingFromBots,
  type SotaCrossingResult,
} from "./sota-trend";
import { FE_COLORS, FE_TYPOGRAPHY } from "../../../theme";
import { FAMILY_METADATA, type Family } from "../../leaderboard/bot_meta";
import { useFutureEvalLeaderboard } from "../../leaderboard/futureeval-leaderboard-provider";

/**
 * Format a crossing result date as "MMMM YYYY" (e.g., "March 2026")
 * Returns null if the crossing hasn't happened or can't be calculated
 */
function formatCrossingDate(crossing: SotaCrossingResult): string | null {
  if (!crossing.crossingDate) return null;
  if (!crossing.isFuture) return null;

  return crossing.crossingDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

const FutureEvalBenchmarkForecastingPerformance: React.FC = () => {
  const { leaderboard } = useFutureEvalLeaderboard();
  const { getThemeColor } = useAppTheme();

  const aggregates = useMemo(() => getAggregates(leaderboard), [leaderboard]);
  const bots = useMemo(
    () => getBots(leaderboard, new Date("2024-01-01")),
    [leaderboard]
  );

  // Calculate SOTA crossing dates for community and pro aggregations
  const { communityDate, proDate } = useMemo(() => {
    const communityAggregate = aggregates.find(
      (a) => a.aggregateKind === "community"
    );
    const proAggregate = aggregates.find((a) => a.aggregateKind === "pros");

    let communityDate: string | null = null;
    let proDate: string | null = null;

    if (communityAggregate && Number.isFinite(communityAggregate.score)) {
      const crossing = calculateSotaCrossingFromBots(
        bots,
        communityAggregate.score
      );
      communityDate = formatCrossingDate(crossing);
    }

    if (proAggregate && Number.isFinite(proAggregate.score)) {
      const crossing = calculateSotaCrossingFromBots(bots, proAggregate.score);
      proDate = formatCrossingDate(crossing);
    }

    return { communityDate, proDate };
  }, [aggregates, bots]);

  // Shared state
  const [selectedFamilies, setSelectedFamilies] = useState<Set<string>>(
    new Set()
  );
  const [hoveredFamily, setHoveredFamily] = useState<string | null>(null);
  const [hoveredPointKey, setHoveredPointKey] = useState<string | null>(null);

  // Collect unique normalized family names in order of first appearance (matching legend order)
  const families = useMemo(() => {
    const uniqueFamilies = new Set<Family>(bots.map((m) => m.family));
    return Array.from(uniqueFamilies);
  }, [bots]);

  // Color function for legend items
  const colorFor = useCallback(
    (idxOrArgs: number | CallbackArgs) => {
      const idx =
        typeof idxOrArgs === "number" ? idxOrArgs : safeIndex(idxOrArgs.index);
      const colorArray = Object.values(METAC_COLORS["mc-option"]);
      const colorKeys = Object.keys(METAC_COLORS["mc-option"]);

      const skippedIndexes = new Set([2, 15]);
      const availableIndexes = colorKeys
        .map((_, i) => i)
        .filter((i) => !skippedIndexes.has(i));

      const availableIndexesLength = availableIndexes.length;
      const mappedIndex = idx % availableIndexesLength;
      const finalIndex = availableIndexes[mappedIndex] ?? 0;
      const chosen = colorArray[finalIndex] ?? METAC_COLORS["mc-option"][16];
      return getThemeColor(chosen);
    },
    [getThemeColor]
  );

  // Build legend items with colors for the legend component
  const legendItems = useMemo(() => {
    return families.map((family, index) => {
      return {
        id: family,
        label: FAMILY_METADATA[family].label,
        color: colorFor(index),
      };
    });
  }, [families, colorFor]);

  // Toggle family selection
  const toggleFamily = useCallback((family: string) => {
    setSelectedFamilies((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(family)) {
        newSet.delete(family);
      } else {
        newSet.add(family);
      }
      return newSet;
    });
  }, []);

  return (
    <div className="mt-4">
      <BenchmarkChartLegend
        legendItems={legendItems}
        selectedFamilies={selectedFamilies}
        hoveredFamily={hoveredFamily}
        onToggleFamily={toggleFamily}
        onHoverFamily={setHoveredFamily}
        onClearSelection={() => setSelectedFamilies(new Set())}
      />

      <BenchmarkChart
        bots={bots}
        aggregates={aggregates}
        legendItems={legendItems}
        selectedFamilies={selectedFamilies}
        hoveredFamily={hoveredFamily}
        hoveredPointKey={hoveredPointKey}
        onHoveredPointKeyChange={setHoveredPointKey}
      />

      {communityDate && proDate && (
        <p
          className={`mt-4 text-balance text-center ${FE_TYPOGRAPHY.bodySmall} ${FE_COLORS.textMuted}`}
        >
          We estimate that bots will start beating the Metaculus Community
          performance in <strong>{communityDate}</strong> and Pro Forecaster
          performance in <strong>{proDate}</strong>.
        </p>
      )}
    </div>
  );
};

export default FutureEvalBenchmarkForecastingPerformance;
