import { SectionCard } from "@/app/(main)/labor-hub/components/section";

import ChamberControlCard from "../components/chamber_control_card";
import CongressOutcomeCard from "../components/congress_outcome_card";
import ResponsiveMap from "../components/responsive_map";
import {
  fetchChamberData,
  fetchSenateRaces,
} from "../helpers/fetch_dashboard_data";

export default async function ElectionsMapSection() {
  const [{ races }, chamber] = await Promise.all([
    fetchSenateRaces(),
    fetchChamberData(),
  ]);

  return (
    <SectionCard className="overflow-hidden !p-0">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_460px]">
        {/* Map column: edge-to-edge of the SectionCard on lg+. */}
        <div className="self-stretch">
          <ResponsiveMap races={races} />
        </div>
        {/* Sidebar column: provides its own padding so the cards stay inset
            from the white card edges. lg:p-10 keeps the same visual padding
            the SectionCard used to provide. */}
        <div className="space-y-4 p-5 md:p-10">
          <ChamberControlCard data={chamber} />
          <CongressOutcomeCard post={chamber.congressOutcome} />
        </div>
      </div>
    </SectionCard>
  );
}
