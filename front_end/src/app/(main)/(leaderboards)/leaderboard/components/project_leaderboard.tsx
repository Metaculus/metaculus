import { getTranslations } from "next-intl/server";
import { FC } from "react";

import WithServerComponentErrorBoundary from "@/components/server_component_error_boundary";
import ServerLeaderboardApi from "@/services/api/leaderboard/leaderboard.server";
import { LeaderboardType } from "@/types/scoring";

import ProjectLeaderboardClient from "./project_leaderboard_client";

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
  const leaderboardDetails = (
    await ServerLeaderboardApi.getProjectLeaderboard(
      projectId,
      leaderboardType
        ? new URLSearchParams({ score_type: leaderboardType })
        : null
    )
  )?.[0]; // This grabs only the first serialized leaderboard, requires work!

  if (!leaderboardDetails || !leaderboardDetails.entries.length) {
    return null;
  }

  const t = await getTranslations();

  const leaderboardTitle = isQuestionSeries
    ? t("openLeaderboard")
    : t("leaderboard");

  return (
    <ProjectLeaderboardClient
      leaderboardDetails={leaderboardDetails}
      leaderboardTitle={leaderboardTitle}
      isQuestionSeries={isQuestionSeries}
      userId={userId}
    />
  );
};

export default WithServerComponentErrorBoundary(ProjectLeaderboard);
