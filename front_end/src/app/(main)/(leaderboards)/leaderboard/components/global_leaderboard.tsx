import { FC } from "react";

import LeaderboardApi from "@/services/leaderboard";
import { CategoryKey, LeaderboardType } from "@/types/scoring";

import LeaderboardTable from "./leaderboard_table";

type Props = {
  startTime: string;
  endTime: string;
  leaderboardType: LeaderboardType;
  year: string;
  duration: string;
  category: CategoryKey;
  cardSized?: boolean;
};

const GlobalLeaderboard: FC<Props> = async ({
  startTime,
  endTime,
  leaderboardType,
  year,
  duration,
  category,
  cardSized,
}) => {
  const leaderboardDetails = await LeaderboardApi.getGlobalLeaderboard(
    startTime,
    endTime,
    leaderboardType
  );

  return (
    <LeaderboardTable
      duration={duration}
      year={year}
      category={category}
      leaderboardDetails={leaderboardDetails}
      cardSized={cardSized}
    />
  );
};

export default GlobalLeaderboard;
