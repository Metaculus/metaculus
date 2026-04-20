import { ComponentProps } from "react";

import SectionToggle from "@/components/ui/section_toggle";
import cn from "@/utils/core/cn";
import { logError } from "@/utils/core/errors";

import { GOVERNMENT_BASELINES } from "../data";
import { fetchOverallData } from "../helpers/fetch_jobs_data";
import {
  fetchKeyInsightsData,
  type KeyInsightsData,
} from "../helpers/fetch_key_insights_data";

function KeyInsightItem({
  className,
  children,
  title,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "my-0 break-inside-avoid p-4 text-sm text-blue-700 [text-wrap:pretty] dark:text-blue-700-dark md:text-base print:p-2",
        className
      )}
      {...props}
    >
      <strong>{title}: </strong>
      {children}
    </div>
  );
}

function describeOverallChange(value: number | null): string {
  if (value == null) return "changing significantly";
  const rounded = Math.round(Math.abs(value));
  return `${value < 0 ? "declining" : "growing"} around ${rounded}%`;
}

function describeTradeSchoolGrowth(value: number | null): string {
  if (value == null) return "change meaningfully";
  const rounded = Math.round(Math.abs(value));
  return `${value < 0 ? "decline" : "grow"} ${rounded}%`;
}

export async function KeyInsightsSection({
  className,
  ...props
}: ComponentProps<"div">) {
  let overall2035: number | null = null;
  let insightsData: KeyInsightsData = {
    hoursWorked2035: null,
    youthUnemployment2035: null,
    tradeSchoolGrowth2035: null,
  };
  try {
    const [overallData, fetchedInsights] = await Promise.all([
      fetchOverallData(),
      fetchKeyInsightsData(),
    ]);
    overall2035 = overallData.find((d) => d.year === 2035)?.value ?? null;
    insightsData = fetchedInsights;
  } catch (error) {
    logError(error);
  }

  const govBaseline2035 = Math.round(GOVERNMENT_BASELINES["2035"]);
  const hoursDisplay =
    insightsData.hoursWorked2035 != null
      ? Math.round(insightsData.hoursWorked2035)
      : null;
  const youthDisplay =
    insightsData.youthUnemployment2035 != null
      ? Math.round(insightsData.youthUnemployment2035)
      : null;

  return (
    <SectionToggle
      key="key-insights"
      title="Key Insights"
      variant="light"
      defaultOpen={false}
      className={cn(
        "rounded bg-gray-0 text-base font-medium dark:bg-gray-0-dark md:text-lg",
        className
      )}
      wrapperClassName="print:mb-6"
      contentWrapperClassName="grid md:grid-cols-2 md:gap-8 print:grid-cols-2 print:gap-4"
      {...props}
    >
      <div className="flex flex-col">
        <KeyInsightItem title="Overall employment">
          Forecasters expect significant AI-driven job change, with overall
          employment {describeOverallChange(overall2035)} by 2035, while the
          latest government projections expect approximately {govBaseline2035}%
          growth.
        </KeyInsightItem>
        <KeyInsightItem title="Most and least vulnerable occupations">
          Software developers, lawyers and law clerks, and laborers and material
          movers are all expected to see the largest decreases in employment
          rates, while registered nurses, K-12 teachers, and restaurant servers
          are projected to grow.
        </KeyInsightItem>
        <KeyInsightItem title="Wages and hours worked">
          Wages are expected to see notable growth for workers who remain
          employed, while hours worked are expected to decline
          {hoursDisplay != null ? ` to ${hoursDisplay} hours a week` : ""} in
          2035, down from 38 now.
        </KeyInsightItem>
      </div>
      <div className="flex flex-col">
        <KeyInsightItem title="Financial well-being">
          Well-being (as measured by the ratio of after-tax and transfer
          available resources to the poverty threshold) is expected to remain
          the same or grow across the board, with the highest income families
          seeing the most gains.
        </KeyInsightItem>
        <KeyInsightItem title="Young workers">
          The youngest workers are expected to be hit hardest, with unemployment
          for 4-year college graduates in the 22-27 age range expected to grow
          from the current 6%
          {youthDisplay != null ? ` to ${youthDisplay}%` : ""} in 2035.
          Meanwhile, trade school and community college certificates are
          expected to{" "}
          {describeTradeSchoolGrowth(insightsData.tradeSchoolGrowth2035)} from
          current levels by 2035.
        </KeyInsightItem>
        <KeyInsightItem title="Broader economy">
          The economy is expected to see a number of significant changes, with
          the long-term unemployment rate, labor productivity, and the number of
          Fortune 500 companies with fewer than 5,000 employees all seeing
          substantial increases over the next decade.
        </KeyInsightItem>
      </div>
    </SectionToggle>
  );
}
