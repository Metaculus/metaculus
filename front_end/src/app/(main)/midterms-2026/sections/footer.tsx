import { format } from "date-fns";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import {
  fetchChamberData,
  fetchSenateRaces,
} from "../helpers/fetch_dashboard_data";
import { getLatestUpdateTime } from "../helpers/post_utils";

export default async function FooterSection() {
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
    <footer className="mt-12 border-t border-gray-200 pt-6 text-xs text-gray-600 dark:border-gray-200-dark dark:text-gray-600-dark">
      <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
        <p className="m-0">{t("midtermsHubFooterDisclaimer")}</p>
        <Link
          href="/"
          className="text-blue-600 hover:underline dark:text-blue-600-dark"
        >
          metaculus.com
        </Link>
      </div>
      {latest && (
        <p className="mt-2 text-gray-500 dark:text-gray-500-dark">
          {t("midtermsHubLastUpdatedFull", {
            date: format(latest, "MMMM d, yyyy, HH:mm 'UTC'"),
          })}
        </p>
      )}
    </footer>
  );
}
