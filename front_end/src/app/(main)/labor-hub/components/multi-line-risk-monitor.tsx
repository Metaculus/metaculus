import { ComponentProps } from "react";

import { QuestionWithNumericForecasts } from "@/types/question";
import { logError } from "@/utils/core/errors";

import MultiLineRiskChart from "./question-cards/multi-line-risk-chart";
import { NoQuestionPlaceholder } from "./question-cards/placeholder";
import { QuestionCard } from "./question-cards/question-card";
import {
  fetchJobsData,
  fetchOverallData,
  getSubQuestionValue,
  YearValue,
} from "../helpers/fetch-jobs-data";

const OVERALL_POST_ID = 41307;

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

export async function MultiLineRiskMonitor({
  ...props
}: Omit<ComponentProps<typeof QuestionCard>, "postIds">) {
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
      <QuestionCard postIds={[OVERALL_POST_ID]} {...props}>
        <NoQuestionPlaceholder />
      </QuestionCard>
    );
  }

  const years = overallData.map((d) => d.year);
  const { min, max } = buildExtremeSeries(jobs, years);

  // Prepend 2025 baseline if missing
  if (min.length && min[0]?.year !== 2025) {
    min.unshift({ year: 2025, value: 0 });
  }
  if (max.length && max[0]?.year !== 2025) {
    max.unshift({ year: 2025, value: 0 });
  }

  const series = [
    {
      id: "growth",
      color: "green" as const,
      filled: true,
      label: "Least vulnerable",
      data: max,
    },
    {
      id: "decline",
      color: "red" as const,
      filled: true,
      label: "Most vulnerable",
      data: min,
    },
    {
      id: "baseline",
      color: "gray" as const,
      filled: false,
      label: "Overall employment",
      data: overallData,
    },
  ];

  const postIds = [OVERALL_POST_ID, ...jobs.map((j) => j.post_id)];

  return (
    <QuestionCard postIds={postIds} {...props}>
      <MultiLineRiskChart series={series} />
    </QuestionCard>
  );
}
