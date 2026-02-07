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
      <div id="performance-over-time-graph" className="scroll-mt-24">
        <FutureEvalForecastingPerformanceHeader />
        <FutureEvalBenchmarkForecastingPerformance />
      </div>

      {/* Biggest Bot Wins */}
      <div id="biggest-bot-wins-graph" className="scroll-mt-24">
        <FutureEvalBiggestBotWins />
      </div>

      {/* Pros vs Bots */}
      <div id="pros-vs-bots-graph" className="scroll-mt-24">
        <FutureEvalProsVsBotsSectionHeader />
        <FutureEvalProsVsBotsDiffExample />
      </div>

      {/* Bot Tournaments */}
      <div id="bot-tournaments-graph" className="scroll-mt-24">
        <FutureEvalTournaments />
      </div>
    </>
  );
};

export default FutureEvalBenchmarkTab;
