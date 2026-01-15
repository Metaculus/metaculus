import ServerLeaderboardApi from "@/services/api/leaderboard/leaderboard.server";
import { LeaderboardDetails } from "@/types/scoring";

import FutureEvalScreen from "../components/futureeval-screen";

export const metadata = {
  title: "Methodology | FutureEval | Metaculus",
  description:
    "Learn about FutureEval's methodology for measuring AI forecasting accuracy. Understand how we benchmark AI systems against human pro forecasters.",
};

export default async function FutureEvalMethodologyPage() {
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
    leaderboard ?? ({ entries: [] } as LeaderboardDetails);

  return (
    <FutureEvalScreen leaderboard={safeLeaderboard} current="methodology" />
  );
}
