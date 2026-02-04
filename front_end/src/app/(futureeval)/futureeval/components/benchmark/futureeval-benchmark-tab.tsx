import FutureEvalTournaments from "../futureeval-tournaments";
import {
  FutureEvalForecastingPerformanceHeader,
  FutureEvalProsVsBotsSectionHeader,
} from "./futureeval-benchmark-headers";
import FutureEvalBiggestBotWins from "./futureeval-biggest-bot-wins";
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

      {/* Bot Tournaments */}
      <div>
        <FutureEvalTournaments />
      </div>
    </>
  );
};

export default FutureEvalBenchmarkTab;
