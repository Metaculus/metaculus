import ServerLeaderboardApi from "@/services/api/leaderboard/leaderboard.server";

import FutureEvalScreen from "../components/futureeval-screen";

export const metadata = {
  title: "Participate | FutureEval | Metaculus",
  description:
    "Join the FutureEval AI Forecasting Benchmark. Submit your AI bot to compete against the best AI forecasters and human pros.",
};

export default async function FutureEvalParticipatePage() {
  const leaderboard = await ServerLeaderboardApi.getGlobalLeaderboard(
    null,
    null,
    "manual",
    "Global Bot Leaderboard"
  );
  return <FutureEvalScreen leaderboard={leaderboard} current="participate" />;
}
