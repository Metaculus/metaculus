import { getServerSession } from "@/services/session";

import AiBenchmarkingTournamentPage from "../../components/page-view-2025-q1";

export default async function Q1Page() {
  const token = await getServerSession();

  return <AiBenchmarkingTournamentPage token={token} />;
}
