import AIBBenchmarkChart from "./aib-benchmark-chart";
import AIBBenchmarkStatsCard from "./aib-benchmark-stats-card";
import { deriveStats, points } from "./config";

const AIBBenchmarkHumansBotComparison: React.FC = () => {
  const stats = deriveStats(points);

  return (
    <div className="mt-8 space-y-9 rounded-[12px] bg-gray-0 p-8 dark:bg-gray-0-dark">
      <AIBBenchmarkChart data={points} />

      <div className="flex gap-4">
        {stats.map((s) => (
          <AIBBenchmarkStatsCard
            key={s.key}
            theme={s.theme}
            value={s.value}
            label={s.label}
            subLabel={s.subLabel}
          />
        ))}
      </div>
    </div>
  );
};

export default AIBBenchmarkHumansBotComparison;
