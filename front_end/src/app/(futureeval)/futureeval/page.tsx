import ServerLeaderboardApi from "@/services/api/leaderboard/leaderboard.server";
import { LeaderboardDetails } from "@/types/scoring";

import FutureEvalScreen from "./components/futureeval-screen";

export const metadata = {
  title: "FutureEval | Metaculus",
  description:
    "Metaculus FutureEval measures AI's ability to predict future outcomes. Compare AI models against human pro forecasters on real-world forecasting questions.",
};

export default async function FutureEvalPage() {
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

  // Provide fallback for error cases - components handle empty entries gracefully
  const safeLeaderboard =
    leaderboard ?? ({ entries: [] } as LeaderboardDetails);

  return <FutureEvalScreen leaderboard={safeLeaderboard} current="benchmark" />;
}
