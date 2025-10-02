import { faQuestionCircle } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const AIBBenchmarkTabHero: React.FC = () => {
  return (
    <>
      <h3 className="m-0 text-4xl font-bold leading-[40px] text-blue-800 dark:text-blue-800-dark">
        Model Benchmark
      </h3>
      <p className="m-0 mt-3 inline-flex items-center gap-2 text-xl font-medium text-blue-700 dark:text-blue-700-dark">
        <span>by Average Baseline Score</span>
        <FontAwesomeIcon icon={faQuestionCircle} />
      </p>
      <p className="m-0 mt-2 text-base text-blue-800 opacity-60 dark:text-blue-800-dark">
        Updated every day based on our standardized forecasting bot performance
        measurement.
      </p>
    </>
  );
};

export default AIBBenchmarkTabHero;
