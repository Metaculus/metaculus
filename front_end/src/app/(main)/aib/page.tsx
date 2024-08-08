import { getServerSession } from "@/services/session";

import AiBenchmarkingTournamentPage from "./components/page-view";

export default async function Settings() {
  const token = getServerSession();

  return <AiBenchmarkingTournamentPage token={token} />;
}
