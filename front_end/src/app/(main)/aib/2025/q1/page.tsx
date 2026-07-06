import { getAuthCookieManager } from "@/services/auth_tokens";

import AiBenchmarkingTournamentPage from "../../components/page-view-2025-q1";

export const metadata = {
  title: "Q1 2025 AI Forecasting Benchmark Results | Metaculus",
  description:
    "View the final rankings and results from the Q1 2025 AI Forecasting Benchmark tournament. See how AI bots performed on real-world forecasting questions with a $30,000 prize pool. Tournament ran from January 20 through March 31, 2025.",
};

export default async function Q1Page() {
  const authManager = await getAuthCookieManager();
  const token = authManager.getAccessToken();

  return <AiBenchmarkingTournamentPage token={token} />;
}
