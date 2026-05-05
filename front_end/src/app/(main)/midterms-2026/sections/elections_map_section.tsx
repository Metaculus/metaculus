import { format } from "date-fns";
import { getTranslations } from "next-intl/server";

import ChamberControlCard from "../components/chamber_control_card";
import ChamberTabs from "../components/chamber_tabs";
import CongressOutcomeCard from "../components/congress_outcome_card";
import ResponsiveMap from "../components/responsive_map";
import {
  fetchChamberData,
  fetchSenateRaces,
} from "../helpers/fetch_dashboard_data";
import { getLatestUpdateTime } from "../helpers/post_utils";

export default async function ElectionsMapSection() {
  const t = await getTranslations();
  const [races, chamber] = await Promise.all([
    fetchSenateRaces(),
    fetchChamberData(),
  ]);

  const latest = getLatestUpdateTime([
    ...races.map((r) => r.post),
    chamber.senateControl,
    chamber.houseControl,
  ]);

  return (
    <section className="pt-6">
      <div className="mb-6 flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-500-dark">
          {t("midtermsHubMapHeading")}
        </span>
        {latest && (
          <span className="text-xs text-gray-500 dark:text-gray-500-dark">
            {t("midtermsHubLastUpdated", {
              date: format(latest, "MMM d, yyyy"),
            })}
          </span>
        )}
      </div>
      <div className="grid grid-cols-1 gap-9 lg:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          <ChamberTabs />
          <ResponsiveMap races={races} />
        </div>
        <div className="space-y-4">
          <ChamberControlCard data={chamber} />
          <CongressOutcomeCard post={chamber.congressOutcomeGroup} />
        </div>
      </div>
    </section>
  );
}
