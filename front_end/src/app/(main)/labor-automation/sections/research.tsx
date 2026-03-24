import { CSSProperties, ComponentProps, Suspense } from "react";

import { QuestionWithNumericForecasts } from "@/types/question";
import { logError } from "@/utils/core/errors";

import { NoQuestionPlaceholder } from "../components/question-cards/placeholder";
import {
  SectionCard,
  SectionHeader,
  ContentParagraph,
} from "../components/section";
import {
  TableCompact,
  TableCompactHead,
  TableCompactRow,
  TableCompactHeaderCell,
  TableCompactBody,
  TableCompactCell,
  PercentageChange,
} from "../components/table-compact";
import { fetchJobsData, getSubQuestionValue } from "../helpers/fetch-jobs-data";

function getCellBackgroundStyle(
  value: number,
  maxAbsValue: number,
  invertColors = false
): CSSProperties {
  if (value === 0) return {};
  const ratio = Math.min(Math.abs(value) / maxAbsValue, 1);
  const opacity = 0.05 + ratio * 0.55;
  const isPositive = value > 0;
  const useGreen = invertColors ? !isPositive : isPositive;
  const color = useGreen
    ? `rgba(102, 165, 102, ${opacity})`
    : `rgba(213, 139, 128, ${opacity})`;
  return { backgroundColor: color };
}

export function ResearchSection({
  children,
  ...props
}: ComponentProps<"section">) {
  return (
    <SectionCard {...props}>
      <SectionHeader>
        How does this build on or differ from existing research?
      </SectionHeader>

      <div className="my-4">{children}</div>
      <ContentParagraph>
        A number of recent research publications have identified occupations,
        tasks, and industries that are more vulnerable to automation, as well as
        assessing recent trends in employment to understand the impact of AI.
        Recent work from Stanford University has asserted that AI has already
        had an impact on early career work, while other sources do not yet see
        strong signals. The forecasts here extend this work out to the future,
        eliciting predictions on forecasts by industry. In many cases the
        forecasts agree with classifications from the OECD and other sources of
        exposure to automation, with some key differences.
      </ContentParagraph>
      <ContentParagraph>
        Teachers have high vulnerability ratings, but are predicted to see
        growth as forecasters expect human presence will be strongly desired in
        classrooms by schools and parents, even if schools do increasingly adopt
        AI-powered educational tools. Conversely, occupations such as janitors
        and warehouse workers are rated as low exposure due to the high physical
        nature of the work, but forecasters anticipate that robotic capabilities
        will begin to displace more of these roles by 2035. These forecasts
        provide important context to our understanding of workforce prospects by
        quantifying the predicted impact of AI on employment levels.
      </ContentParagraph>
      <Suspense
        fallback={
          <div className="mt-6 animate-pulse overflow-hidden rounded bg-blue-200 p-4 dark:bg-blue-800 md:p-5">
            <div className="mb-4 h-4 w-1/2 rounded bg-gray-300 dark:bg-gray-600" />
            <div className="flex flex-col gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-4 w-full rounded bg-gray-300 dark:bg-gray-600"
                />
              ))}
            </div>
          </div>
        }
      >
        <ResearchTable />
      </Suspense>
    </SectionCard>
  );
}

async function ResearchTable() {
  let jobs;
  try {
    ({ jobs } = await fetchJobsData());
  } catch (error) {
    logError(error);
    return <NoQuestionPlaceholder />;
  }

  // Collect all unique year labels
  const labelsSet = new Set<string>();
  for (const job of jobs) {
    const questions = job.post?.group_of_questions?.questions;
    if (!questions) continue;
    for (const q of questions) {
      if (q.label) labelsSet.add(q.label);
    }
  }
  const columns = Array.from(labelsSet).sort();

  // Build rows: [name, ...yearValues, rating], sorted by last year value descending
  const tableRows = jobs
    .map((job) => {
      const questions = job.post?.group_of_questions?.questions as
        | QuestionWithNumericForecasts[]
        | undefined;
      const questionByLabel = new Map(
        questions?.map((q) => [q.label, q]) ?? []
      );
      const values = columns.map((col) => {
        const q = questionByLabel.get(col);
        if (!q) return null;
        return getSubQuestionValue(q);
      });
      return { name: job.name, values, rating: job.rating };
    })
    .sort((a, b) => {
      const lastA = a.values[a.values.length - 1] ?? 0;
      const lastB = b.values[b.values.length - 1] ?? 0;
      return lastB - lastA;
    });

  return (
    <TableCompact
      className="inverted mt-6 [&_table]:border-separate [&_table]:border-spacing-x-2 [&_table]:border-spacing-y-2 [&_td]:py-0.5 [&_th]:pb-3"
      HeadingSection={
        <div className="mb-4 text-center text-sm font-normal leading-5 text-blue-700 dark:text-blue-400">
          Metaculus Predicted Employment Change
        </div>
      }
    >
      <TableCompactHead>
        <TableCompactRow>
          <TableCompactHeaderCell className="w-[40%]">
            Occupation
          </TableCompactHeaderCell>
          {columns.map((col) => (
            <TableCompactHeaderCell key={col} className="w-[20%] text-center">
              {col}
            </TableCompactHeaderCell>
          ))}
          <TableCompactHeaderCell className="w-[20%] text-center">
            AI Vulnerability Rating
          </TableCompactHeaderCell>
        </TableCompactRow>
      </TableCompactHead>
      <TableCompactBody>
        {tableRows.map((row) => (
          <TableCompactRow key={row.name}>
            <TableCompactCell className="font-medium">
              {row.name}
            </TableCompactCell>
            {row.values.map((value, i) => (
              <TableCompactCell
                key={columns[i]}
                className="text-center"
                style={getCellBackgroundStyle(value ?? 0, 100)}
              >
                {value != null ? (
                  <PercentageChange value={Number(value.toFixed(1))} />
                ) : (
                  <span className="text-gray-400 dark:text-gray-500">—</span>
                )}
              </TableCompactCell>
            ))}
            <TableCompactCell
              className="text-center"
              style={getCellBackgroundStyle(row.rating, 2, true)}
            >
              <span
                className={
                  row.rating >= 0
                    ? "text-salmon-700 dark:text-salmon-400"
                    : "text-mint-800 dark:text-mint-300"
                }
              >
                {row.rating > 0 ? "+" : ""}
                {row.rating}
              </span>
            </TableCompactCell>
          </TableCompactRow>
        ))}
      </TableCompactBody>
    </TableCompact>
  );
}
