"use client";
import { isNil } from "lodash";
import { useTranslations } from "next-intl";
import { FC, useMemo, useState } from "react";

import Button from "@/components/ui/button";
import { LeaderboardDetails } from "@/types/scoring";

import TableHeader from "./table_header";
import TableRow from "./table_row";
import UnfinalizedPrizeTooltip from "../prize_unfinalized_tooltip";

type Props = {
  leaderboardDetails: LeaderboardDetails;
  userId?: number;
  paginationStep?: number;
  isAdvanced?: boolean;
};

const ProjectLeaderboardTable: FC<Props> = ({
  leaderboardDetails,
  userId,
  paginationStep = 5,
  isAdvanced,
}) => {
  const t = useTranslations();

  const [step, setStep] = useState(paginationStep);
  const leaderboardEntries = useMemo(() => {
    return isNil(step)
      ? leaderboardDetails.entries
      : leaderboardDetails.entries.slice(0, step);
  }, [leaderboardDetails.entries, step]);

  const hasMore = !isNil(step)
    ? leaderboardDetails.entries.length > step
    : false;
  const handleLoadMoreClick = () => {
    setStep((prev) => (isNil(prev) ? prev : prev * 10));
  };

  const maxCoverage =
    leaderboardDetails.score_type === "relative_legacy_tournament"
      ? undefined
      : leaderboardDetails.max_coverage;

  return (
    <div className="overflow-y-hidden rounded border border-gray-300 bg-gray-0 dark:border-gray-300-dark dark:bg-gray-0-dark">
      <table className="mb-0 w-full border-separate whitespace-nowrap">
        <thead>
          <tr>
            <TableHeader className="sticky left-0 text-left">
              {t("rank")}
            </TableHeader>
            <TableHeader className="sticky left-0 text-left">
              {t("forecaster")}
            </TableHeader>
            <TableHeader className="text-right">{t("totalScore")}</TableHeader>
            {isAdvanced && (
              <>
                <TableHeader className=" text-right">
                  {t("questions")}
                </TableHeader>
                <TableHeader className="text-right">
                  {t("coverage")}
                </TableHeader>
              </>
            )}
            {!!leaderboardDetails.prize_pool && (
              <>
                {isAdvanced && (
                  <>
                    <TableHeader className="text-right">
                      {t("take")}
                    </TableHeader>
                    <TableHeader className="text-right">
                      {t("percentPrize")}
                    </TableHeader>
                  </>
                )}
                <TableHeader className=" text-right">
                  {leaderboardDetails.finalized ? (
                    t("prize")
                  ) : (
                    <UnfinalizedPrizeTooltip />
                  )}
                </TableHeader>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {leaderboardDetails.userEntry && (
            <TableRow
              key={
                leaderboardDetails.userEntry.user?.id ??
                leaderboardDetails.userEntry.aggregation_method
              }
              rowEntry={leaderboardDetails.userEntry}
              userId={userId}
              maxCoverage={maxCoverage}
              withPrizePool={!!leaderboardDetails.prize_pool}
              isAdvanced={isAdvanced}
            />
          )}
          {leaderboardEntries.map((entry) => (
            <TableRow
              key={entry.user?.id ?? entry.aggregation_method}
              rowEntry={entry}
              userId={userId}
              maxCoverage={maxCoverage}
              withPrizePool={!!leaderboardDetails.prize_pool}
              isAdvanced={isAdvanced}
            />
          ))}
        </tbody>
      </table>
      {hasMore && (
        <div className="w-full py-2.5">
          <Button
            className="mx-auto !flex"
            variant="tertiary"
            onClick={handleLoadMoreClick}
          >
            {t("loadMoreButton")}
          </Button>
        </div>
      )}
    </div>
  );
};

export default ProjectLeaderboardTable;
