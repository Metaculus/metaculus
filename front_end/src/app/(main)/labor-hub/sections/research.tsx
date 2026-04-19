import { ComponentProps, Suspense } from "react";

import { QuestionWithNumericForecasts } from "@/types/question";
import cn from "@/utils/core/cn";
import { logError } from "@/utils/core/errors";

import { SortableResearchTable } from "./sortable_research_table";
import { ActivityCard } from "../components/activity_card";
import { DefinitionTooltip } from "../components/definition_tooltip";
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
            vulnerable to automation, while other work has examined recent
            employment patterns for signs of AI’s labor market effects.{" "}
            <a
              href="https://digitaleconomy.stanford.edu/publication/canaries-in-the-coal-mine-six-facts-about-the-recent-employment-effects-of-artificial-intelligence/"
              target="_blank"
              rel="noreferrer"
            >
              Recent work from Stanford University
            </a>{" "}
            argues that AI has already had an impact on early career work, while
            other sources such as{" "}
            <a
              href="https://budgetlab.yale.edu/research/evaluating-impact-ai-labor-market-current-state-affairs"
              target="_blank"
              rel="noreferrer"
            >
              research from the Budget Lab at Yale
            </a>{" "}
            do not yet see strong signals. Exposure and vulnerability ratings
            typically are not intended to be predictive of the future, but
            instead are correlational measures of current AI usage and task
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
            In the AI exposure literature and research, teachers stand out as
            having high exposure ratings, but are predicted to see growth as
            forecasters expect human presence will be strongly desired in
            classrooms by schools and parents, even if schools do increasingly
            adopt AI-powered educational tools. Conversely, warehouse workers
            are rated as low exposure due to the high physical nature of the
            work, but forecasters anticipate that robotic capabilities will
            begin to displace more of these roles by 2035. Forecasters do expect
            that the high exposure and vulnerability of lawyers, sales
            representatives, financial specialists, and software developers will
            translate to significant employment reductions in these fields over
            the next decade. These forecasts provide important context to our
            understanding of workforce prospects by quantifying the predicted
            impact of AI on employment levels.
          </ContentParagraph>
        </div>

        <div className="flex min-w-0 flex-col gap-4 [&>*]:min-w-0">
          <FlippableChartTimelineCard
            title={
              <DefinitionTooltip
                tooltipContent={
                  <>
                    Using{" "}
                    <a
                      href="https://budgetlab.yale.edu/research/tracking-impact-ai-labor-market"
                      target="_blank"
                      rel="noreferrer"
                    >
                      data from the Yale Budget Lab
                    </a>
                    , this measures how much the occupational mix is changing
                    from a baseline. Larger numbers indicate greater shares of
                    people working in different occupations from the baseline
                    scenario, the speed of which suggests how much occupational
                    disruption is happening in the economy.
                  </>
                }
              >
                Change in the occupational mix
              </DefinitionTooltip>
            }
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
                legendDetail: (
                  <>
                    This line shows the change in the occupational mix if we
                    were to place the beginning of the internet era (January
                    1996) at the beginning of the AI era (November 2022) to
                    compare how quickly the occupational mix has changed in each
                    case.
                  </>
                ),
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
      <ResearchTableLegend />
      <div className="break-inside-avoid text-blue-700 dark:text-blue-700-dark">
        <ol className="list-decimal space-y-2 pl-5 text-xs [text-wrap:pretty]">
          <li>
            See the underlying data and how we adapted the figures from these
            sources{" "}
            <a
              href="https://docs.google.com/spreadsheets/d/1-VMGsNPDg9QFnBwwMSYvjEmfVfBDqJr9MZgachjE5VQ/edit?usp=sharing"
              target="_blank"
              rel="noreferrer"
            >
              here
            </a>
            .
          </li>
          <li>
            Occupational exposure figures from{" "}
            <a
              href="https://papers.ssrn.com/sol3/papers.cfm?abstract_id=4414065"
              target="_blank"
              rel="noreferrer"
            >
              Felten et al. (2023)
            </a>
            , estimating how much the typical tasks and abilities in each
            occupation overlap with what generative AI systems are good at. Data
            was based on 2010 SOC codes, which Metaculus has crosswalked to the
            2018 SOC. The paper presents both language modeling and image
            generation exposure scores, from which only language modeling scores
            are used here.
          </li>
          <li>
            A vulnerability score calculated from{" "}
            <a
              href="https://www.nber.org/papers/w34705"
              target="_blank"
              rel="noreferrer"
            >
              Manning and Aguirre (2026)
            </a>{" "}
            from measures of AI exposure and adaptive capacity (a measure of a
            worker’s ability to navigate job transitions if displaced). These
            scores were combined into a vulnerability score using the same
            approach as used in Figure 1 of the paper.
          </li>
          <li>
            Occupational exposure measured by Anthropic using usage data from
            their AI system, Claude, as reported in the data for the{" "}
            <a
              href="https://www.anthropic.com/economic-index"
              target="_blank"
              rel="noreferrer"
            >
              Anthropic Economic Index
            </a>
            . More details about Anthropic’s findings are reported in{" "}
            <a
              href="https://www.anthropic.com/research/labor-market-impacts"
              target="_blank"
              rel="noreferrer"
            >
              Massenkoff and McCrory (2026)
            </a>
            .
          </li>
        </ol>
      </div>
    </SectionCard>
  );
}

const LEGEND_RED = "rgba(213, 139, 128)";
const LEGEND_GREEN = "rgba(102, 165, 102)";
// Matches the min/max opacity used by getCellBackgroundStyle in the table,
// so the bar fades through the panel background (not yellow) at the center.
const LEGEND_RED_MAX = "rgba(213, 139, 128, 0.6)";
const LEGEND_RED_MIN = "rgba(213, 139, 128, 0.05)";
const LEGEND_GREEN_MIN = "rgba(102, 165, 102, 0.05)";
const LEGEND_GREEN_MAX = "rgba(102, 165, 102, 0.6)";

function LegendTextRow({
  label,
  left,
  right,
}: {
  label: string;
  left: string;
  right: string;
}) {
  return (
    <>
      <div
        aria-hidden="true"
        className="text-[0.625rem] font-medium uppercase text-gray-600 dark:text-gray-600-dark md:text-xs"
      >
        {label}
      </div>
      <div className="flex items-center justify-between gap-4 text-xs">
        <span style={{ color: LEGEND_RED }}>{left}</span>
        <span className="text-right" style={{ color: LEGEND_GREEN }}>
          {right}
        </span>
      </div>
    </>
  );
}

function ResearchTableLegend() {
  return (
    <div
      aria-label="Table color legend"
      className="mt-4 break-inside-avoid rounded bg-blue-200 p-4 dark:bg-blue-800 md:px-6 md:py-5 print:break-inside-avoid-page"
    >
      <div className="mb-4 text-xs text-gray-600 dark:text-gray-600-dark">
        Note: each literature column has its own color range, where the reddest
        is the lowest AI exposure number in the column and the greenest is the
        highest AI exposure number in that column. The Metaculus forecast
        columns for 2030 and 2035 share a color range; the largest predicted
        decline across 2030 and 2035 is the reddest, while the largest predicted
        growth across 2030 and 2035 is the greenest.
      </div>
      <div className="grid grid-cols-[minmax(0,5rem)_minmax(0,1fr)] items-end gap-x-4 md:grid-cols-[minmax(0,auto)_minmax(0,1fr)] md:gap-x-8">
        <LegendTextRow
          label="Metaculus Forecasts"
          left="Employment decline"
          right="Employment growth"
        />
        <div aria-hidden="true" />
        <div
          aria-hidden="true"
          className="my-2 h-2.5 w-full rounded-full"
          style={{
            backgroundImage: `linear-gradient(to right, ${LEGEND_RED_MAX} 0%, ${LEGEND_RED_MIN} 50%, ${LEGEND_GREEN_MIN} 50%, ${LEGEND_GREEN_MAX} 100%)`,
          }}
        />
        <LegendTextRow
          label="Literature"
          left="Higher AI exposure"
          right="Lower AI exposure"
        />
      </div>
    </div>
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
