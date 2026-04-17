import { ComponentProps, Suspense } from "react";

import { QuestionWithNumericForecasts } from "@/types/question";
import cn from "@/utils/core/cn";
import { logError } from "@/utils/core/errors";

import { SortableResearchTable } from "./sortable_research_table";
import { ActivityCard } from "../components/activity_card";
import { FlippableChartTimelineCard } from "../components/question_cards/flippable_chart_timeline_card";
import { NoQuestionPlaceholder } from "../components/question_cards/placeholder";
import {
  SectionCard,
  SectionHeader,
  ContentParagraph,
} from "../components/section";
import { fetchJobsData, getSubQuestionValue } from "../helpers/fetch_jobs_data";

export function ResearchSection({
  className,
  ...props
}: ComponentProps<"section">) {
  return (
    <SectionCard className={cn("space-y-4", className)} {...props}>
      <SectionHeader>Comparison to Existing Research</SectionHeader>

      <div className="grid gap-8 pb-4 lg:grid-cols-2 print:grid-cols-2">
        <div className="flex min-w-0 flex-col space-y-4 [&>*]:min-w-0">
          <ContentParagraph small>
            A number of recent research publications have identified
            occupations, tasks, and industries that are more exposed or
            vulnerable to automation, as well as assessed recent trends in
            employment to understand the impact of AI.{" "}
            <a
              href="https://digitaleconomy.stanford.edu/publication/canaries-in-the-coal-mine-six-facts-about-the-recent-employment-effects-of-artificial-intelligence/"
              target="_blank"
              rel="noreferrer"
            >
              Recent work from Stanford University
            </a>{" "}
            has asserted that AI has already had an impact on early career work,
            while other sources such as{" "}
            <a
              href="https://budgetlab.yale.edu/research/evaluating-impact-ai-labor-market-current-state-affairs"
              target="_blank"
              rel="noreferrer"
            >
              research from the Budget Lab at Yale
            </a>{" "}
            do not yet see strong signals. These exposure and vulnerability
            ratings typically are not intended to be predictive of the future,
            but instead are correlational measures of current AI usage and task
            patterns.
          </ContentParagraph>
          <ContentParagraph small>
            The forecasts Metaculus is presenting in the Hub fill a gap in our
            current understanding, directly providing wisdom of the crowd
            powered predictions on employment outcomes when taking into account
            the impact of AI. In many cases, the forecasts align with what the
            exposure and vulnerability literature would indicate, with some key
            differences.
          </ContentParagraph>
          <ContentParagraph small>
            Teachers have high vulnerability ratings, but are predicted to see
            growth as forecasters expect human presence will be strongly desired
            in classrooms by schools and parents, even if schools do
            increasingly adopt AI-powered educational tools. Conversely,
            occupations such as janitors and warehouse workers are rated as low
            exposure due to the high physical nature of the work, but
            forecasters anticipate that robotic capabilities will begin to
            displace more of these roles by 2035. These forecasts provide
            important context to our understanding of workforce prospects by
            quantifying the predicted impact of AI on employment levels.
          </ContentParagraph>
        </div>

        <div className="flex min-w-0 flex-col gap-4 [&>*]:min-w-0">
          <FlippableChartTimelineCard
            title="Change in the occupational mix (relative to November 2022 ChatGPT release baseline)"
            questionId={42850}
            prefer="chart"
            historicalValues={{
              2023: 3.17,
              2024: 3.92,
              2025: 5.06,
            }}
            seriesTitle="AI (baseline Nov 2022)"
            extraRows={[
              {
                title: "Internet (baseline Jan 1996)",
                color: "mc5",
                dashed: true,
                dotSize: 1,
                historicalValues: {
                  2023: 2.61,
                  2024: 3.2,
                  2025: 3.97,
                  2026: 5.02,
                  2027: 5.57,
                  2028: 6.63,
                },
              },
            ]}
            chartProps={{
              showTickLabels: true,
              valueFormat: "percentage",
              decimals: 1,
            }}
          />
          <ActivityCard
            avatar="https://cdn.metaculus.com/labor-hub/adonis_256.jpg"
            username="Adonis da Silva (Adonis)"
            subtitle="Pro Forecaster"
            link="https://www.metaculus.com/questions/41307/us-employment-level-change-vs-2025/#comment-779184"
          >
            Even if some professions become completely obsolete, employment
            levels could continue along the same trend if people shift to other
            careers. Demand is likely to increase in jobs that rely on human
            interaction or in which products increase in value if they&apos;re
            human-made or scarce, or, temporarily, in some that require manual
            labor.
          </ActivityCard>
        </div>
      </div>

      <Suspense
        fallback={
          <div
            data-loading="true"
            className="mt-6 animate-pulse overflow-hidden rounded bg-blue-200 p-4 dark:bg-blue-800 md:p-5"
          >
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
        <ResearchTable labels={["2030", "2035"]} />
      </Suspense>
    </SectionCard>
  );
}

async function ResearchTable({ labels }: { labels?: string[] } = {}) {
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
  let columns = Array.from(labelsSet).sort();
  if (labels?.length) {
    const allowed = new Set(labels);
    columns = columns.filter((col) => allowed.has(col));
  }

  // Build rows: [name, ...yearValues, felten, mna, aoe], sorted by last year value descending
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
      return {
        name: job.name,
        values,
        felten: job.felten,
        mna: job.mna,
        aoe: job.aoe,
      };
    })
    .sort((a, b) => {
      const lastA = a.values[a.values.length - 1] ?? 0;
      const lastB = b.values[b.values.length - 1] ?? 0;
      return lastB - lastA;
    });

  return <SortableResearchTable columns={columns} rows={tableRows} />;
}
