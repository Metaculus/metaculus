import FutureEvalBiggestBotWins from "./futureeval-biggest-bot-wins";
import {
  FutureEvalForecastingPerformanceHeader,
  FutureEvalProsVsBotsSectionHeader,
} from "./futureeval-benchmark-headers";
import FutureEvalModelBenchmark from "./futureeval-model-benchmark";
import FutureEvalBenchmarkForecastingPerformance from "./performance-over-time/futureeval-benchmark-forecasting-performance";
import { FutureEvalProsVsBotsDiffExample } from "./pros-vs-bots/futureeval-pros-vs-bots-comparison";

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

      {/* Biggest Bot Wins */}
      <div>
        <FutureEvalBiggestBotWins />
      </div>
    </>
  );
};

export default FutureEvalBenchmarkTab;
