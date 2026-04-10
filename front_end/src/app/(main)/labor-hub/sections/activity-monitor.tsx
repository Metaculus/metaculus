import { ComponentProps } from "react";

import { GroupTimelineMarker } from "@/components/charts/primitives/timeline_markers/types";
import cn from "@/utils/core/cn";

import {
  ActivityMonitorEntry,
  ActivityMonitorInteractive,
} from "./activity-monitor-interactive";
import { QuestionLoader } from "../components/question-cards/question";
import { SectionHeader } from "../components/section";

function toUnixTimestamp(year: number, monthIndex: number, day: number) {
  return Math.floor(Date.UTC(year, monthIndex, day, 12) / 1000);
}

export function ActivityMonitorSection({
  className,
  ...props
}: ComponentProps<"section">) {
  const activityData: Array<
    ActivityMonitorEntry & {
      markerLabel: string;
      timestamp: number;
    }
  > = [
    {
      id: "gpt-5-release",
      date: "Apr 6, 2026",
      markerLabel: "GPT-5 released",
      timestamp: toUnixTimestamp(2026, 3, 6),
      degradeIndex: 0,
      content: (
        <>
          <strong>📊 Update:</strong> 2030 employment projection declined 1.3
          percentage points in the week following the{" "}
          <strong>release of GPT-5</strong>.
        </>
      ),
    },
    {
      id: "creative-roles-insight",
      date: "Apr 2, 2026",
      markerLabel: "Creative roles insight",
      timestamp: toUnixTimestamp(2026, 3, 2),
      degradeIndex: 1,
      content: (
        <>
          <strong>🧠 Forecaster insight:</strong>{" "}
          <em>
            &quot;I expect creative and interpersonal roles to remain most
            resistant to automation, though not immune.&quot;
          </em>
        </>
      ),
    },
    {
      id: "amazon-workforce-cuts",
      date: "Mar 18, 2026",
      markerLabel: "Amazon workforce cuts",
      timestamp: toUnixTimestamp(2026, 2, 18),
      degradeIndex: 2,
      content: (
        <>
          <strong>📰 News:</strong> Amazon cuts global corporate workforce by
          14,000, downsizing linked to AI.&quot; -{" "}
          <a href="#" className="underline hover:no-underline">
            Reuters
          </a>
        </>
      ),
    },
    {
      id: "developer-projection-falls",
      date: "Mar 5, 2026",
      markerLabel: "Developer projection falls",
      timestamp: toUnixTimestamp(2026, 2, 5),
      degradeIndex: 3,
      content: (
        <>
          <strong>📊 Update:</strong> Software developer 2035 employment
          projection falls 7 percentage points as forecasters assess recent
          coding demonstrations and benchmark progress.
        </>
      ),
    },
  ];
  const timelineMarkers: GroupTimelineMarker[] = activityData.map(
    (activity) => ({
      id: activity.id,
      activityId: activity.id,
      timestamp: activity.timestamp,
      label: activity.markerLabel,
      dateLabel: activity.date,
    })
  );

  return (
    <section className={cn("xl:py-8", className)} {...props}>
      <SectionHeader className="mb-4 mt-0 md:mb-8 md:text-center">
        Activity Monitor
      </SectionHeader>

      <ActivityMonitorInteractive
        activities={activityData}
        chart={
          <QuestionLoader
            questionId={41307}
            title="How predictions change over time as AI progresses?"
            subtitle="What will be the percent change in US employment in the following years compared to 2025?"
            className="md:order-2"
            variant="primary"
            preferTimeline
            isFlippable={false}
            timelineMarkers={timelineMarkers}
          />
        }
      />
    </section>
  );
}
