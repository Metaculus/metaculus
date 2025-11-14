import { faCircleQuestion } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { PropsWithChildren } from "react";

type Props = PropsWithChildren<{
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  infoHref?: string;
}>;

const AIBBenchmarkSubsectionHeader: React.FC<Props> = ({
  title,
  subtitle,
  infoHref,
  children,
}) => {
  return (
    <>
      <div className="flex items-start justify-center gap-2 lg:justify-start">
        <h3 className="m-0 text-center text-[24px] font-bold leading-[116%] text-blue-800 dark:text-blue-800-dark sm:text-[32px] sm:leading-[40px] lg:text-left lg:text-4xl">
          {title}
        </h3>
        {infoHref ? (
          <Link
            href={infoHref}
            className="mt-0.5 inline-flex items-center text-blue-700 hover:text-blue-800 dark:text-blue-700-dark hover:dark:text-blue-800-dark"
            aria-label="Learn more"
            title="Learn more"
          >
            <FontAwesomeIcon icon={faCircleQuestion} className="text-[18px]" />
          </Link>
        ) : null}
      </div>

      <p className="m-0 mt-3 text-center text-[14px] font-normal leading-[20px] text-blue-700 dark:text-blue-700-dark sm:text-xl sm:font-medium sm:leading-normal lg:text-left">
        {subtitle}
      </p>
      {children}
    </>
  );
};

export const AIBBenchmarkModelsSubsectionHeader: React.FC = () => {
  const t = useTranslations();

  return (
    <AIBBenchmarkSubsectionHeader
      title={t("aibBenchModelsTitle")}
      infoHref="/notebooks/38928/futureeval-resources-page/#what-is-the-model-leaderboard"
    >
      <p
        className="m-0 mx-auto mt-2 max-w-[400px] text-center text-[12px] leading-[16px]
            text-blue-800/60 dark:text-blue-800-dark/60
            sm:text-base sm:leading-normal lg:max-w-none lg:text-left"
      >
        {t.rich("aibBenchModelsBlurb", {
          br: () => <br className="sm:hidden" />,
        })}{" "}
        <Link
          href="/futureeval/leaderboard"
          className="text-blue-700 hover:text-blue-800 dark:text-blue-700-dark hover:dark:text-blue-800-dark"
        >
          {t("aibViewFullLeaderboard")}
        </Link>
      </p>
    </AIBBenchmarkSubsectionHeader>
  );
};

export const AIBBenchmarkProsVsBotsSectionHeader: React.FC = () => {
  const t = useTranslations();

  return (
    <AIBBenchmarkSubsectionHeader
      title={t("aibProsVsBotsTitle")}
      subtitle={t.rich("aibProsVsBotsSubtitle", {
        link: (chunks) => (
          <Link
            className="text-blue-600 dark:text-blue-600-dark"
            href="/notebooks/38928/futureeval-resources-page/#what-is-the-pro-vs-bots-graph"
          >
            {chunks}
          </Link>
        ),
        brSm: () => <br className="hidden sm:block lg:hidden" />,
        brXs: () => <br className="block sm:hidden" />,
      })}
      infoHref="/notebooks/38928/futureeval-resources-page/#what-is-the-pro-vs-bots-graph"
    />
  );
};

export const AIBBenchmarkForecastingPerformanceHeader: React.FC = () => {
  const t = useTranslations();

  return (
    <AIBBenchmarkSubsectionHeader
      title={t("aibPerfOverTimeTitle")}
      subtitle={t.rich("aibPerfOverTimeSubtitle")}
    />
  );
};
