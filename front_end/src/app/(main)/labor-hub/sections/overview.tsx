import { ComponentProps } from "react";

import { QuestionWithNumericForecasts } from "@/types/question";
import cn from "@/utils/core/cn";
import { logError } from "@/utils/core/errors";

import { LaborHubByJobVulnerabilityCard } from "../components/labor-hub-by-job-vulnerability-card";
import {
  LaborHubChartHoverProvider,
  LaborHubChartHoverSection,
} from "../components/labor-hub-chart-hover-context";
import { LaborHubMultiLineChart } from "../components/labor-hub-multi-line-chart";
import { OverviewMobileCardTabs } from "../components/overview-mobile-card-tabs";
import { type LineSeries } from "../components/question-cards/multi-line-chart";
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

type JobForecast = { name: string; value: number };

const VULNERABILITY_CHIP_JOB_LIMIT = 3;

const toChartPoints = (data: YearValue[]) =>
  data.map(({ year, value }) => ({ x: year, y: value }));

function getJobValueForYear(
  job: Awaited<ReturnType<typeof fetchJobsData>>["jobs"][number],
  yearLabel: string
): number | null {
  const questions = job.post?.group_of_questions?.questions as
    | QuestionWithNumericForecasts[]
    | undefined;
  const question = questions?.find((q) => q.label === yearLabel);
  if (!question) return null;
  return getSubQuestionValue(question);
}

/** Up to `limit` jobs at the min/max forecasts for a year (same values as the chart envelope). */
function getTopExtremeJobsForYear(
  jobs: Awaited<ReturnType<typeof fetchJobsData>>["jobs"],
  yearLabel: string,
  limit: number = VULNERABILITY_CHIP_JOB_LIMIT
): { mostVulnerable: JobForecast[]; leastVulnerable: JobForecast[] } {
  const rows: JobForecast[] = [];
  for (const job of jobs) {
    const v = getJobValueForYear(job, yearLabel);
    if (v == null) continue;
    rows.push({ name: job.name, value: v });
  }

  if (!rows.length) {
    return { mostVulnerable: [], leastVulnerable: [] };
  }

  const sorted = [...rows].sort((a, b) => a.value - b.value);
  const n = sorted.length;
  const k = Math.min(limit, n);
  const mostVulnerable = sorted.slice(0, k);
  const mostNames = new Set(mostVulnerable.map((j) => j.name));
  const leastVulnerable: JobForecast[] = [];
  for (let i = n - 1; i >= 0 && leastVulnerable.length < limit; i--) {
    const j = sorted[i];
    if (j == null) continue;
    if (!mostNames.has(j.name)) leastVulnerable.push(j);
  }

  return { mostVulnerable, leastVulnerable };
}

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
        title="Risk Monitor"
        subtitle="Predicted employment change in the next decade"
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
          3.1% growth from 2024 to 2034, figure shows a linear interpolation for
          simplicity.
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
    },
    {
      id: "decline",
      color: "red",
      filled: true,
      label: "Most vulnerable",
      data: toChartPoints(excludeYears(min, [2027])),
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
    { text: "40% decline", value: -40 },
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
    `${value < 0 ? "fall" : "grow"} ${Math.abs(value).toFixed(0)}%`;

  const overallColor = (value: number) =>
    value < 0
      ? "text-mc-option-2 dark:text-mc-option-2-dark"
      : "text-mc-option-3 dark:text-mc-option-3-dark";

  const allPostIds = [OVERALL_POST_ID, ...jobs.map((j) => j.post_id)];
  const renderOverallCard = (className?: string) => (
    <QuestionCard
      postIds={allPostIds}
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
          government baselines projecting +3% growth
        </span>{" "}
        over the decade from aging-adjusted population trends.
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
      <LaborHubChartHoverSection className="scroll-mt-12" {...props}>
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
