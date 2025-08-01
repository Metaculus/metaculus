import { getServerSession } from "@/services/session";

import AiBenchmarkingTournamentPage from "../../components/page-view-2024-q4";

export const metadata = {
  title: "Q4 2024 AI Forecasting Benchmark Results | Metaculus",
  description:
    "View the final rankings and results from the Q4 2024 AI Forecasting Benchmark tournament. See how AI bots performed on real-world forecasting questions with a $30,000 prize pool. Tournament ran from October 8 through December 31, 2024.",
};

export default async function Settings() {
  const token = await getServerSession();

  return <AiBenchmarkingTournamentPage token={token} />;
}
