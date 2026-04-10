"use client";

import { ReactNode } from "react";

import { ActivityCard } from "../components/activity-card";
import {
  LaborHubChartHoverProvider,
  useLaborHubChartHover,
} from "../components/labor-hub-chart-hover-context";

export type ActivityMonitorEntry = {
  id: string;
  date: string;
  content: ReactNode;
  degradeIndex?: number;
  link?: string;
};

type Props = {
  chart: ReactNode;
  activities: ActivityMonitorEntry[];
};

function ActivityMonitorInteractiveInner({ chart, activities }: Props) {
  const hoverState = useLaborHubChartHover();

  return (
    <div
      className="grid gap-5 sm:gap-6 md:grid-cols-2 md:gap-8"
      onMouseLeave={() => {
        hoverState?.setHoverYear(null);
        hoverState?.setHighlightedEnvelope(null);
        hoverState?.setHoveredActivityId(null);
      }}
    >
      {chart}
      <div className="flex flex-col gap-2.5 md:order-1">
        {activities.map((activity) => (
          <ActivityCard
            key={activity.id}
            date={activity.date}
            degradeIndex={activity.degradeIndex ?? 0}
            link={activity.link}
            highlighted={hoverState?.hoveredActivityId === activity.id}
            onMouseEnter={() => hoverState?.setHoveredActivityId(activity.id)}
            onMouseLeave={() => hoverState?.setHoveredActivityId(null)}
          >
            {activity.content}
          </ActivityCard>
        ))}
        <button className="w-full rounded-md border border-blue-400 bg-blue-100 py-3 text-center text-lg font-medium leading-7 text-blue-800 hover:bg-blue-200 dark:border-blue-400-dark dark:bg-blue-100-dark dark:text-blue-800-dark dark:hover:bg-blue-200-dark print:hidden">
          See all activity
        </button>
      </div>
    </div>
  );
}

export function ActivityMonitorInteractive(props: Props) {
  return (
    <LaborHubChartHoverProvider>
      <ActivityMonitorInteractiveInner {...props} />
    </LaborHubChartHoverProvider>
  );
}
