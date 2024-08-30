import classNames from "classnames";
import { getTranslations } from "next-intl/server";
import { FC } from "react";

import SectionToggle from "@/components/ui/section_toggle";
import LeaderboardApi from "@/services/leaderboard";
import { LeaderboardType } from "@/types/scoring";

import ProjectLeaderboardTable from "./project_leaderboard_table";
import ServerComponentErrorBoundary from "@/components/server_component_error_boundary";

type Props = {
  projectId: number;
  prizePool: string | null;
  leaderboardType?: LeaderboardType;
  userId?: number;
  isQuestionSeries?: boolean;
};

const ProjectLeaderboard: FC<Props> = async ({
  projectId,
  prizePool,
  leaderboardType,
  isQuestionSeries,
  userId,
}) => {
  return ServerComponentErrorBoundary(async () => {
    const leaderboardDetails = await LeaderboardApi.getProjectLeaderboard(
      projectId,
      leaderboardType
    );

    if (!leaderboardDetails || !leaderboardDetails.entries.length) {
      return null;
    }

    const prizePoolValue = !isNaN(Number(prizePool)) ? Number(prizePool) : 0;

    const t = await getTranslations();

    const leaderboardTitle = isQuestionSeries
      ? t("openLeaderboard")
      : t("leaderboard");

    return (
      <SectionToggle
        title={leaderboardTitle}
        className={classNames({
          "bg-gold-200 dark:bg-gold-200-dark": !isQuestionSeries,
        })}
      >
        <ProjectLeaderboardTable
          leaderboardDetails={leaderboardDetails}
          prizePool={prizePoolValue}
          userId={userId}
        />
      </SectionToggle>
    );
  });
};

export default ProjectLeaderboard;
