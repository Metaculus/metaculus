import ServerLeaderboardApi from "@/services/api/leaderboard/leaderboard.server";

import FutureEvalScreen from "../components/futureeval-screen";

export const metadata = {
  title: "FutureEval News | Metaculus",
  description:
    "Join the AI Forecasting Benchmark (AIB) tournament on Metaculus. Test your AI bot's ability to make accurate probabilistic forecasts on real-world questions. $30,000 prize pool per quarter. Register your bot and compete against the best AI forecasters.",
};

export default async function FutureEvalNewsPage() {
  const leaderboard = await ServerLeaderboardApi.getGlobalLeaderboard(
    null,
    null,
    "manual",
    "Global Bot Leaderboard"
  );
  return <FutureEvalScreen leaderboard={leaderboard} current="news" />;
}
