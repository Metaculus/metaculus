import { getServerSession } from "@/services/session";

import AiBenchmarkingTournamentPage from "../../components/page-view-2024-q3";

export default async function Settings() {
  const token = await getServerSession();

  return <AiBenchmarkingTournamentPage token={token} />;
}
