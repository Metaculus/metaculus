"use client";

import { useCallback, useMemo, useState } from "react";
import type { CallbackArgs } from "victory-core";

import { METAC_COLORS } from "@/constants/colors";
import useAppTheme from "@/hooks/use_app_theme";

import { BenchmarkChart } from "./benchmark-chart";
import { BenchmarkChartLegend } from "./benchmark-chart-legend";
import { safeIndex } from "./helpers";
import { getAggregates, getBots } from "./mapping";
import { FAMILY_METADATA, type Family } from "../../leaderboard/bot_meta";
import { useFutureEvalLeaderboard } from "../../leaderboard/futureeval-leaderboard-provider";

const FutureEvalBenchmarkForecastingPerformance: React.FC = () => {
  const { leaderboard } = useFutureEvalLeaderboard();
  const { getThemeColor } = useAppTheme();

  const aggregates = useMemo(() => getAggregates(leaderboard), [leaderboard]);
  const bots = useMemo(
    () => getBots(leaderboard, new Date("2024-01-01")),
    [leaderboard]
  );

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

      const skippedIndexes = new Set([2]);
      const availableIndexes = colorKeys
        .map((_, i) => i)
        .filter((i) => !skippedIndexes.has(i));

      const availableIndexesLength = availableIndexes.length;
      const mappedIndex = idx % availableIndexesLength;
      const finalIndex = availableIndexes[mappedIndex] ?? 0;
      const chosen = colorArray[finalIndex] ?? METAC_COLORS["mc-option"][1];
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
    </div>
  );
};

export default FutureEvalBenchmarkForecastingPerformance;
