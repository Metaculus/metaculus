"use client";
import { isNil } from "lodash";
import { useTranslations } from "next-intl";
import { FC, useCallback, useMemo, useState } from "react";

import Button from "@/components/ui/button";
import { LeaderboardDetails, LeaderboardDisplayConfig } from "@/types/scoring";

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

  const columnRenames = leaderboardDetails.display_config?.column_renames;

  const getColumnName = useCallback(
    (
      translationKey: Parameters<typeof t>[0],
      columnRenames?: LeaderboardDisplayConfig["column_renames"]
    ): string => {
      const defaultName = t(translationKey);
      if (!columnRenames) {
        return defaultName;
      }
      return columnRenames[defaultName] ?? defaultName;
    },
    [t]
  );

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
              {getColumnName("rank", columnRenames)}
            </TableHeader>
            <TableHeader className="sticky left-0 w-0 max-w-[16rem] text-left">
              {getColumnName("forecaster", columnRenames)}
            </TableHeader>
            <TableHeader className="text-right">
              {getColumnName("totalScore", columnRenames)}
            </TableHeader>
            {isAdvanced && (
              <>
                <TableHeader className=" text-right">
                  {getColumnName("questions", columnRenames)}
                </TableHeader>
                <TableHeader className="text-right">
                  {getColumnName("coverage", columnRenames)}
                </TableHeader>
              </>
            )}
            {!!leaderboardDetails.prize_pool && (
              <>
                {isAdvanced && (
                  <>
                    <TableHeader className="text-right">
                      {getColumnName("take", columnRenames)}
                    </TableHeader>
                    <TableHeader className="text-right">
                      {getColumnName("percentPrize", columnRenames)}
                    </TableHeader>
                  </>
                )}
                <TableHeader className=" text-right">
                  {leaderboardDetails.finalized ? (
                    getColumnName("prize", columnRenames)
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
          {leaderboardEntries.map((entry) => {
            // show non-excluded entries
            // or if they should show even when excluded
            // or if we are in the advanced view
            if (!entry.excluded || entry.show_when_excluded || isAdvanced) {
              return (
                <TableRow
                  key={entry.user?.id ?? entry.aggregation_method}
                  rowEntry={entry}
                  userId={userId}
                  maxCoverage={maxCoverage}
                  withPrizePool={!!leaderboardDetails.prize_pool}
                  isAdvanced={isAdvanced}
                />
              );
            }
            return null;
          })}
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
