import { FC } from "react";

import ContributionsTable from "@/app/(main)/(leaderboards)/contributions/components/contributions_table";
import LeaderboardApi from "@/services/leaderboard";
import { CategoryKey, LeaderboardType } from "@/types/scoring";
import ServerComponentErrorBoundary from "@/components/server_component_error_boundary";

type Props = {
  startTime: string;
  endTime: string;
  leaderboardType: LeaderboardType;
  userId: number;
  category: CategoryKey;
};

const GlobalContributions: FC<Props> = async ({
  userId,
  endTime,
  leaderboardType,
  startTime,
  category,
}) => {
  return ServerComponentErrorBoundary(async () => {
    const contributionsDetails = await LeaderboardApi.getContributions({
      type: "global",
      leaderboardType,
      userId,
      startTime,
      endTime,
    });

    return (
      <ContributionsTable
        category={category}
        leaderboardEntry={contributionsDetails.leaderboard_entry}
        contributions={contributionsDetails.contributions}
      />
    );
  });
};

export default GlobalContributions;
