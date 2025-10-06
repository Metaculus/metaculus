import { faQuestionCircle } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { PropsWithChildren } from "react";

type Props = PropsWithChildren<{
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
}>;

const AIBBenchmarkSubsectionHeader: React.FC<Props> = ({
  title,
  subtitle,
  children,
}) => {
  return (
    <>
      <h3 className="m-0 text-4xl font-bold leading-[40px] text-blue-800 dark:text-blue-800-dark">
        {title}
      </h3>
      <p className="m-0 mt-3 inline-flex items-center gap-2 text-xl font-medium text-blue-700 dark:text-blue-700-dark">
        {subtitle}
      </p>
      {children}
    </>
  );
};

export const AIBBenchmarkModelsSubsectionHeader: React.FC = () => {
  return (
    <AIBBenchmarkSubsectionHeader
      title="Model Benchmark"
      subtitle={
        <>
          <span>by Average Baseline Score</span>
          <FontAwesomeIcon icon={faQuestionCircle} />
        </>
      }
    >
      <p className="m-0 mt-2 text-base text-blue-800 opacity-60 dark:text-blue-800-dark">
        Updated every day based on our standardized forecasting bot performance
        measurement.
      </p>
    </AIBBenchmarkSubsectionHeader>
  );
};

export const AIBBenchmarkBotsVsHumansSubsectionHeader: React.FC = () => {
  return (
    <AIBBenchmarkSubsectionHeader
      title="Forecasting Bots vs. Humans Benchmark"
      subtitle={
        <>
          <span>
            Based on performance in our quarterly{" "}
            <Link
              className="text-blue-600 dark:text-blue-600-dark"
              href="/aib/2025/q1"
            >
              AI Benchmarking Tournament.
            </Link>
          </span>
          <FontAwesomeIcon icon={faQuestionCircle} />
        </>
      }
    />
  );
};
