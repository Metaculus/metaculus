"use client";

import Link from "next/link";
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
      {title != null && (
        <h3
          className={cn(
            "m-0 text-left",
            FE_TYPOGRAPHY.h2,
            FE_COLORS.textHeading
          )}
        >
          {title}
        </h3>
      )}

      {subtitle != null && (
        <p
          className={cn(
            "m-0 mt-3 text-left",
            FE_TYPOGRAPHY.body,
            FE_COLORS.textSubheading
          )}
        >
          {subtitle}
        </p>
      )}
      {children}
    </>
  );
};

/**
 * Forecasting Performance Over Time header (left-aligned)
 */
export const FutureEvalForecastingPerformanceHeader: React.FC = () => {
  return (
    <FutureEvalSubsectionHeader
      title="Forecasting Performance Over Time"
      subtitle={
        <>
          Model forecasting score vs. release date.{" "}
          <Link
            className={cn(FE_TYPOGRAPHY.link, FE_COLORS.textAccent)}
            href="/futureeval/methodology#model-leaderboard"
          >
            Learn more
          </Link>
          .
        </>
      }
    />
  );
};

/**
 * Pros vs Bots header with left alignment
 */
export const FutureEvalProsVsBotsSectionHeader: React.FC = () => {
  return (
    <FutureEvalSubsectionHeader
      title="How much Pros beat Bots"
      subtitle={
        <>
          Metaculus Pro Forecasters have beaten Bots every quarter of our{" "}
          <Link
            className={cn(FE_TYPOGRAPHY.link, FE_COLORS.textAccent)}
            href="/notebooks/38928/futureeval-resources-page/#what-is-the-pro-vs-bots-graph"
          >
            AI Benchmarking Tournaments
          </Link>{" "}
          so far.
        </>
      }
    />
  );
};

export default FutureEvalSubsectionHeader;
