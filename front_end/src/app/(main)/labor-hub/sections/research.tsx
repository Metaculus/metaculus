import { ComponentProps, Suspense } from "react";

import { ThemeOverrideContainer } from "@/contexts/theme_override_context";
import { QuestionWithNumericForecasts } from "@/types/question";
import cn from "@/utils/core/cn";
import { logError } from "@/utils/core/errors";

import { SortableResearchTable } from "./sortable-research-table";
import { ActivityCard } from "../components/activity-card";
import { NoQuestionPlaceholder } from "../components/question-cards/placeholder";
import { QuestionLoader } from "../components/question-cards/question";
import {
  SectionCard,
  SectionHeader,
  ContentParagraph,
} from "../components/section";
import { fetchJobsData, getSubQuestionValue } from "../helpers/fetch-jobs-data";

export function ResearchSection({
  className,
  ...props
}: ComponentProps<"section">) {
  return (
    <SectionCard className={cn("space-y-4", className)} {...props}>
      <SectionHeader>
        How does this build on or differ from existing research?
      </SectionHeader>

      <div className="float-right !mb-4 !mt-8 flex w-full flex-col gap-4 md:ml-6 md:w-[calc(50%-1.5rem)]">
        <QuestionLoader questionId={42850} />
        <ActivityCard
          avatar="https://cdn.metaculus.com/labor-hub/haiku_256.jpg"
          username="Nathan Metzger (Haiku)"
          subtitle="Pro Forecaster"
        >
          Huge numbers of jobs could hinge on the success or failure of some
          particular strike, or bill, or lawsuit. We should weigh the political
          power of the workers in each occupation, alongside AI capability
          considerations.
        </ActivityCard>
      </div>

      <ContentParagraph className="!mt-8">
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

  return <SortableResearchTable columns={columns} rows={tableRows} />;
}
