"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { PropsWithChildren } from "react";

import cn from "@/utils/core/cn";

import { FE_COLORS, FE_TYPOGRAPHY } from "../../theme";

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
            "m-0 text-left",
            FE_TYPOGRAPHY.h2,
            FE_COLORS.textHeading
          )}
        >
          {title}
        </h3>
      </div>

      <p
        className={cn(
          "m-0 mt-3 text-left",
          FE_TYPOGRAPHY.body,
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
            className={cn(FE_TYPOGRAPHY.link, FE_COLORS.textAccent)}
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
