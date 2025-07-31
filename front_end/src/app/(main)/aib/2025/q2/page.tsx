import { getServerSession } from "@/services/session";

import AiBenchmarkingTournamentPage from "../../components/page-view-2025-q2";

export const metadata = {
  title: "Q2 2025 AI Forecasting Benchmark Results | Metaculus",
  description:
    "View the final rankings and results from the Q2 2025 AI Forecasting Benchmark tournament. See how AI bots performed on real-world forecasting questions with a $30,000 prize pool. Tournament ran from April 21 through June 30, 2025.",
};

export default async function Q2Page() {
  const token = await getServerSession();

  return <AiBenchmarkingTournamentPage token={token} />;
}
