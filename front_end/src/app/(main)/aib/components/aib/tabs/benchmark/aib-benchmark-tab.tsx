import AIBBenchmarkModels from "./aib-benchmark-models";
import AIBBenchmarkTabHero from "./aib-benchmark-tab-hero";

const AIBBenchmarkTab: React.FC = () => {
  return (
    <>
      <AIBBenchmarkTabHero />
      <AIBBenchmarkModels />
    </>
  );
};

export default AIBBenchmarkTab;
