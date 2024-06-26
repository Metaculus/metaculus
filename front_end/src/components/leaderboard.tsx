import { re } from "mathjs";
import { FC } from "react";

import LeaderboardApi from "@/services/leaderboard";
import { LeaderboardEntry, LeaderboardType } from "@/types/scoring";

const leaderboard = (entries: LeaderboardEntry[]) => {
  return (
    <table>
      <thead>
        <tr>
          <th style={{ textAlign: "center" }}>Rank</th>
          <th style={{ textAlign: "center" }}>Username</th>
          <th style={{ textAlign: "center" }}>Score</th>
          <th style={{ textAlign: "center" }}>Contributions</th>
        </tr>
      </thead>
      <tbody>
        {entries.map((entry, index) => (
          <tr key={entry.user_id}>
            <td style={{ textAlign: "center" }}>{index + 1}</td>
            <td style={{ textAlign: "center" }}>{entry.username}</td>
            <td style={{ textAlign: "center" }}>{entry.score.toFixed(3)}</td>
            <td style={{ textAlign: "center" }}>{entry.contribution_count}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

type Props = {
  projectId: number;
  leaderboardType?: LeaderboardType;
};

const AwaitedLeaderboard: FC<Props> = async ({
  projectId,
  leaderboardType,
}) => {
  const results: LeaderboardEntry[] = await LeaderboardApi.getLeaderboard(
    projectId,
    leaderboardType
  );
  // TODO: add pagination, but for now just return 20 entries
  return <div>{leaderboard(results.slice(0, 20))}</div>;
};

export default AwaitedLeaderboard;
