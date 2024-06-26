import { FC } from "react";

import LeaderboardApi from "@/services/leaderboard";
import { LeaderboardDetails, LeaderboardType } from "@/types/scoring";

const LeaderboardTable = (leaderboardDetails: LeaderboardDetails) => (
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
      <LeaderboardTable {...leaderboardDetails} />
    </div>
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
  const leaderbaordDetails: LeaderboardDetails =
    await LeaderboardApi.getLeaderboard(projectId, leaderboardType);
  // TODO: add pagination, but for now just return 20 entries
  return <div>{leaderboard(leaderbaordDetails)}</div>;
};

export default AwaitedLeaderboard;
