"use client";

import AIBBenchmarkPerformanceChart from "./aib-benchmark-performance-chart";
import { mapLeaderboardToModelPoints } from "./mapping";
import { useAIBLeaderboard } from "../../../leaderboard/aib-leaderboard-provider";

const AIBBenchmarkForecastingPerformance: React.FC = () => {
  const { leaderboard } = useAIBLeaderboard();
  const models = mapLeaderboardToModelPoints(leaderboard);

  return (
    <div className="mt-8 rounded-[12px] bg-gray-0 p-4 dark:bg-gray-0-dark sm:p-8">
      <AIBBenchmarkPerformanceChart data={models} />
    </div>
  );
};

export default AIBBenchmarkForecastingPerformance;
