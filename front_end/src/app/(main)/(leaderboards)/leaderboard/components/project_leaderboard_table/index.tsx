import { useTranslations } from "next-intl";
import { FC } from "react";

import TableRow from "@/app/(main)/(leaderboards)/leaderboard/components/project_leaderboard_table/table_row";
import { LeaderboardDetails } from "@/types/scoring";

import TableHeader from "./table_header";

type Props = {
  leaderboardDetails: LeaderboardDetails;
  userId?: number;
};

const ProjectLeaderboardTable: FC<Props> = ({ leaderboardDetails, userId }) => {
  const t = useTranslations();

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
          <TableHeader className="text-right">Contributions</TableHeader>
        </tr>
      </thead>
      <tbody>
        {leaderboardDetails.entries.map((entry) => (
          <TableRow key={entry.user_id} rowEntry={entry} userId={userId} />
        ))}
      </tbody>
    </table>
  );
};

export default ProjectLeaderboardTable;
