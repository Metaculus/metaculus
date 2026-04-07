import { ComponentProps } from "react";

import { QuestionWithNumericForecasts } from "@/types/question";
import { logError } from "@/utils/core/errors";

import {
  LaborHubChartHoverProvider,
  LaborHubChartHoverSection,
} from "../components/labor-hub-chart-hover-context";
import {
  MultiLineRiskChart,
  type LineSeries,
} from "../components/question-cards/multi-line-risk-chart";
import { NoQuestionPlaceholder } from "../components/question-cards/placeholder";
import { QuestionCard } from "../components/question-cards/question-card";
import { GOVERNMENT_BASELINES } from "../data";
import {
  fetchJobsData,
  fetchOverallData,
  getSubQuestionValue,
  OVERALL_POST_ID,
  YearValue,
} from "../helpers/fetch-jobs-data";

function excludeYears(
  data: YearValue[],
  years: readonly number[]
): YearValue[] {
  if (!years.length) return data;
  const skip = new Set(years);
  return data.filter((d) => !skip.has(d.year));
}

function buildExtremeSeries(
  jobs: Awaited<ReturnType<typeof fetchJobsData>>["jobs"],
  years: number[]
): { min: YearValue[]; max: YearValue[] } {
  const min: YearValue[] = [];
  const max: YearValue[] = [];

  for (const year of years) {
    const values = jobs
      .map((job) => {
        const questions = job.post?.group_of_questions?.questions as
          | QuestionWithNumericForecasts[]
          | undefined;
        const q = questions?.find((q) => q.label === String(year));
        if (!q) return null;
        return getSubQuestionValue(q);
      })
      .filter((v): v is number => v != null);

    if (values.length) {
      min.push({ year, value: Math.min(...values) });
      max.push({ year, value: Math.max(...values) });
    }
  }

  return { min, max };
}

export async function OverviewSection({
  className,
  ...props
}: ComponentProps<"section">) {
  let overallData;
  let jobs;
  try {
    [overallData, { jobs }] = await Promise.all([
      fetchOverallData(),
      fetchJobsData(),
    ]);
  } catch (error) {
    logError(error);
    return (
      <QuestionCard
        postIds={[OVERALL_POST_ID]}
        title="Risk Monitor"
        subtitle="Predicted employment change in the next decade"
      >
        <NoQuestionPlaceholder />
      </QuestionCard>
    );
  }

  // --- Overall chart data ---
  const baselineData = Object.entries(GOVERNMENT_BASELINES).map(
    ([year, value]) => ({ year: Number(year), value })
  );

  const overallSeries = [
    {
      id: "gov-baseline",
      color: "gray",
      filled: true,
      dashed: true,
      showDataLabels: true,
      dataLabelPlacement: "above",
      dataLabelTransparent: true,
      dotSize: 3,
      legendStyle: "line",
      label: "Government baseline",
      data: baselineData,
    },
    {
      id: "overall",
      color: "blue",
      filled: false,
      label: "Metaculus forecast",
      showDataLabels: true,
      dataLabelTransparent: true,
      dataLabelPlacement: "below",
      data: overallData,
    },
  ] satisfies LineSeries[];

  // --- By-job vulnerability chart data ---
  const years = overallData.map((d) => d.year);
  const { min, max } = buildExtremeSeries(jobs, years);

  if (min.length && min[0]?.year !== 2025) {
    min.unshift({ year: 2025, value: 0 });
  }
  if (max.length && max[0]?.year !== 2025) {
    max.unshift({ year: 2025, value: 0 });
  }

  const vulnerabilitySeries = [
    {
      id: "growth",
      color: "green",
      filled: true,
      label: "Least vulnerable",
      data: excludeYears(max, [2027]),
    },
    {
      id: "decline",
      color: "red",
      filled: true,
      label: "Most vulnerable",
      data: excludeYears(min, [2027]),
    },
    {
      id: "baseline",
      color: "gray",
      filled: false,
      label: "Overall employment",
      showDataLabels: false,
      data: overallData,
    },
  ] satisfies LineSeries[];

  // --- Summary data ---
  const byYear = new Map(overallData.map((d) => [d.year, d.value]));
  const change2030 = byYear.get(2030);
  const change2035 = byYear.get(2035);

  const allValues2035 = jobs
    .map((job) => {
      const questions = job.post?.group_of_questions?.questions as
        | QuestionWithNumericForecasts[]
        | undefined;
      const q = questions?.find((q) => q.label === "2035");
      if (!q) return null;
      return getSubQuestionValue(q);
    })
    .filter((v): v is number => v != null);
  const mostVulnerable2035 = allValues2035.length
    ? Math.min(...allValues2035)
    : null;
  const leastVulnerable2035 = allValues2035.length
    ? Math.max(...allValues2035)
    : null;

  const formatOverallChange = (value: number) =>
    `${value < 0 ? "fall" : "grow"} ${Math.abs(value).toFixed(0)}%`;
  const formatOccupationChange = (value: number) =>
    `${value < 0 ? "shrink" : "grow"} ${Math.abs(value).toFixed(0)}%`;

  const overallColor = (value: number) =>
    value < 0
      ? "text-salmon-600 dark:text-salmon-600-dark"
      : "text-mint-600 dark:text-mint-600-dark";
  const occupationColor = (value: number) =>
    value < 0
      ? "text-mc-option-2 dark:text-mc-option-2-dark"
      : "text-mc-option-3 dark:text-mc-option-3-dark";

  const allPostIds = [OVERALL_POST_ID, ...jobs.map((j) => j.post_id)];

  return (
    <LaborHubChartHoverProvider>
      <LaborHubChartHoverSection
        className="grid scroll-mt-12 lg:grid-cols-2 print:grid-cols-1 print:gap-4"
        {...props}
      >
        <QuestionCard
          postIds={allPostIds}
          variant="primary"
          title="Risk Monitor"
          className="lg:rounded-r-none lg:border-r lg:border-gray-200 dark:lg:border-gray-800"
        >
          {/* Overall employment chart */}
          <MultiLineRiskChart
            series={overallSeries}
            legendOrder={["overall", "gov-baseline"]}
            showTickLabels={true}
            syncHover
          />

          {/* Summary Text */}
          <div className="text-sm text-blue-700 [text-wrap:pretty] dark:text-blue-700-dark md:text-base">
            Overall employment is projected to{" "}
            {change2030 != null && (
              <>
                <span className={`font-bold ${overallColor(change2030)}`}>
                  {formatOverallChange(change2030)} by 2030
                </span>{" "}
                and{" "}
              </>
            )}
            {change2035 != null && (
              <span className={`font-bold ${overallColor(change2035)}`}>
                {formatOverallChange(change2035)} by 2035
              </span>
            )}{" "}
            relative to 2025 due to AI-driven displacement.{" "}
            {change2035 != null && change2035 < 0
              ? "This sharply contrasts with"
              : change2035 != null && change2035 < 3
                ? "This falls short of"
                : "This is in line with"}{" "}
            <span className="font-bold">
              government baselines projecting +3% growth
            </span>{" "}
            over the decade from aging-adjusted population trends.
          </div>
        </QuestionCard>

        {/* By-job vulnerability chart */}
        <QuestionCard
          postIds={allPostIds}
          title="By Job Vulnerability"
          variant="primary"
          className="lg:rounded-l-none"
        >
          <MultiLineRiskChart
            series={vulnerabilitySeries}
            yAxisLabels={[
              { text: "25% growth", value: 25 },
              { text: "No change", value: 0 },
              { text: "Fully automated", value: -100 },
            ]}
            showTickLabels={true}
            legendOrder={["growth", "decline", "baseline"]}
            syncHover
          />
          <div className="text-sm text-blue-700 [text-wrap:pretty] dark:text-blue-700-dark md:text-base">
            The{" "}
            <span className="font-bold text-mc-option-2 dark:text-mc-option-2-dark">
              most vulnerable AI-exposed occupations
            </span>{" "}
            are expected to{" "}
            {mostVulnerable2035 != null && (
              <span
                className={`font-bold ${occupationColor(mostVulnerable2035)}`}
              >
                {formatOccupationChange(mostVulnerable2035)} by 2035
              </span>
            )}
            {leastVulnerable2035 != null && leastVulnerable2035 > 0 && (
              <>
                , while the{" "}
                {leastVulnerable2035 != null && (
                  <span
                    className={`font-bold ${occupationColor(leastVulnerable2035)}`}
                  >
                    least vulnerable occupations{" "}
                    {formatOccupationChange(leastVulnerable2035)}
                  </span>
                )}
              </>
            )}
            .
          </div>
        </QuestionCard>
      </LaborHubChartHoverSection>
    </LaborHubChartHoverProvider>
  );
}
