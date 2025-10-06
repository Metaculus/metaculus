import AIBBenchmarkModels from "./ai-models-benchmark/aib-benchmark-models";
import {
  AIBBenchmarkBotsVsHumansSubsectionHeader,
  AIBBenchmarkModelsSubsectionHeader,
} from "./aib-benchmark-subsection-header";
import AIBBenchmarkHumansBotComparison from "./humans-bot-comparison/aib-benchmark-humans-bot-comparison";

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
    </>
  );
};

export default AIBBenchmarkTab;
