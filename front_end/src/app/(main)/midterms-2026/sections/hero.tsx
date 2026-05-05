import { getTranslations } from "next-intl/server";

import UpdatedBadge from "../components/updated_badge";
import {
  fetchChamberData,
  fetchSenateRaces,
} from "../helpers/fetch_dashboard_data";
import { getLatestUpdateTime } from "../helpers/post_utils";

export default async function HeroSection() {
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
    <header className="border-b border-gray-200 pb-6 dark:border-gray-200-dark">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="m-0 text-2xl font-bold tracking-tight text-blue-900 dark:text-blue-900-dark md:text-3xl">
          <span className="text-blue-600 dark:text-blue-600-dark">
            metaculus
          </span>
          <span className="mx-2 text-gray-400 dark:text-gray-400-dark">|</span>
          {t("midtermsHubPageTitle")}
        </h1>
        <UpdatedBadge timestamp={latest ? latest.toISOString() : null} />
      </div>
    </header>
  );
}
