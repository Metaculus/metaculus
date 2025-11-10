"use client";

import { useTranslations } from "next-intl";

import AIBBenchmarkPerformanceChart from "./aib-benchmark-performance-chart";
import { mapLeaderboardToModelPoints } from "./mapping";
import { useAIBLeaderboard } from "../../../leaderboard/aib-leaderboard-provider";

const AIBBenchmarkForecastingPerformance: React.FC = () => {
  const t = useTranslations();
  const { leaderboard } = useAIBLeaderboard();
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

  const legend = [
    ...Array.from(firstIdxByGroup.entries()).map(([label, pointIndex]) => ({
      label,
      pointIndex,
    })),
    { label: t("aibSOTALinearTrend"), trend: true as const },
    {
      label: t("aibSotaModels"),
      sota: true as const,
    },
  ];

  return (
    <div className="mt-8 rounded-[12px] bg-gray-0 p-4 dark:bg-gray-0-dark sm:p-8">
      <AIBBenchmarkPerformanceChart data={models} legend={legend} />
    </div>
  );
};

export default AIBBenchmarkForecastingPerformance;
