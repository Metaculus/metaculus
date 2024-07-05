import { FC } from "react";

import LeaderboardApi from "@/services/leaderboard";
import { LeaderboardDetails, LeaderboardType } from "@/types/scoring";

const GlobalLeaderboardTable = (leaderboardDetails: LeaderboardDetails) => (
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
      {leaderboardDetails.entries.slice(0, 20).map((entry, index) => (
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

const leaderboard = (leaderboardDetails: LeaderboardDetails) => {
  return (
    <div>
      <h3>{leaderboardDetails.name}</h3>
      <GlobalLeaderboardTable {...leaderboardDetails} />
    </div>
  );
};

type Props = {
  leaderboardName?: string;
};

const AwaitedGlobalLeaderboard: FC<Props> = async ({ leaderboardName }) => {
  const leaderboardDetails: LeaderboardDetails =
    await LeaderboardApi.getGlobalLeaderboard(leaderboardName);
  // TODO: add pagination, but for now just return 20 entries
  return <div>{leaderboard(leaderboardDetails)}</div>;
};

export default AwaitedGlobalLeaderboard;
