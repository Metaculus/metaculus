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

  // Only show these specific groups in the legend
  const allowedGroups = ["OpenAI", "Claude", "DeepSeek", "Gemini"];
  const legend = [
    ...Array.from(firstIdxByGroup.entries())
      .filter(([label]) => allowedGroups.includes(label))
      .map(([label, pointIndex]) => ({
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

export default AIBBenchmarkForecastingPerformance;
