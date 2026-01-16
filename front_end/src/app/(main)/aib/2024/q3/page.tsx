import { getAuthCookieManager } from "@/services/auth_tokens";

import AiBenchmarkingTournamentPage from "../../components/page-view-2024-q3";

export const metadata = {
  title: "Q3 2024 AI Forecasting Benchmark Results | Metaculus",
  description:
    "View the final rankings and results from the Q3 2024 AI Forecasting Benchmark tournament. See how AI bots performed on real-world forecasting questions with a $30,000 prize pool. Tournament ran from July 8 through September 30, 2024.",
};

export default async function Settings() {
  const authManager = await getAuthCookieManager();
  const token = authManager.getAccessToken();

  return <AiBenchmarkingTournamentPage token={token} />;
}
