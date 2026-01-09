"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { PropsWithChildren } from "react";

import cn from "@/utils/core/cn";

import { FE_COLORS } from "../../theme";

type Props = PropsWithChildren<{
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
}>;

/**
 * FutureEval-specific subsection header with left alignment
 */
const FutureEvalSubsectionHeader: React.FC<Props> = ({
  title,
  subtitle,
  children,
}) => {
  return (
    <>
      <div className="flex items-start justify-start gap-2">
        <h3
          className={cn(
            "m-0 text-left text-[24px] font-bold leading-[116%] sm:text-[32px] sm:leading-[40px] lg:text-4xl",
            FE_COLORS.textHeading
          )}
        >
          {title}
        </h3>
      </div>

      <p
        className={cn(
          "m-0 mt-3 text-balance text-left font-geist-mono text-sm sm:text-base",
          FE_COLORS.textSubheading
        )}
      >
        {subtitle}
      </p>
      {children}
    </>
  );
};

/**
 * Forecasting Performance Over Time header (left-aligned)
 */
export const FutureEvalForecastingPerformanceHeader: React.FC = () => {
  const t = useTranslations();

  return (
    <FutureEvalSubsectionHeader
      title={t("aibPerfOverTimeTitle")}
      subtitle={t.rich("aibPerfOverTimeSubtitle")}
    />
  );
};

/**
 * Pros vs Bots header with left alignment
 */
export const FutureEvalProsVsBotsSectionHeader: React.FC = () => {
  const t = useTranslations();

  return (
    <FutureEvalSubsectionHeader
      title={t("aibProsVsBotsTitle")}
      subtitle={t.rich("aibProsVsBotsSubtitle", {
        link: (chunks) => (
          <Link
            className={cn("hover:underline", FE_COLORS.textSubheading)}
            href="/notebooks/38928/futureeval-resources-page/#what-is-the-pro-vs-bots-graph"
          >
            {chunks}
          </Link>
        ),
        brSm: () => <br className="hidden sm:block lg:hidden" />,
        brXs: () => <br className="block sm:hidden" />,
      })}
    />
  );
};

export default FutureEvalSubsectionHeader;
