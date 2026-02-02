"use client";

import { mapLeaderboardToModelPoints } from "./mapping";
import BenchmarkChart from "./performance-chart";
import { useFutureEvalLeaderboard } from "../../leaderboard/futureeval-leaderboard-provider";

const FutureEvalBenchmarkForecastingPerformance: React.FC = () => {
  const { leaderboard } = useFutureEvalLeaderboard();
  const models = mapLeaderboardToModelPoints(leaderboard);
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
    { label: "SOTA Linear Trend", trend: true as const },
  ];

  return (
    <div className="mt-4">
      <BenchmarkChart data={models} legend={legend} hideGpt35={true} />
    </div>
  );
};

export default FutureEvalBenchmarkForecastingPerformance;
