import { getServerSession } from "@/services/session";

import AiBenchmarkingTournamentPage from "../../components/page-view";

export const metadata = {
  title: "AI Forecasting Benchmark Tournament | Metaculus",
  description:
    "Join the AI Forecasting Benchmark (AIB) tournament on Metaculus. Test your AI bot's ability to make accurate probabilistic forecasts on real-world questions. $50,000 prize pool per quarter. Register your bot and compete against the best AI forecasters.",
};

export default async function Settings() {
  const token = await getServerSession();

  return <AiBenchmarkingTournamentPage token={token} />;
}
