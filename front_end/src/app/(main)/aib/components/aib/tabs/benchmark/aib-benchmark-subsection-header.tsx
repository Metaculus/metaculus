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
      <h3 className="m-0 text-center text-[24px] font-bold leading-[116%] text-blue-800 dark:text-blue-800-dark sm:text-[32px] sm:leading-[40px] lg:text-left lg:text-4xl">
        {title}
      </h3>
      <p className="m-0 mt-3 flex items-center justify-center gap-2 text-center text-[14px] font-normal leading-[20px] text-blue-700 dark:text-blue-700-dark sm:text-xl sm:font-medium sm:leading-normal lg:justify-start lg:text-left">
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
      <p className="m-0 mx-auto mt-2 max-w-[400px] text-center text-[12px] leading-[16px] text-blue-800 opacity-60 dark:text-blue-800-dark sm:text-base sm:leading-normal lg:max-w-none lg:text-left">
        Updated every day based on our standardized <br className="sm:hidden" />{" "}
        forecasting bot performance measurement.
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
            Based on performance in our{" "}
            <br className="hidden sm:block lg:hidden" /> quarterly{" "}
            <br className="block sm:hidden" />
            <Link
              className="text-blue-600 dark:text-blue-600-dark"
              href="/aib/2025/q1"
            >
              AI Benchmarking Tournament.
            </Link>
          </span>
        </>
      }
    />
  );
};
