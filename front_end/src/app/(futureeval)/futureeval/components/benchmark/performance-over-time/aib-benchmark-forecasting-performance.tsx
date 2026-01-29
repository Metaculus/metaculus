"use client";

import { useTranslations } from "next-intl";

import AIBBenchmarkPerformanceChart from "./aib-benchmark-performance-chart";
import { mapLeaderboardToModelPoints } from "./mapping";
import { useFutureEvalLeaderboard } from "../../leaderboard/futureeval-leaderboard-provider";

const FutureEvalBenchmarkForecastingPerformance: React.FC = () => {
  const t = useTranslations();
  const { leaderboard } = useFutureEvalLeaderboard();
  const models = mapLeaderboardToModelPoints(leaderboard, t);
  const firstIdxByGroup = new Map<string, number>();
  const normalizeGroup = (name: string) => {
    const first = String(name).split(" ")[0] ?? name;
    return /^gpt/i.test(first) ? "OpenAI" : first;
  };
  models.forEach((m, i) => {
    if (m.isAggregate) return;
    const group = normalizeGroup(m.name);
    if (!firstIdxByGroup.has(group)) firstIdxByGroup.set(group, i);
  });

  // Show all companies in the legend (no filtering)
  const legend = [
    ...Array.from(firstIdxByGroup.entries()).map(([label, pointIndex]) => ({
      label,
      pointIndex,
    })),
    { label: t("aibSOTALinearTrend"), trend: true as const },
  ];

  return (
    <div className="mt-4">
      <AIBBenchmarkPerformanceChart data={models} legend={legend} />
    </div>
  );
};

export default FutureEvalBenchmarkForecastingPerformance;
