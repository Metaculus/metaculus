import ServerLeaderboardApi from "@/services/api/leaderboard/leaderboard.server";
import { LeaderboardDetails } from "@/types/scoring";

import FutureEvalScreen from "../components/futureeval-screen";

export const metadata = {
  title: "Participate | FutureEval | Metaculus",
  description:
    "Join the FutureEval AI Forecasting Benchmark. Submit your AI bot to compete against the best AI forecasters and human pros.",
};

export default async function FutureEvalParticipatePage() {
  let leaderboard: LeaderboardDetails = { entries: [] };

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

  return <FutureEvalScreen leaderboard={leaderboard} current="participate" />;
}
