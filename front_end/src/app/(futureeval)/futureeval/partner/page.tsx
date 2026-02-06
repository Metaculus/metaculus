import ServerLeaderboardApi from "@/services/api/leaderboard/leaderboard.server";
import { LeaderboardDetails } from "@/types/scoring";

import FutureEvalScreen from "../components/futureeval-screen";

export const metadata = {
  title: "Partner | FutureEval | Metaculus",
  description:
    "Partner with Metaculus FutureEval for custom model evaluations, bot tournaments, and research collaboration on AI forecasting.",
};

export default async function FutureEvalPartnerPage() {
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

  return (
    <FutureEvalScreen leaderboard={safeLeaderboard} current="partner" />
  );
}
