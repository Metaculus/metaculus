import { FC } from "react";

import LeaderboardTable from "@/app/(main)/leaderboard/components/leaderboard_table";
import LeaderboardApi from "@/services/leaderboard";
import ProfileApi from "@/services/profile";
import { CategoryKey, LeaderboardType } from "@/types/scoring";

type Props = {
  startTime: string;
  endTime: string;
  leaderboardType: LeaderboardType;
  userId?: number;
  year: string;
  duration: string;
  category: CategoryKey;
  cardSized?: boolean;
};

const AwaitedGlobalLeaderboard: FC<Props> = async ({
  startTime,
  endTime,
  leaderboardType,
  userId,
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
      userId={userId}
    />
  );
};

export default AwaitedGlobalLeaderboard;
