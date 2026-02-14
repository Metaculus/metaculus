import ServerLeaderboardApi from "@/services/api/leaderboard/leaderboard.server";
import { LeaderboardDetails } from "@/types/scoring";

import FutureEvalScreen from "../components/futureeval-screen";

export const metadata = {
  title: "FutureEval News | Metaculus",
  description:
    "Stay updated with the latest news from Metaculus FutureEval, the benchmark measuring AI's ability to predict future outcomes.",
};

export default async function FutureEvalNewsPage() {
  let leaderboard: LeaderboardDetails | null = null;

  try {
    leaderboard = await ServerLeaderboardApi.getGlobalLeaderboard(
      null,
      null,
      "manual",
      "Global Bot Leaderboard"
    );
  } catch (error) {
    console.error("Failed to fetch leaderboard data:", error);
  }

  const safeLeaderboard =
    leaderboard ?? ({ entries: [] } as unknown as LeaderboardDetails);

  return <FutureEvalScreen leaderboard={safeLeaderboard} current="news" />;
}
