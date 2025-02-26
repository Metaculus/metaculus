import { addDays, addWeeks, format } from "date-fns";
import { getTranslations } from "next-intl/server";
import { FC } from "react";

import { Tournament } from "@/types/projects";
import cn from "@/utils/cn";
type Props = {
  tournament: Tournament;
  latestScheduledResolutionTimestamp: number;
  isAllQuestionsResolved: boolean;
};

const ClosedTournamentTimeline: FC<Props> = async ({
  tournament,
  latestScheduledResolutionTimestamp,
  isAllQuestionsResolved,
}) => {
  const t = await getTranslations();
  if (
    Date.now() >= latestScheduledResolutionTimestamp &&
    !isAllQuestionsResolved
  ) {
    latestScheduledResolutionTimestamp = addDays(
      latestScheduledResolutionTimestamp,
      1
    ).getTime();
  }
  // TODO: add new field to the tournament
  //   const endDate = tournament.end_date
  //     ? tournament.end_date
  //     : addWeeks(latestScheduledResolutionTimestamp, 2).getTime();
  const endDate = addWeeks(latestScheduledResolutionTimestamp, 2).getTime();
  // TODO: set the timeline progress percentage
  const timelineProgressPercentage = 50;
  return (
    <div className="flex flex-1 flex-col">
      {/* Timeline lables */}
      <div className="flex w-full justify-between">
        <p className="m-0 text-xs text-gray-600 dark:text-gray-600-dark sm:text-base">
          {t("closed")}
        </p>
        <p className="m-0 text-xs text-gray-600 dark:text-gray-600-dark sm:text-base">
          {t("questionsResolved")}
        </p>
        <p className="m-0 text-xs text-gray-600 dark:text-gray-600-dark sm:text-base">
          {t("winnersAnnounced")}
        </p>
      </div>
      {/* Timeline bar  */}
      <div className="relative my-2.5 flex h-1 w-full rounded bg-blue-400 dark:bg-blue-400-dark sm:my-3">
        <div
          className="absolute h-full rounded bg-blue-700 dark:bg-blue-700-dark"
          style={{ width: `${timelineProgressPercentage}%` }}
        ></div>
      </div>
      {/* Timeline dates */}
      <div className="flex w-full justify-between">
        {/* TODO: adjust dates formats */}
        <p className="m-0 text-xs text-blue-800 dark:text-blue-800-dark sm:text-base">
          {format(new Date(tournament.close_date ?? 0), "MMM dd")}
        </p>
        <p className="m-0 text-xs text-blue-800 dark:text-blue-800-dark sm:text-base">
          {format(new Date(latestScheduledResolutionTimestamp), "MMM dd")}
        </p>
        {/* TODO: adjust close date */}
        <p className="m-0 text-xs text-blue-800 dark:text-blue-800-dark sm:text-base">
          {format(new Date(endDate), "MMM dd")}
        </p>
      </div>
    </div>
  );
};

const ClosedTournamentTimelineChip: FC<{ isActive: boolean }> = ({
  isActive,
}) => {
  return (
    <div
      className={cn(
        "size-full h-[18px] w-[18px] rounded-full bg-blue-400 p-[3px] dark:bg-blue-400-dark",
        isActive && "bg-blue-700 dark:bg-blue-700-dark"
      )}
    >
      <div
        className={cn(
          "size-full rounded-full bg-blue-400 dark:bg-blue-400-dark",
          isActive && "bg-olive-400 dark:bg-olive-400-dark"
        )}
      />
    </div>
  );
};
export default ClosedTournamentTimeline;
