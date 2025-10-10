import AIBBenchmarkModels from "./ai-models-benchmark/aib-benchmark-models";
import {
  AIBBenchmarkBotsVsHumansSubsectionHeader,
  AIBBenchmarkForecastingPerformanceHeader,
  AIBBenchmarkModelsSubsectionHeader,
} from "./aib-benchmark-subsection-header";
import AIBBenchmarkHumansBotComparison from "./humans-bot-comparison/aib-benchmark-humans-bot-comparison";
import AIBBenchmarkForecastingPerformance from "./performance-over-time/aib-benchmark-forecasting-performance";

const AIBBenchmarkTab: React.FC = () => {
  return (
    <>
      <div>
        <AIBBenchmarkModelsSubsectionHeader />
        <AIBBenchmarkModels />
      </div>

      <div>
        <AIBBenchmarkBotsVsHumansSubsectionHeader />
        <AIBBenchmarkHumansBotComparison />
      </div>

      <div>
        <AIBBenchmarkForecastingPerformanceHeader />
        <AIBBenchmarkForecastingPerformance />
      </div>
    </>
  );
};

export default AIBBenchmarkTab;
