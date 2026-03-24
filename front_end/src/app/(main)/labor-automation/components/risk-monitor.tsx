import { ComponentProps } from "react";

import { QuestionWithNumericForecasts } from "@/types/question";
import { logError } from "@/utils/core/errors";

import { NoQuestionPlaceholder } from "./question-cards/placeholder";
import { QuestionCard } from "./question-cards/question-card";
import { RiskChart } from "../components/question-cards/risk-chart";
import {
  fetchJobsData,
  fetchOverallData,
  getSubQuestionValue,
} from "../helpers/fetch-jobs-data";

const OVERALL_POST_ID = 41307;

export async function RiskMonitor({
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

  const riskData = overallData.map((d) => ({ year: d.year, change: d.value }));

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

  return (
    <>
      <QuestionCard postIds={[OVERALL_POST_ID]} {...props}>
        <RiskChart data={riskData ?? []} />
      </QuestionCard>
      {/* Summary Text */}
      <div className="text-base text-blue-700 dark:text-blue-700-dark md:text-xl">
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
        over the decade from aging-adjusted population trends. The{" "}
        <span className="font-bold text-mc-option-2 dark:text-mc-option-2-dark">
          most vulnerable AI-exposed occupations
        </span>{" "}
        are expected to{" "}
        {mostVulnerable2035 != null && (
          <span className={`font-bold ${occupationColor(mostVulnerable2035)}`}>
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
    </>
  );
}
