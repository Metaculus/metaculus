import { SectionCard } from "@/app/(main)/labor-hub/components/section";

import ChamberControlCard from "../components/chamber_control_card";
import CongressOutcomeCard from "../components/congress_outcome_card";
import ResponsiveMap from "../components/responsive_map";
import {
  fetchChamberData,
  fetchGovernorRaces,
  fetchSenateRaces,
} from "../helpers/fetch_dashboard_data";

export default async function ElectionsMapSection() {
  const [{ races: senateRaces }, { races: governorRaces }, chamber] =
    await Promise.all([
      fetchSenateRaces(),
      fetchGovernorRaces(),
      fetchChamberData(),
    ]);

  return (
    <SectionCard className="overflow-hidden !p-0">
      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(260px,35%)]">
        {/* Map column: edge-to-edge of the SectionCard on md+. */}
        <div className="self-stretch">
          <ResponsiveMap
            senateRaces={senateRaces}
            governorRaces={governorRaces}
          />
        </div>
        {/* Sidebar column: capped at 30% of the container with its own
            internal padding so the cards stay inset from the white card
            edges. */}
        <div className="space-y-4 p-5 lg:p-10">
          <ChamberControlCard data={chamber} />
          <CongressOutcomeCard post={chamber.congressOutcome} />
        </div>
      </div>
    </SectionCard>
  );
}
