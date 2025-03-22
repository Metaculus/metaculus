"use client";
import { isNil } from "lodash";
import { useTranslations } from "next-intl";
import { FC, useMemo, useState } from "react";

import Button from "@/components/ui/button";
import { LeaderboardDetails } from "@/types/scoring";

import TableHeader from "./table_header";
import TableRow from "./table_row";

type Props = {
  leaderboardDetails: LeaderboardDetails;
  userId?: number;
  paginationStep?: number;
};

const ProjectLeaderboardTable: FC<Props> = ({
  leaderboardDetails,
  userId,
  paginationStep = 5,
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

  const withCoverage =
    leaderboardDetails.score_type === "relative_legacy_tournament";

  return (
    // TODO: add a prize pool display directly to top of table when it exists
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
            {!!leaderboardDetails.prize_pool && (
              <>
                {withCoverage && (
                  <TableHeader className="text-right">
                    {t("coverage")}
                  </TableHeader>
                )}
                <TableHeader className="text-right">{t("take")}</TableHeader>
                <TableHeader className="text-right">
                  {t("percentPrize")}
                </TableHeader>
                <TableHeader className=" text-right">{t("prize")}</TableHeader>
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
              withCoverage={withCoverage}
              withPrizePool={!!leaderboardDetails.prize_pool}
            />
          )}
          {leaderboardEntries.map((entry) => (
            <TableRow
              key={entry.user?.id ?? entry.aggregation_method}
              rowEntry={entry}
              userId={userId}
              withCoverage={withCoverage}
              withPrizePool={!!leaderboardDetails.prize_pool}
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
