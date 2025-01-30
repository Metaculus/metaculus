import { getServerSession } from "@/services/session";

import AiBenchmarkingTournamentPage from "../../components/page-view-2024-q4";

export default async function Settings() {
  const token = getServerSession();

  return <AiBenchmarkingTournamentPage token={token} />;
}
