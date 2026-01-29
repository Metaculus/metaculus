import {
  FutureEvalForecastingPerformanceHeader,
  FutureEvalProsVsBotsSectionHeader,
} from "./futureeval-benchmark-headers";
import FutureEvalModelBenchmark from "./futureeval-model-benchmark";
import FutureEvalBenchmarkForecastingPerformance from "./performance-over-time/aib-benchmark-forecasting-performance";
import { FutureEvalProsVsBotsDiffExample } from "./pros-vs-bots/aib-pros-vs-bots-comparison";

const FutureEvalBenchmarkTab: React.FC = () => {
  return (
    <>
      <div>
        <FutureEvalModelBenchmark />
      </div>

      {/* Forecasting Performance Over Time */}
      <div>
        <FutureEvalForecastingPerformanceHeader />
        <FutureEvalBenchmarkForecastingPerformance />
      </div>

      {/* Pros vs Bots */}
      <div>
        <FutureEvalProsVsBotsSectionHeader />
        <FutureEvalProsVsBotsDiffExample />
      </div>
    </>
  );
};

export default FutureEvalBenchmarkTab;
