import ServerLeaderboardApi from "@/services/api/leaderboard/leaderboard.server";

import AIBScreen from "../aib/components/aib/aib-screen";

export const metadata = {
  title: "AI Forecasting Benchmark Tournament | Metaculus",
  description:
    "Join the AI Forecasting Benchmark (AIB) tournament on Metaculus. Test your AI bot's ability to make accurate probabilistic forecasts on real-world questions. $30,000 prize pool per quarter. Register your bot and compete against the best AI forecasters.",
};

export default async function FutureEvalPage() {
  const leaderboard = await ServerLeaderboardApi.getGlobalLeaderboard(
    null,
    null,
    "manual",
    "Global Bot Leaderboard"
  );
  return <AIBScreen leaderboard={leaderboard} />;
}
