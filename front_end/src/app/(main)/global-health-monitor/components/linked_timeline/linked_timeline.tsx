"use client";

import { faThumbtack } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { MouseEvent, ReactNode, useMemo } from "react";

import cn from "@/utils/core/cn";

import { DISEASE_NAME_KEYS, DiseaseId } from "../../config/diseases";
import { GhmValueKey } from "../../config/questions";
import { ChangeChip } from "../change_chip";
import { useGhmSnapshot } from "../ghm_data_provider";
import {
  LinkedTimelineProvider,
  useLinkedTimeline,
} from "./linked_timeline_context";

export type TakeawayView = {
  id: string;
  diseases: DiseaseId[];
  lead: GhmValueKey;
  content: ReactNode;
};

function TakeawayCard({ takeaway }: { takeaway: TakeawayView }) {
  const t = useTranslations();
  const snapshot = useGhmSnapshot();
  const linkedTimeline = useLinkedTimeline();
  const lead = snapshot?.values[takeaway.lead];
  const isActive = linkedTimeline?.activeKey === takeaway.lead;
  const isPinned = linkedTimeline?.pinnedKey === takeaway.lead;

  const togglePin = () =>
    linkedTimeline?.setPinnedKey(isPinned ? null : takeaway.lead);

  return (
    <div
      onMouseEnter={() => linkedTimeline?.setHoveredKey(takeaway.lead)}
      onMouseLeave={() => linkedTimeline?.setHoveredKey(null)}
      onClick={(event: MouseEvent<HTMLDivElement>) => {
        if (!(event.target as HTMLElement).closest("a, button")) {
          togglePin();
        }
      }}
      className={cn(
        "relative break-inside-avoid rounded-lg border bg-blue-100 px-4 py-2 transition-[border-color,box-shadow] dark:bg-blue-100-dark",
        isActive
          ? "border-blue-600 ring-2 ring-blue-600 dark:border-blue-600-dark dark:ring-blue-600-dark"
          : "border-blue-300 hover:border-blue-500 dark:border-blue-300-dark dark:hover:border-blue-500-dark",
        "print:ring-0"
      )}
    >
      <div className="mb-1 flex flex-wrap items-center gap-2 pr-8">
        {takeaway.diseases.map((disease) => (
          <span
            key={disease}
            className="text-xs font-bold uppercase tracking-wide text-blue-700 dark:text-blue-700-dark"
          >
            {t(DISEASE_NAME_KEYS[disease])}
          </span>
        ))}
        {lead?.change && snapshot?.compareEdition && (
          <ChangeChip
            change={lead.change}
            sinceLabel={snapshot.compareEdition.label}
          />
        )}
      </div>
      <button
        type="button"
        onClick={togglePin}
        aria-pressed={isPinned}
        aria-label={t("globalHealthMonitorShowOnChart")}
        title={t("globalHealthMonitorShowOnChart")}
        className={cn(
          "absolute right-2 top-2 flex size-7 items-center justify-center rounded-full text-xs transition-colors print:hidden",
          isPinned
            ? "bg-blue-700 text-gray-0 dark:bg-blue-700-dark dark:text-gray-0-dark"
            : "text-blue-600 hover:bg-blue-200 dark:text-blue-600-dark dark:hover:bg-blue-200-dark"
        )}
      >
        <FontAwesomeIcon icon={faThumbtack} />
      </button>
      <div className="text-sm leading-normal text-blue-900 [text-wrap:pretty] dark:text-blue-900-dark">
        {takeaway.content}
      </div>
    </div>
  );
}

function ActiveChart({
  charts,
}: {
  charts: Partial<Record<GhmValueKey, ReactNode>>;
}) {
  const linkedTimeline = useLinkedTimeline();
  const activeKey = linkedTimeline?.activeKey;
  return <>{activeKey ? charts[activeKey] : null}</>;
}

export function LinkedTimeline({
  takeaways,
  charts,
}: {
  takeaways: TakeawayView[];
  charts: Partial<Record<GhmValueKey, ReactNode>>;
}) {
  const t = useTranslations();
  const firstLead = takeaways[0]?.lead;
  const chartKeys = useMemo(
    () => Object.keys(charts) as GhmValueKey[],
    [charts]
  );

  if (!firstLead) {
    return null;
  }

  return (
    <LinkedTimelineProvider defaultKey={firstLead} chartKeys={chartKeys}>
      <div className="grid gap-5 md:grid-cols-2 md:gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] print:grid-cols-2">
        <div className="flex flex-col gap-2">
          {takeaways.map((takeaway) => (
            <TakeawayCard key={takeaway.id} takeaway={takeaway} />
          ))}
        </div>
        <div>
          <div className="md:sticky md:top-40 print:static">
            <ActiveChart charts={charts} />
            <p className="mb-0 mt-2 text-xs text-blue-600 dark:text-blue-600-dark print:hidden">
              {t("globalHealthMonitorTakeawaysChartHint")}
            </p>
          </div>
        </div>
      </div>
    </LinkedTimelineProvider>
  );
}
