import { addDays, addWeeks, format, getYear } from "date-fns";
import { getTranslations } from "next-intl/server";
import { FC } from "react";

import WithServerComponentErrorBoundary from "@/components/server_component_error_boundary";
import { Tournament } from "@/types/projects";
import cn from "@/utils/core/cn";

type Props = {
  tournament: Tournament;
  latestScheduledResolutionTimestamp: number;
  latestActualResolutionTimestamp: number;
  latestActualCloseTimestamp: number;
  isAllQuestionsResolved: boolean;
};

const ClosedTournamentTimeline: FC<Props> = async ({
  tournament,
  latestScheduledResolutionTimestamp,
  latestActualResolutionTimestamp,
  latestActualCloseTimestamp,
  isAllQuestionsResolved,
}) => {
  const t = await getTranslations();
  const dateNowTimestamp = Date.now();
  if (
    dateNowTimestamp >= latestScheduledResolutionTimestamp &&
    !isAllQuestionsResolved
  ) {
    latestScheduledResolutionTimestamp = addDays(dateNowTimestamp, 1).getTime();
  }

  const endDateTimestamp = tournament.close_date
    ? new Date(tournament.close_date).getTime()
    : addWeeks(
        isAllQuestionsResolved
          ? latestActualResolutionTimestamp
          : latestScheduledResolutionTimestamp,
        2
      ).getTime();

  const currentYear = getYear(new Date());
  const closeYear = getYear(new Date(latestActualCloseTimestamp));
  const resolveYear = getYear(
    new Date(
      isAllQuestionsResolved && latestActualResolutionTimestamp
        ? latestActualResolutionTimestamp
        : latestScheduledResolutionTimestamp
    )
  );
  const endYear = getYear(new Date(endDateTimestamp));
  const formatString =
    closeYear === currentYear &&
    resolveYear === currentYear &&
    endYear === currentYear
      ? "MMM dd"
      : "MMM dd yyyy";

  let timelineProgressPercentage = 0;
  if (latestScheduledResolutionTimestamp <= dateNowTimestamp) {
    timelineProgressPercentage = 50;
  }
  if (endDateTimestamp <= dateNowTimestamp) {
    timelineProgressPercentage = 100;
  }
  return (
    <div className="flex flex-1 flex-col">
      {/* Timeline lables */}
      <div className="relative flex w-full justify-between">
        <p className="m-0 max-w-20 self-end text-xs text-gray-600 dark:text-gray-600-dark md:max-w-none md:text-nowrap md:text-base">
          {t("closed")}
        </p>
        <p className="absolute left-1/2 m-0 max-w-20 -translate-x-1/2 self-end text-center text-xs text-gray-600 dark:text-gray-600-dark md:max-w-none md:text-nowrap md:text-base">
          {t("questionsResolved")}
        </p>
        <p className="m-0 max-w-20 self-end text-end text-xs text-gray-600 dark:text-gray-600-dark md:max-w-none md:text-nowrap md:text-base">
          {t("winnersAnnounced")}
        </p>
      </div>
      {/* Timeline bar  */}
      <div className="relative my-2.5 flex h-1 w-full items-center justify-between rounded bg-blue-400 dark:bg-blue-400-dark sm:my-3">
        <div
          className="absolute h-full rounded bg-blue-700 dark:bg-blue-700-dark"
          style={{ width: `${timelineProgressPercentage}%` }}
        ></div>
        <ClosedTournamentTimelineChip isActive />
        <ClosedTournamentTimelineChip
          isActive={timelineProgressPercentage >= 50}
        />
        <ClosedTournamentTimelineChip
          isActive={timelineProgressPercentage >= 100}
        />
      </div>
      {/* Timeline dates */}
      <div className="flex w-full justify-between">
        <p className="m-0 text-xs text-blue-800 dark:text-blue-800-dark md:text-base">
          {format(new Date(latestActualCloseTimestamp), formatString)}
        </p>
        <p className="m-0 text-xs text-blue-800 dark:text-blue-800-dark md:text-base">
          {format(
            new Date(
              isAllQuestionsResolved && latestActualResolutionTimestamp
                ? latestActualResolutionTimestamp
                : latestScheduledResolutionTimestamp
            ),
            formatString
          )}
        </p>
        <p className="m-0 text-xs text-blue-800 dark:text-blue-800-dark md:text-base">
          {format(new Date(endDateTimestamp), formatString)}
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
        "z-10 size-full h-[18px] w-[18px] rounded-full bg-blue-400 p-[3px] dark:bg-blue-400-dark",
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

export default WithServerComponentErrorBoundary(ClosedTournamentTimeline);
