import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { GHM_ROUTE } from "../config/season";

export async function PastEditionBanner({ date }: { date: string }) {
  const t = await getTranslations();

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-purple-400 bg-purple-100 px-4 py-3 text-sm text-purple-900 dark:border-purple-400-dark dark:bg-purple-100-dark dark:text-purple-900-dark">
      <span>{t("globalHealthMonitorPastEditionBanner", { date })}</span>
      <Link
        href={GHM_ROUTE}
        className="font-medium text-purple-800 underline dark:text-purple-800-dark print:hidden"
      >
        {t("globalHealthMonitorBackToLatest")}
      </Link>
    </div>
  );
}
