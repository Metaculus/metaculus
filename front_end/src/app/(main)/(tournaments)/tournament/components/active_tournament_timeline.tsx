import { differenceInMilliseconds, format, getYear } from "date-fns";
import { getLocale, getTranslations } from "next-intl/server";
import { FC } from "react";

import WithServerComponentErrorBoundary from "@/components/server_component_error_boundary";
import { Tournament } from "@/types/projects";
import cn from "@/utils/core/cn";
import { formatRelativeDate } from "@/utils/formatters/date";

type Props = {
  tournament: Tournament;
  latestScheduledCloseTimestamp: number;
  lastParticipationDayTimestamp: number | null;
};

const ActiveTournamentTimeline: FC<Props> = async ({
  tournament,
  latestScheduledCloseTimestamp,
  lastParticipationDayTimestamp,
}) => {
  const locale = await getLocale();
  const t = await getTranslations();
  const totalTime = differenceInMilliseconds(
    new Date(latestScheduledCloseTimestamp),
    new Date(tournament.start_date)
  );
  const timeSincePublish = differenceInMilliseconds(
    new Date(),
    new Date(tournament.start_date)
  );
  const progressPercentage = Math.max(
    3,
    Math.min(100, (timeSincePublish / totalTime) * 100)
  );
  const isUpcoming = new Date(tournament.start_date).getTime() > Date.now();
  const lastParticipationPosition = calculateLastParticipationPosition(
    lastParticipationDayTimestamp,
    tournament.start_date,
    totalTime
  );
  const formatString =
    getYear(new Date(latestScheduledCloseTimestamp)) ===
    getYear(new Date(tournament.start_date))
      ? "MMM dd"
      : "MMM dd yyyy";
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex w-full justify-between">
        <p className="m-0 text-xs text-gray-600 dark:text-gray-600-dark sm:text-base">
          {isUpcoming ? t("starts") : t("started")}
          {isUpcoming && (
            <>
              {" "}
              {formatRelativeDate(locale, new Date(tournament.start_date), {
                short: true,
              })}
            </>
          )}
        </p>
        <p className="m-0 text-xs text-gray-600 dark:text-gray-600-dark sm:text-base">
          {t("closes")}
        </p>
      </div>
      <div className="relative my-2.5 flex h-1 w-full rounded bg-blue-400 dark:bg-blue-400-dark sm:my-3">
        {!isUpcoming && (
          <div
            className="relative h-full rounded bg-blue-700 dark:bg-blue-700-dark"
            style={{ width: `${progressPercentage}%` }}
          >
            <TimelineArrow progressPercentage={progressPercentage} />
          </div>
        )}
        {lastParticipationDayTimestamp && lastParticipationPosition && (
          <LastDayParticipationChip
            lastParticipationDayTimestamp={lastParticipationDayTimestamp}
            position={lastParticipationPosition}
            isAbsolutePosition
          />
        )}
      </div>
      <div className="flex w-full justify-between">
        <p className="m-0 text-xs text-blue-800 dark:text-blue-800-dark sm:text-base">
          {format(new Date(tournament.start_date), formatString)}
        </p>
        <p className="m-0 text-xs text-blue-800 dark:text-blue-800-dark sm:text-base">
          {format(new Date(latestScheduledCloseTimestamp), formatString)}
        </p>
      </div>
      {lastParticipationDayTimestamp && (
        <div className="mt-4 flex w-full items-center justify-center">
          <LastDayParticipationChip
            lastParticipationDayTimestamp={lastParticipationDayTimestamp}
            position={0}
          />
          <p className="m-0 ml-1.5 text-xs text-gray-600 dark:text-gray-600-dark sm:text-base">
            <b className="text-gray-800 dark:text-gray-800-dark">
              {format(new Date(lastParticipationDayTimestamp), formatString)}:
            </b>{" "}
            {t("lastDayForPrizeParticipation")}
          </p>
        </div>
      )}
    </div>
  );
};

const LastDayParticipationChip: FC<{
  lastParticipationDayTimestamp: number;
  position: number;
  isAbsolutePosition?: boolean;
}> = ({ lastParticipationDayTimestamp, position, isAbsolutePosition }) => {
  const isAlreadyPassed =
    new Date(lastParticipationDayTimestamp).getTime() <= Date.now();
  return (
    <div
      className={cn(
        "h-[18px] w-[18px] rounded-full bg-gray-0 p-[2px] dark:bg-gray-0-dark",
        isAbsolutePosition &&
          "absolute top-[50%] -translate-x-1/2 -translate-y-1/2"
      )}
      style={{
        left: `${position}%`,
      }}
    >
      <div
        className={cn(
          "size-full rounded-full bg-orange-500 p-[3px] dark:bg-orange-500-dark",
          isAlreadyPassed && "bg-orange-700 dark:bg-orange-700-dark"
        )}
      >
        <div
          className={cn(
            "size-full rounded-full bg-gray-0 dark:bg-gray-0-dark",
            isAlreadyPassed && "bg-orange-300 dark:bg-orange-300-dark"
          )}
        />
      </div>
    </div>
  );
};

const TimelineArrow: FC<{
  progressPercentage: number;
}> = ({ progressPercentage }) => (
  <div
    className={cn(
      "absolute left-full top-[50%] -translate-x-1/2 -translate-y-1/2",
      progressPercentage < 3 && "hidden"
    )}
  >
    <div
      className={cn(
        "h-3 w-[4px] origin-bottom-right -rotate-45 rounded-full bg-blue-700 dark:bg-blue-700-dark"
      )}
    />
    <div
      className={cn(
        "h-3 w-[4px] origin-top-right rotate-45 rounded-full bg-blue-700 dark:bg-blue-700-dark"
      )}
    />
  </div>
);

function calculateLastParticipationPosition(
  lastParticipationDayTimestamp: number | null,
  startDate: string,
  totalTime: number
) {
  if (
    !lastParticipationDayTimestamp ||
    new Date(startDate).getTime() >
      new Date(lastParticipationDayTimestamp).getTime()
  ) {
    return null;
  }
  const position =
    (differenceInMilliseconds(
      new Date(lastParticipationDayTimestamp),
      new Date(startDate)
    ) /
      totalTime) *
    100;
  return Math.min(100, Math.max(0, position));
}

export default WithServerComponentErrorBoundary(ActiveTournamentTimeline);
