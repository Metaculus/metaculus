import { SectionCard } from "@/app/(main)/labor-hub/components/section";

import BalanceOfPowerTimelines from "../components/balance_of_power_timelines";
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

  // The card carries no overflow clip: that only ever existed to contain the
  // geographic map's paths, and on the card it also cut off the balance-of-power
  // panel's range toggle, which is meant to straddle the top edge. The clip now
  // sits on the map column alone.
  return (
    <SectionCard className="!p-0">
      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(300px,35%)]">
        {/* Map column. Padding matches the panel's, so the map is inset the same
            40px from the dividing rule as the panel's content is — and the tabs,
            summary and legend overlay inherit it instead of setting their own. */}
        <div className="self-stretch overflow-hidden p-5 lg:p-8">
          <ResponsiveMap
            senateRaces={senateRaces}
            governorRaces={governorRaces}
          />
        </div>
        {/* Balance-of-power column. One rule divides it from the map and runs the
            full height — grid items stretch, so it meets both card edges. Below
            md the layout is a single column, so the same rule becomes the
            horizontal separator above the panel instead. */}
        <div className="border-t border-blue-200 p-5 dark:border-blue-200-dark md:border-l md:border-t-0 lg:p-8">
          <BalanceOfPowerTimelines post={chamber.congressOutcome} />
        </div>
      </div>
    </SectionCard>
  );
}
