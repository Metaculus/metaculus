import { getServerSession } from "@/services/session";

import AiBenchmarkingTournamentPage from "../components/page-view-q3";

export default async function Settings() {
  const token = getServerSession();

  return <AiBenchmarkingTournamentPage token={token} />;
}
