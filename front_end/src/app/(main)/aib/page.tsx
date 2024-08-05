import { getServerSession } from "@/services/session";

import AiBenchmarkingTournamentPage from "./page-view";

export default async function Settings() {
  const token = getServerSession();

  return <AiBenchmarkingTournamentPage token={token} />;
}
