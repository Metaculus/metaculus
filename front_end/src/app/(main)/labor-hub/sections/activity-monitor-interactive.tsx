"use client";

import { ReactNode, useEffect, useRef, useState } from "react";

import BaseModal from "@/components/base_modal";

import { ActivityCard } from "../components/activity-card";
import {
  LaborHubChartHoverProvider,
  useLaborHubChartHover,
} from "../components/labor-hub-chart-hover-context";

export type ActivityMonitorEntry = {
  id: string;
  date: string;
  content: ReactNode;
  link?: string;
};

type Props = {
  chart: ReactNode;
  activities: ActivityMonitorEntry[];
};

const activityDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

function formatActivityDate(date: string) {
  return activityDateFormatter.format(new Date(`${date}T00:00:00Z`));
}

function ActivityCardsList({
  activities,
  interactive = true,
}: {
  activities: ActivityMonitorEntry[];
  interactive?: boolean;
}) {
  const hoverState = useLaborHubChartHover();

  return (
    <>
      {activities.map((activity, index) => (
        <ActivityCard
          key={activity.id}
          date={formatActivityDate(activity.date)}
          degradeIndex={index}
          link={activity.link}
          highlighted={
            interactive && hoverState?.hoveredActivityId === activity.id
          }
          onMouseEnter={
            interactive
              ? () => hoverState?.setHoveredActivityId(activity.id)
              : undefined
          }
          onMouseLeave={
            interactive
              ? () => hoverState?.setHoveredActivityId(null)
              : undefined
          }
        >
          {activity.content}
        </ActivityCard>
      ))}
    </>
  );
}

function ActivityMonitorInteractiveInner({ chart, activities }: Props) {
  const hoverState = useLaborHubChartHover();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalScrollState, setModalScrollState] = useState({
    canScrollUp: false,
    canScrollDown: false,
  });
  const modalScrollRef = useRef<HTMLDivElement>(null);
  const previewActivities = activities.slice(0, 4);

  const updateModalScrollState = () => {
    const scrollElement = modalScrollRef.current;
    if (!scrollElement) {
      return;
    }

    const { scrollTop, clientHeight, scrollHeight } = scrollElement;
    const scrollThreshold = 4;

    setModalScrollState({
      canScrollUp: scrollTop > scrollThreshold,
      canScrollDown: scrollTop + clientHeight < scrollHeight - scrollThreshold,
    });
  };

  useEffect(() => {
    if (!isModalOpen) {
      return;
    }

    const scrollElement = modalScrollRef.current;
    if (!scrollElement) {
      return;
    }
    const animationFrameId = window.requestAnimationFrame(
      updateModalScrollState
    );
    const timeoutId = window.setTimeout(updateModalScrollState, 150);

    scrollElement.addEventListener("scroll", updateModalScrollState, {
      passive: true,
    });
    window.addEventListener("resize", updateModalScrollState);

    const resizeObserver = new ResizeObserver(updateModalScrollState);
    resizeObserver.observe(scrollElement);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      window.clearTimeout(timeoutId);
      scrollElement.removeEventListener("scroll", updateModalScrollState);
      window.removeEventListener("resize", updateModalScrollState);
      resizeObserver.disconnect();
    };
  }, [activities.length, isModalOpen]);

  return (
    <>
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
          <ActivityCardsList activities={previewActivities} />
          <button
            type="button"
            onClick={() => {
              setModalScrollState({
                canScrollUp: false,
                canScrollDown: true,
              });
              setIsModalOpen(true);
            }}
            className="w-full rounded-md border border-blue-400 bg-blue-100 py-3 text-center text-lg font-medium leading-7 text-blue-800 hover:bg-blue-200 dark:border-blue-400-dark dark:bg-blue-100-dark dark:text-blue-800-dark dark:hover:bg-blue-200-dark print:hidden"
          >
            See all activity
          </button>
        </div>
      </div>
      <BaseModal
        isOpen={isModalOpen}
        onClose={() => {
          setModalScrollState({
            canScrollUp: false,
            canScrollDown: false,
          });
          setIsModalOpen(false);
          hoverState?.setHoveredActivityId(null);
        }}
        label="Activity Monitor"
        isImmersive
        withCloseButton
        className="flex w-full max-w-3xl flex-col overflow-hidden"
      >
        <div className="flex min-h-0 flex-1 flex-col gap-4">
          <div className="relative min-h-0 flex-1">
            <div
              ref={modalScrollRef}
              onScroll={updateModalScrollState}
              className="flex h-full min-h-0 flex-col gap-2.5 overflow-y-auto pr-1 md:max-h-[min(70vh,42rem)]"
            >
              <ActivityCardsList activities={activities} interactive={false} />
            </div>
            <div
              aria-hidden="true"
              className={`pointer-events-none absolute inset-x-0 top-0 z-10 h-14 bg-gradient-to-b from-gray-0 to-transparent transition-opacity dark:from-gray-0-dark ${
                modalScrollState.canScrollUp ? "opacity-100" : "opacity-0"
              }`}
            />
            <div
              aria-hidden="true"
              className={`pointer-events-none absolute inset-x-0 bottom-0 z-10 h-14 bg-gradient-to-t from-gray-0 to-transparent transition-opacity dark:from-gray-0-dark ${
                modalScrollState.canScrollDown ? "opacity-100" : "opacity-0"
              }`}
            />
          </div>
        </div>
      </BaseModal>
    </>
  );
}

export function ActivityMonitorInteractive(props: Props) {
  return (
    <LaborHubChartHoverProvider>
      <ActivityMonitorInteractiveInner {...props} />
    </LaborHubChartHoverProvider>
  );
}
