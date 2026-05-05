import { ComponentProps } from "react";

import cn from "@/utils/core/cn";
import { logError } from "@/utils/core/errors";

import { LaborHubByJobVulnerabilityCard } from "../components/labor_hub_by_job_vulnerability_card";
import {
  LaborHubChartHoverProvider,
  LaborHubChartHoverSection,
} from "../components/labor_hub_chart_hover_context";
import { LaborHubMultiLineChart } from "../components/labor_hub_multi_line_chart";
import { OverviewMobileCardTabs } from "../components/overview_mobile_card_tabs";
import { type LineSeries } from "../components/question_cards/multi_line_chart";
import { NoQuestionPlaceholder } from "../components/question_cards/placeholder";
import { QuestionCard } from "../components/question_cards/question_card";
import { GOVERNMENT_BASELINES } from "../data";
import {
  fetchJobsData,
  fetchOverallData,
  getJobValueForYear,
  getTopExtremeJobsForYear,
  OVERALL_POST_ID,
  YearValue,
} from "../helpers/fetch_jobs_data";

function excludeYears(
  data: YearValue[],
  years: readonly number[]
): YearValue[] {
  if (!years.length) return data;
  const skip = new Set(years);
  return data.filter((d) => !skip.has(d.year));
}

const toChartPoints = (data: YearValue[]) =>
  data.map(({ year, value }) => ({ x: year, y: value }));

function buildAverageSeriesForJobs(
  jobs: Awaited<ReturnType<typeof fetchJobsData>>["jobs"],
  years: number[],
  jobNames: string[]
): YearValue[] {
  const selectedJobNames = new Set(jobNames);
  const selectedJobs = jobs.filter((job) => selectedJobNames.has(job.name));

  const averages: YearValue[] = [];

  for (const year of years) {
    const values = selectedJobs
      .map((job) => getJobValueForYear(job, String(year)))
      .filter((v): v is number => v != null);

    if (values.length) {
      averages.push({
        year,
        value: values.reduce((sum, value) => sum + value, 0) / values.length,
      });
    }
  }

  return averages;
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
        title="Overall Employment"
        variant="primary"
      >
        <NoQuestionPlaceholder />
      </QuestionCard>
    );
  }

  // --- Overall chart data ---
  const baselineData = Object.entries(GOVERNMENT_BASELINES).map(
    ([year, value]) => ({ x: Number(year), y: value })
  );

  const overallSeries = [
    {
      id: "gov-baseline",
      color: "gray",
      filled: true,
      dashed: true,
      dataLabels: "always",
      dataLabelPlacement: "above",
      dataLabelTransparent: true,
      dotSize: 3,
      legendStyle: "line",
      legendDetail: (
        <>
          The US Bureau of Labor Statistics{" "}
          <a
            href="https://www.bls.gov/news.release/ecopro.nr0.htm"
            target="_blank"
            rel="noreferrer"
          >
            projected
          </a>{" "}
          3.1% growth from 2024 to 2034, the figure shows a linear interpolation
          and baseline adjustment to 2025 for simplicity.
        </>
      ),
      label: "Government baseline",
      data: baselineData,
    },
    {
      id: "overall",
      color: "blue",
      filled: false,
      dataLabelTextClassName: "fill-mc-option-2 dark:fill-mc-option-2-dark",
      label: "Metaculus forecast",
      dataLabels: "always",
      dataLabelTransparent: true,
      dataLabelPlacement: "below",
      data: toChartPoints(overallData),
    },
  ] satisfies LineSeries[];

  // --- By-job vulnerability chart data ---
  const years = overallData.map((d) => d.year);
  const extremeJobs2035 = getTopExtremeJobsForYear(jobs, "2035");
  const min = buildAverageSeriesForJobs(
    jobs,
    years,
    extremeJobs2035.mostVulnerable.map((job) => job.name)
  );
  const max = buildAverageSeriesForJobs(
    jobs,
    years,
    extremeJobs2035.leastVulnerable.map((job) => job.name)
  );

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
      data: toChartPoints(excludeYears(max, [2027])),
      legendDetail: (
        <>
          Least and most vulnerable are the 3 occupations from our set of 15
          forecasted to grow and shrink the most in 2035. Values are averages of
          the median forecasts. Visit the <a href="#jobs">Jobs Monitor</a> below
          for forecasts by occupation and the{" "}
          <a href="#methodology">Methodology section</a> for details.
        </>
      ),
    },
    {
      id: "decline",
      color: "red",
      filled: true,
      label: "Most vulnerable",
      data: toChartPoints(excludeYears(min, [2027])),
      legendDetail: (
        <>
          Least and most vulnerable are the 3 occupations from our set of 15
          forecasted to grow and shrink the most in 2035. Values are averages of
          the median forecasts. Visit the <a href="#jobs">Jobs Monitor</a> below
          for forecasts by occupation and the{" "}
          <a href="#methodology">Methodology section</a> for details.
        </>
      ),
    },
    {
      id: "baseline",
      color: "blue",
      filled: false,
      label: "Overall employment",
      data: toChartPoints(overallData),
    },
  ] satisfies LineSeries[];

  const vulnerabilityYAxisLabels = [
    { text: "10% growth", value: 10 },
    { text: "No change", value: 0 },
    { text: "30% decline", value: -30 },
  ] as const;

  // --- Summary data ---
  const byYear = new Map(overallData.map((d) => [d.year, d.value]));
  const change2030 = byYear.get(2030);
  const change2035 = byYear.get(2035);

  const mostVulnerable2035 =
    min.find((point) => point.year === 2035)?.value ?? null;
  const leastVulnerable2035 =
    max.find((point) => point.year === 2035)?.value ?? null;

  const formatOverallChange = (value: number) =>
    `${value < 0 ? "fall" : "grow"} ${Math.abs(value).toFixed(1)}%`;

  const overallColor = (value: number) =>
    value < 0
      ? "text-mc-option-2 dark:text-mc-option-2-dark"
      : "text-mc-option-3 dark:text-mc-option-3-dark";

  const allPostIds = [OVERALL_POST_ID, ...jobs.map((j) => j.post_id)];
  const renderOverallCard = (className?: string) => (
    <QuestionCard
      postIds={[OVERALL_POST_ID]}
      variant="primary"
      title="Overall Employment"
      titleClassName="hidden lg:block print:block"
      className={cn("py-4", className)}
    >
      {/* Overall employment chart */}
      <LaborHubMultiLineChart
        series={overallSeries}
        legendOrder={["overall", "gov-baseline"]}
        showTickLabels={true}
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
          government baselines projecting +
          {GOVERNMENT_BASELINES["2035"].toFixed(1)}% growth
        </span>{" "}
        over the decade when accounting for aging-adjusted population trends.
      </div>
    </QuestionCard>
  );
  const renderVulnerabilityCard = (className?: string) => (
    <QuestionCard
      postIds={allPostIds}
      title="By Job Vulnerability"
      variant="primary"
      titleClassName="hidden lg:block print:block"
      className={cn("py-4", className)}
    >
      <LaborHubByJobVulnerabilityCard
        series={vulnerabilitySeries}
        yAxisLabels={[...vulnerabilityYAxisLabels]}
        extremeJobs2035={extremeJobs2035}
        mostVulnerable2035={mostVulnerable2035}
        leastVulnerable2035={leastVulnerable2035}
      />
    </QuestionCard>
  );

  return (
    <LaborHubChartHoverProvider>
      <LaborHubChartHoverSection className="" {...props}>
        <OverviewMobileCardTabs
          tabs={[
            {
              id: "overall",
              label: "Overall Employment",
              content: renderOverallCard(),
            },
            {
              id: "vulnerability",
              label: "By Job Vulnerability",
              content: renderVulnerabilityCard(),
            },
          ]}
        />
        <div className="hidden lg:grid lg:grid-cols-2 print:grid print:grid-cols-2 print:gap-4">
          {renderOverallCard(
            "lg:rounded-r-none lg:border-r lg:border-gray-200 dark:lg:border-gray-700/30"
          )}
          {renderVulnerabilityCard(
            "bg-opacity-80 dark:bg-opacity-70 lg:rounded-l-none"
          )}
        </div>
      </LaborHubChartHoverSection>
    </LaborHubChartHoverProvider>
  );
}
