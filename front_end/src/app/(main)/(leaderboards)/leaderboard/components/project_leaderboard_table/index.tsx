import { isNil } from "lodash";
import { useTranslations } from "next-intl";
import { FC } from "react";

import TableRow from "@/app/(main)/(leaderboards)/leaderboard/components/project_leaderboard_table/table_row";
import { LeaderboardDetails } from "@/types/scoring";

import TableHeader from "./table_header";

type Props = {
  leaderboardDetails: LeaderboardDetails;
  prizePool: number;
  userId?: number;
};

const ProjectLeaderboardTable: FC<Props> = ({
  leaderboardDetails,
  prizePool,
  userId,
}) => {
  const t = useTranslations();

  const withTake = leaderboardDetails.entries.some(
    (entry) => !isNil(entry.take)
  );
  const withPrize = leaderboardDetails.entries.some(
    (entry) => !isNil(entry.percent_prize)
  );

  return (
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
        {leaderboardDetails.entries.map((entry) => (
          <TableRow
            key={entry.user.id}
            rowEntry={entry}
            userId={userId}
            withTake={withTake}
            withPrize={withPrize}
            prizePool={prizePool}
          />
        ))}
      </tbody>
    </table>
  );
};

export default ProjectLeaderboardTable;
