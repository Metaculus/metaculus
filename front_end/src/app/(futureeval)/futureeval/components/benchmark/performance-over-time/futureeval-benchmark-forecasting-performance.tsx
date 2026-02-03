"use client";

import { mapLeaderboardToModelPoints } from "./mapping";
import BenchmarkChart from "./performance-chart";
import { useFutureEvalLeaderboard } from "../../leaderboard/futureeval-leaderboard-provider";

const FutureEvalBenchmarkForecastingPerformance: React.FC = () => {
  const { leaderboard } = useFutureEvalLeaderboard();
  const models = mapLeaderboardToModelPoints(leaderboard);
  const normalizeGroup = (name: string) => {
    const first = String(name).split(" ")[0] ?? name;
    return /^gpt/i.test(first) ? "OpenAI" : first;
  };

  // Collect unique normalized provider names in order of first appearance (matching legend order)
  const uniqueProviders = new Set<string>();
  const providerOrder: string[] = [];
  models.forEach((m) => {
    if (m.isAggregate) return;
    const group = normalizeGroup(m.name);
    if (!uniqueProviders.has(group)) {
      uniqueProviders.add(group);
      providerOrder.push(group);
    }
  });

  // Assign sequential indexes based on order of first appearance (matching legend order)
  const groupIndexByLabel = new Map<string, number>();
  providerOrder.forEach((provider, index) => {
    groupIndexByLabel.set(provider, index);
  });

  // Show all companies in the legend (no filtering)
  const legend = [
    ...Array.from(groupIndexByLabel.entries()).map(([label, pointIndex]) => ({
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
