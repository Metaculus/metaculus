import { getTranslations } from "next-intl/server";
import { FC } from "react";

import WithServerComponentErrorBoundary from "@/components/server_component_error_boundary";
import SectionToggle from "@/components/ui/section_toggle";
import ServerLeaderboardApi from "@/services/api/leaderboard/leaderboard.server";
import { LeaderboardType } from "@/types/scoring";

import ProjectLeaderboardTable from "./project_leaderboard_table";

type Props = {
  projectId: number;
  leaderboardType?: LeaderboardType;
  userId?: number;
  isQuestionSeries?: boolean;
};

const ProjectLeaderboard: FC<Props> = async ({
  projectId,
  leaderboardType,
  isQuestionSeries,
  userId,
}) => {
  const leaderboardDetails = await ServerLeaderboardApi.getProjectLeaderboard(
    projectId,
    leaderboardType
  );

  if (!leaderboardDetails || !leaderboardDetails.entries.length) {
    return null;
  }

  const t = await getTranslations();

  const leaderboardTitle = isQuestionSeries
    ? t("openLeaderboard")
    : t("leaderboard");

  const detailText = !!leaderboardDetails.prize_pool
    ? t("prizePool") + ": $" + leaderboardDetails.prize_pool.toLocaleString()
    : null;

  const detailElement = (
    <span className="ml-auto font-medium text-gray-800 dark:text-gray-800-dark">
      {detailText}
    </span>
  );
  return (
    <SectionToggle
      title={leaderboardTitle}
      variant={isQuestionSeries ? "primary" : "gold"}
      detailElement={detailElement}
    >
      <ProjectLeaderboardTable
        leaderboardDetails={leaderboardDetails}
        userId={userId}
      />
    </SectionToggle>
  );
};

export default WithServerComponentErrorBoundary(ProjectLeaderboard);
