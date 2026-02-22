"use client";

import { ComponentProps, useState } from "react";

import ButtonGroup from "@/components/ui/button_group";
import cn from "@/utils/core/cn";

import { SectionCard, SectionHeader } from "../components/section";
import { JOBS_DATA } from "../data";

function ContextualBar({ name, percent }: { name: string; percent: number }) {
  const barWidth = `${Math.min(Math.abs(percent), 100)}%`;
  const isPositive = percent >= 0;

  return (
    <div className="group relative flex h-6 w-full">
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
            {Math.abs(percent)}%
          </span>
        </div>
      </div>
    </div>
  );
}

export function JobsMonitorSection({ ...props }: ComponentProps<"section">) {
  const [year, setYear] = useState<"2030" | "2035">("2035");

  return (
    <SectionCard {...props}>
      <div className="mb-4 md:mb-8">
        <SectionHeader className="mb-3 mt-0 md:text-center">
          Jobs Monitor
        </SectionHeader>
        <p className="text-xs text-blue-600 dark:text-blue-600-dark md:mx-auto md:text-center md:text-base md:text-blue-700 md:dark:text-blue-700-dark">
          AI is reshaping the job market, but not all fields are affected
          equally.
        </p>
        <div className="mt-3 flex justify-start md:mt-5 md:justify-center">
          <ButtonGroup
            value={year}
            buttons={[
              { value: "2030", label: "by 2030" },
              { value: "2035", label: "by 2035" },
            ]}
            onChange={setYear}
            variant="tertiary"
            activeVariant="primary"
          />
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-3xl flex-col">
        <div className="mb-3 text-xs text-gray-500 dark:text-gray-500-dark md:mb-2 md:text-center md:text-sm">
          (Percentage change in employment)
        </div>
        <div className="mb-4 hidden grid-cols-5 gap-2 text-sm font-medium md:grid">
          <div className="text-left text-salmon-700 dark:text-salmon-700-dark">
            Fully automated
          </div>
          <div className="text-left text-salmon-700 dark:text-salmon-700-dark">
            50% lower
          </div>
          <div className="text-center text-blue-800 dark:text-blue-800-dark">
            2025 Baseline
          </div>
          <div className="text-right text-olive-700 dark:text-olive-700-dark">
            50% higher
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
          <div className="grid gap-2 md:grid-cols-2 md:gap-0">
            <div className="text-xs font-medium text-mc-option-3 dark:text-mc-option-3-dark md:hidden">
              Expected growth
            </div>
            <div className="flex flex-col gap-1 md:col-start-2">
              {JOBS_DATA.filter((job) => job[year] >= 0)
                .sort((a, b) => b[year] - a[year])
                .map((job) => (
                  <ContextualBar
                    key={job.name}
                    name={job.name}
                    percent={job[year]}
                  />
                ))}
            </div>
          </div>
          <div className="grid gap-2 md:grid-cols-2 md:gap-0">
            <div className="text-xs font-medium text-mc-option-2 dark:text-mc-option-2-dark md:hidden">
              Expected decline
            </div>
            <div className="flex flex-col gap-1">
              {JOBS_DATA.filter((job) => job[year] < 0)
                .sort((a, b) => b[year] - a[year])
                .map((job) => (
                  <ContextualBar
                    key={job.name}
                    name={job.name}
                    percent={job[year]}
                  />
                ))}
            </div>
          </div>
          <div className="pointer-events-none relative -mr-4 -mt-40 hidden flex-col items-end gap-4 md:flex">
            <InsightCard context="positive">
              By {year}, roles in <strong>construction</strong> and{" "}
              <strong>healthcare</strong> are expected to grow due to
              infrastructure buildouts and the health needs of an aging
              population.
            </InsightCard>
            <InsightCard context="negative">
              By {year}, fields like <strong>software</strong>,{" "}
              <strong>law</strong>, and <strong>finance</strong> face deeper
              contractions as AI systems take over large portions of analysis,
              reporting, and coding work.
            </InsightCard>
          </div>
        </div>
      </div>
    </SectionCard>
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
          "w-72 rounded-md border bg-gray-0 px-4 py-3 text-sm/5 font-normal text-gray-900 dark:bg-gray-0-dark dark:text-gray-900-dark",
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
