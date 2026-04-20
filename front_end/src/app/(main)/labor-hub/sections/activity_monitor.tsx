import { ComponentProps } from "react";

import { GroupTimelineMarker } from "@/components/charts/primitives/timeline_markers/types";
import cn from "@/utils/core/cn";

import {
  RAW_ACTIVITY_MONITOR_DATA,
  RawActivityMonitorEntry,
} from "../activity_data";
import {
  ActivityMonitorEntry,
  ActivityMonitorInteractive,
} from "./activity_monitor_interactive";
import { QuestionLoader } from "../components/question_cards/question";
import { SectionHeader } from "../components/section";

const activityDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

function formatActivityDate(date: string) {
  return activityDateFormatter.format(new Date(`${date}T00:00:00Z`));
}

function isoDateToUnixTimestamp(date: string) {
  return Math.floor(new Date(`${date}T12:00:00Z`).getTime() / 1000);
}

function getActivityId(
  activity: Pick<RawActivityMonitorEntry, "date" | "markerLabel">
) {
  return `${activity.date}-${activity.markerLabel}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function ActivityMonitorSection({
  className,
  ...props
}: ComponentProps<"section">) {
  const sortedEntries = [...RAW_ACTIVITY_MONITOR_DATA].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const activities: ActivityMonitorEntry[] = sortedEntries.map(
    ({ markerLabel, ...activity }) => ({
      ...activity,
      id: getActivityId({ date: activity.date, markerLabel }),
    })
  );

  // Pass the full set of candidate markers; the client chart decides how many to show based on print mode.
  const timelineMarkers: GroupTimelineMarker[] = sortedEntries
    .slice(0, 10)
    .map((activity) => ({
      id: getActivityId(activity),
      activityId: getActivityId(activity),
      timestamp: isoDateToUnixTimestamp(activity.date),
      label: activity.markerLabel,
      dateLabel: formatActivityDate(activity.date),
      type: activity.type,
    }));

  return (
    <section className={cn("xl:py-8", className)} {...props}>
      <SectionHeader className="mb-4 mt-0 md:mb-8 md:text-center">
        Activity Monitor
      </SectionHeader>

      <ActivityMonitorInteractive
        activities={activities}
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
            chartHeight={250}
          />
        }
      />
    </section>
  );
}
