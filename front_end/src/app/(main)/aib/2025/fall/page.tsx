import { getAuthCookieManager } from "@/services/auth_tokens";

import AiBenchmarkingTournamentPage from "../../components/page-view-2025-fall";

export const metadata = {
  title: "AI Forecasting Benchmark Tournament | Metaculus",
  description:
    "Join the AI Forecasting Benchmark (AIB) tournament on Metaculus. Test your AI bot's ability to make accurate probabilistic forecasts on real-world questions. $30,000 prize pool per quarter. Register your bot and compete against the best AI forecasters.",
};

export default async function Settings() {
  const authManager = await getAuthCookieManager();
  const token = authManager.getAccessToken();

  return <AiBenchmarkingTournamentPage token={token} />;
}
