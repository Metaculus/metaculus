import { FC } from "react";

import ContributionsTable from "@/app/(main)/(leaderboards)/contributions/components/contributions_table";
import WithServerComponentErrorBoundary from "@/components/server_component_error_boundary";
import LeaderboardApi from "@/services/leaderboard";
import { CategoryKey, LeaderboardType } from "@/types/scoring";

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
  const contributionsDetails = await LeaderboardApi.getContributions({
    type: "global",
    score_type: leaderboardType,
    for_user: userId,
    start_time: startTime,
    end_time: endTime,
    primary: false,
  });
  return (
    <div className="w-full overflow-y-scroll border border-gray-300 dark:border-gray-300-dark sm:overflow-y-hidden sm:border-none">
      <ContributionsTable
        category={category}
        leaderboardType={leaderboardType}
        leaderboardEntry={contributionsDetails.leaderboard_entry}
        contributions={contributionsDetails.contributions}
      />
    </div>
  );
};

export default WithServerComponentErrorBoundary(GlobalContributions);
