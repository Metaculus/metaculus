"use client";

import { ComponentProps, useState } from "react";

import ButtonGroup from "@/components/ui/button_group";
import cn from "@/utils/core/cn";

import { ActivityCard } from "../components/activity_card";
import { QuestionCard } from "../components/question_cards/question_card";
import { JOBS_INSIGHTS } from "../jobs_insights";

export type JobRow = {
  name: string;
  values: Record<string, number | null>;
};

const BAR_SCALE = 30; // as maximum percentage of the bar width

function ContextualBar({ name, percent }: { name: string; percent: number }) {
  const barWidth = `${Math.min(Math.abs(percent) * (100 / BAR_SCALE), 100)}%`;
  const isPositive = percent >= 0;

  return (
    <div className="group relative flex h-6 w-full cursor-default">
      <div
        className={cn(
          "absolute inset-0 flex",
          isPositive ? "justify-start" : "justify-start md:justify-end"
        )}
      >
        <div
          className={cn("flex h-full rounded-lg border", {
            "border-mc-option-2/50 bg-mc-option-2/20 dark:border-mc-option-2-dark/50 dark:bg-mc-option-2-dark/30":
              !isPositive,
            "border-mc-option-3/50 bg-mc-option-3/20 dark:border-mc-option-3-dark/50 dark:bg-mc-option-3-dark/30":
              isPositive,
          })}
          style={{ width: barWidth }}
        ></div>
      </div>
      <div
        className={cn(
          "relative flex h-full w-full justify-between text-xs font-medium md:text-sm",
          !isPositive && "md:flex-row-reverse"
        )}
      >
        <div className="flex h-full items-center justify-start px-1.5 md:px-2.5">
          <span className="truncate text-gray-900 dark:text-gray-900-dark">
            {name}
          </span>
        </div>
        <div className="flex h-full flex-shrink-0 items-center justify-end px-1.5 opacity-100 md:px-2.5 md:opacity-0 md:group-hover:opacity-100">
          <span
            className={cn("truncate text-right", {
              "text-mc-option-3 dark:text-mc-option-3-dark": isPositive,
              "text-mc-option-2 dark:text-mc-option-2-dark": !isPositive,
            })}
          >
            {isPositive ? "+" : "-"}
            {Math.abs(percent).toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
}

export function JobsMonitorSection({
  columns,
  jobs,
  postIds = [],
  ...props
}: {
  columns: string[];
  jobs: JobRow[];
  postIds?: number[];
} & ComponentProps<"div">) {
  const [year, setYear] = useState(columns[columns.length - 1] ?? "");
  const jobsWithSelectedYearData = jobs.filter(
    (job) => job.values[year] != null
  );

  return (
    <QuestionCard
      variant="section"
      titleClassName="md:text-center print:text-center"
      title="Jobs Monitor"
      subtitle="AI is reshaping the job market, but not all fields are affected equally."
      subtitleClassName="print:mx-auto print:text-center"
      postIds={postIds}
      {...props}
    >
      <div className="mb-4 mt-3 flex justify-start md:mb-8 md:mt-5 md:justify-center print:justify-center">
        <ButtonGroup
          value={year}
          buttons={columns.map((col) => ({
            value: col,
            label: `by ${col}`,
          }))}
          onChange={setYear}
          variant="tertiary"
          activeVariant="primary"
        />
      </div>

      <div className="mx-auto flex w-full max-w-3xl flex-col">
        <div className="mb-3 text-xs text-gray-500 dark:text-gray-500-dark md:mb-2 md:text-center md:text-sm print:text-center">
          (Percentage change in employment)
        </div>
        <div className="mb-4 hidden grid-cols-5 gap-2 text-sm font-medium md:grid">
          <div className="text-left text-salmon-700 dark:text-salmon-700-dark">
            {BAR_SCALE}% lower
          </div>
          <div className="text-left text-salmon-700 dark:text-salmon-700-dark">
            {BAR_SCALE / 2}% lower
          </div>
          <div className="text-center text-blue-800 dark:text-blue-800-dark">
            2025 Baseline
          </div>
          <div className="text-right text-olive-700 dark:text-olive-700-dark">
            {BAR_SCALE / 2}% higher
          </div>
          <div className="text-right text-olive-700 dark:text-olive-700-dark"></div>
        </div>
        <div className="relative flex w-full flex-col gap-2.5 py-1 md:gap-1">
          <div className="absolute inset-0 hidden grid-cols-4 divide-x divide-dashed divide-gray-500 border-x border-t border-dashed border-gray-500 opacity-50 dark:divide-gray-500-dark dark:border-gray-500-dark md:grid">
            <div></div>
            <div></div>
            <div></div>
            <div></div>
          </div>

          <div className="grid break-inside-avoid break-after-avoid gap-2 md:grid-cols-2 md:gap-0">
            <div className="text-xs font-medium text-mc-option-3 dark:text-mc-option-3-dark md:hidden">
              Expected growth
            </div>
            <div className="flex flex-col gap-1 md:col-start-2">
              {jobsWithSelectedYearData
                .filter((job) => (job.values[year] ?? 0) >= 0)
                .sort((a, b) => (b.values[year] ?? 0) - (a.values[year] ?? 0))
                .map((job) => (
                  <ContextualBar
                    key={job.name}
                    name={job.name}
                    percent={job.values[year] ?? 0}
                  />
                ))}
            </div>
          </div>
          <div className="md:hidden">
            <InsightCard context="positive">
              {JOBS_INSIGHTS[year as keyof typeof JOBS_INSIGHTS]?.positive}
            </InsightCard>
          </div>
          <div className="grid break-inside-avoid break-after-avoid gap-2 md:grid-cols-2 md:gap-0">
            <div className="text-xs font-medium text-mc-option-2 dark:text-mc-option-2-dark md:hidden">
              Expected decline
            </div>
            <div className="flex flex-col gap-1">
              {jobsWithSelectedYearData
                .filter((job) => (job.values[year] ?? 0) < 0)
                .sort((a, b) => (b.values[year] ?? 0) - (a.values[year] ?? 0))
                .map((job) => (
                  <ContextualBar
                    key={job.name}
                    name={job.name}
                    percent={job.values[year] ?? 0}
                  />
                ))}
            </div>
            <div className="pointer-events-none relative -mr-4 mt-4 hidden flex-col items-end gap-4 md:flex">
              <InsightCard context="positive">
                {JOBS_INSIGHTS[year as keyof typeof JOBS_INSIGHTS]?.positive}
              </InsightCard>
              <InsightCard context="negative">
                {JOBS_INSIGHTS[year as keyof typeof JOBS_INSIGHTS]?.negative}
              </InsightCard>
            </div>
          </div>
          <div className="md:hidden">
            <InsightCard context="negative">
              {JOBS_INSIGHTS[year as keyof typeof JOBS_INSIGHTS]?.negative}
            </InsightCard>
          </div>
        </div>
        {year === "2027" && (
          <div className="mt-3 text-xs text-gray-600 dark:text-gray-600-dark md:mb-2 md:text-center md:text-sm print:text-center">
            A select set of occupations of interest were forecasted for 2027,
            based on initial forecasts for 2030 and 2035
          </div>
        )}
      </div>
      <div className="mt-4 grid gap-6 md:grid-cols-2 print:grid-cols-2">
        <ActivityCard
          variant="mint"
          avatar="https://cdn.metaculus.com/labor-hub/bchandar_256.jpg"
          username="Bharat Chandar"
          subtitle="Postdoctoral Researcher, Stanford Digital Economy Lab"
        >
          <p>
            Median overall employment forecast:
            <br />
            (2027: +1%) (2030: -0.5%) (2035: -4%)
          </p>
          <p>
            In the very short run, I expect lags in employment impacts because
            of limitations of the technology and slow AI adoption. For this
            reason my 2027 estimate takes the trend line of employment and
            slightly undershoots it. However, power users may be as important to
            monitor as laggards because they may exert competitive pressure on
            markets that lead to faster adjustment.
          </p>
          <p>
            In the longer run (5-10 years), I am extremely uncertain. I expect
            the technology will be much more advanced and integrated into
            peoples&apos; lives. My primary uncertainty is the policy response
            if AI leads to rapid change. I don&apos;t know how this will resolve
            itself. There may be scenarios where AI does less than it is capable
            of because of new regulation. The BLS may also measure activities as
            work that look more like leisure than what many people do today.
          </p>
        </ActivityCard>
        <ActivityCard
          variant="purple"
          avatar="https://cdn.metaculus.com/labor-hub/draaglom_256.jpg"
          username="Patrick Molgaard (draaglom)"
          subtitle="Pro Forecaster"
          link="https://www.metaculus.com/questions/41307/us-employment-level-change-vs-2025/#comment-772700"
        >
          <p>
            The economic changes we see from AI will be faster than almost
            anything seen before. As a general trend, each technological wave is
            adopted faster than the previous (e.g. mobile phone penetration vs
            landlines) and the nature of AI should accelerate its adoption even
            relative to this trend.
          </p>
          <p>
            Despite this, adoption and job displacement may still be
            surprisingly slow in some important senses. My stereotype of how
            this might look is that new AI-first competitor companies have been
            (or will be) created in many industries and these new entrants will
            take some time - a period of several years - to displace the old
            ones. As an intuition, &quot;Photographic Process Workers and
            Processing Machine Operators&quot; took 5 years between 2010 and
            2015 to decline 50% - and this is a job whose associated technology
            was ~obsoleted.
          </p>
          <p>
            Relatedly, I expect many job roles, even some seen as relatively
            &quot;low education&quot; or &quot;at risk of automation&quot; will
            have a surprisingly large long tail of tasks that take some time for
            AI systems to be good at. I&apos;m also quite skeptical that a
            majority of the job losses attributed to AI so far (e.g. tech
            layoffs) are truly proximately caused by AI.
          </p>
        </ActivityCard>
      </div>
    </QuestionCard>
  );
}

export function InsightCard({
  context,
  ...props
}: { context: "positive" | "negative" } & ComponentProps<"div">) {
  return (
    <div className="pointer-events-auto relative bg-gray-0 dark:bg-gray-0-dark">
      <div
        className={cn(
          "w-full rounded-md border bg-gray-0 px-3 py-2 text-xs/4 font-normal text-gray-900 dark:bg-gray-0-dark dark:text-gray-900-dark md:w-72 md:px-4 md:py-3 md:text-sm/5",
          {
            "border-mc-option-3 bg-mc-option-3/10 dark:border-mc-option-3-dark dark:bg-mc-option-3-dark/10 [&_strong]:text-mc-option-3 dark:[&_strong]:text-mc-option-3-dark":
              context === "positive",
            "border-mc-option-2 bg-mc-option-2/10 dark:border-mc-option-2-dark dark:bg-mc-option-2-dark/10 [&_strong]:text-salmon-600 dark:[&_strong]:text-salmon-600-dark":
              context === "negative",
          }
        )}
        {...props}
      />
    </div>
  );
}
