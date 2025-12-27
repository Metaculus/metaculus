import {
  AIBBenchmarkForecastingPerformanceHeader,
  AIBBenchmarkProsVsBotsSectionHeader,
} from "@/app/(main)/aib/components/aib/tabs/benchmark/aib-benchmark-subsection-header";
import AIBBenchmarkForecastingPerformance from "@/app/(main)/aib/components/aib/tabs/benchmark/performance-over-time/aib-benchmark-forecasting-performance";
import { AIBProsVsBotsDiffExample } from "@/app/(main)/aib/components/aib/tabs/benchmark/pros-vs-bots/aib-pros-vs-bots-comparison";

import FutureEvalModelBenchmark from "./futureeval-model-benchmark";

const FutureEvalBenchmarkTab: React.FC = () => {
  return (
    <>
      <div>
        <FutureEvalModelBenchmark />
      </div>

      <div>
        <AIBBenchmarkForecastingPerformanceHeader />
        <AIBBenchmarkForecastingPerformance />
      </div>

      <div>
        <AIBBenchmarkProsVsBotsSectionHeader />
        <AIBProsVsBotsDiffExample />
      </div>
    </>
  );
};

export default FutureEvalBenchmarkTab;
