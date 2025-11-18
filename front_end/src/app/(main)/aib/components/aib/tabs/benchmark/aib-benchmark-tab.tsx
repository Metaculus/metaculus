import AIBBenchmarkModels from "./ai-models-benchmark/aib-benchmark-models";
import {
  AIBBenchmarkForecastingPerformanceHeader,
  AIBBenchmarkModelsSubsectionHeader,
  AIBBenchmarkProsVsBotsSectionHeader,
} from "./aib-benchmark-subsection-header";
import AIBBenchmarkForecastingPerformance from "./performance-over-time/aib-benchmark-forecasting-performance";
import { AIBProsVsBotsDiffExample } from "./pros-vs-bots/aib-pros-vs-bots-comparison";

const AIBBenchmarkTab: React.FC = () => {
  return (
    <>
      <div>
        <AIBBenchmarkModelsSubsectionHeader />
        <AIBBenchmarkModels />
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

export default AIBBenchmarkTab;
