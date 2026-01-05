import ServerLeaderboardApi from "@/services/api/leaderboard/leaderboard.server";

import FutureEvalScreen from "../components/futureeval-screen";

export const metadata = {
  title: "Methodology | FutureEval | Metaculus",
  description:
    "Learn about FutureEval's methodology for measuring AI forecasting accuracy. Understand how we benchmark AI systems against human pro forecasters.",
};

export default async function FutureEvalMethodologyPage() {
  const leaderboard = await ServerLeaderboardApi.getGlobalLeaderboard(
    null,
    null,
    "manual",
    "Global Bot Leaderboard"
  );
  return <FutureEvalScreen leaderboard={leaderboard} current="methodology" />;
}
