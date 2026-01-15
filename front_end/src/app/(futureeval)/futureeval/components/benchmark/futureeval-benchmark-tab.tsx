import AIBBenchmarkForecastingPerformance from "@/app/(main)/aib/components/aib/tabs/benchmark/performance-over-time/aib-benchmark-forecasting-performance";
import { AIBProsVsBotsDiffExample } from "@/app/(main)/aib/components/aib/tabs/benchmark/pros-vs-bots/aib-pros-vs-bots-comparison";

import {
  FutureEvalForecastingPerformanceHeader,
  FutureEvalProsVsBotsSectionHeader,
} from "./futureeval-benchmark-headers";
import FutureEvalModelBenchmark from "./futureeval-model-benchmark";

const FutureEvalBenchmarkTab: React.FC = () => {
  return (
    <>
      <div>
        <FutureEvalModelBenchmark />
      </div>

      {/* Forecasting Performance Over Time */}
      <div>
        <FutureEvalForecastingPerformanceHeader />
        <AIBBenchmarkForecastingPerformance />
      </div>

      {/* Pros vs Bots */}
      <div>
        <FutureEvalProsVsBotsSectionHeader />
        <AIBProsVsBotsDiffExample />
      </div>
    </>
  );
};

export default FutureEvalBenchmarkTab;
