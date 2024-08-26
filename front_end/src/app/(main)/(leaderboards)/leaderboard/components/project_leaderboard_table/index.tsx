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
  prizePool: number;
  userId?: number;
  paginationStep?: number;
};

const ProjectLeaderboardTable: FC<Props> = ({
  leaderboardDetails,
  prizePool,
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
  const withTake = leaderboardDetails.entries.some(
    (entry) => !isNil(entry.take)
  );
  const withPrize = leaderboardDetails.entries.some(
    (entry) => !isNil(entry.percent_prize)
  );

  return (
    <>
      <table className="mb-0 w-full border-separate whitespace-nowrap">
        <thead>
          <tr className="h-8">
            <TableHeader className="sticky left-0 text-left">
              {t("rank")}
            </TableHeader>
            <TableHeader className="sticky left-0 text-left">
              {t("forecaster")}
            </TableHeader>
            <TableHeader className="text-right">{t("totalScore")}</TableHeader>
            {withCoverage && (
              <TableHeader className="text-right">{t("coverage")}</TableHeader>
            )}
            {withTake && (
              <TableHeader className="text-right">{t("take")}</TableHeader>
            )}
            {withPrize && (
              <>
                <TableHeader className="text-right">
                  {t("percentPrize")}
                </TableHeader>
                <TableHeader className=" text-right">{t("prize")}</TableHeader>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {leaderboardEntries.map((entry) => (
            <TableRow
              key={entry.user?.id ?? entry.aggregation_method}
              rowEntry={entry}
              userId={userId}
              withCoverage={withCoverage}
              withTake={withTake}
              withPrize={withPrize}
              prizePool={prizePool}
            />
          ))}
        </tbody>
      </table>
      {hasMore && (
        <Button
          className="mx-auto my-1 !flex"
          variant="tertiary"
          onClick={handleLoadMoreClick}
        >
          Load More
        </Button>
      )}
    </>
  );
};

export default ProjectLeaderboardTable;
