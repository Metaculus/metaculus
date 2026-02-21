import { getTranslations } from "next-intl/server";
import { FC } from "react";

import WithServerComponentErrorBoundary from "@/components/server_component_error_boundary";
import ServerLeaderboardApi from "@/services/api/leaderboard/leaderboard.server";
import { LeaderboardDetails, LeaderboardType } from "@/types/scoring";

import ProjectLeaderboardClient from "./project_leaderboard_client";

type Props = {
  projectId: number;
  leaderboardType?: LeaderboardType;
  userId?: number;
  isQuestionSeries?: boolean;
};

function sortLeaderboards(
  leaderboards: LeaderboardDetails[]
): LeaderboardDetails[] {
  return [...leaderboards].sort((a, b) => {
    const orderA = a.display_config?.display_order ?? 0;
    const orderB = b.display_config?.display_order ?? 0;
    return orderA - orderB;
  });
}

const ProjectLeaderboard: FC<Props> = async ({
  projectId,
  leaderboardType,
  isQuestionSeries,
  userId,
}) => {
  const params = leaderboardType
    ? new URLSearchParams({ score_type: leaderboardType })
    : null;
  const leaderboards = await ServerLeaderboardApi.getProjectLeaderboard(
    projectId,
    params
  );

  if (!leaderboards || leaderboards.length === 0) {
    return null;
  }

  const leaderboardsWithEntries = leaderboards.filter(
    (lb) => lb.entries.length > 0
  );
  if (leaderboardsWithEntries.length === 0) {
    return null;
  }

  const sortedLeaderboards = sortLeaderboards(leaderboardsWithEntries);

  const t = await getTranslations();

  const leaderboardTitle = isQuestionSeries
    ? t("openLeaderboard")
    : t("leaderboard");

  return (
    <ProjectLeaderboardClient
      leaderboards={sortedLeaderboards}
      leaderboardTitle={leaderboardTitle}
      isQuestionSeries={isQuestionSeries}
      userId={userId}
    />
  );
};

export default WithServerComponentErrorBoundary(ProjectLeaderboard);
