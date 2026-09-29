import { getLocale, getTranslations } from "next-intl/server";

import LiveBadge from "@/app/(main)/midterms-2026/components/live_badge";
import Button from "@/components/ui/button";

import { GHM_TOURNAMENT_PATH } from "../config/season";
import { formatEditionDate } from "../helpers/format";

export async function HeroSection({
  latestSlug,
  nextEditionOn,
}: {
  latestSlug: string;
  nextEditionOn: string;
}) {
  const t = await getTranslations();
  const locale = await getLocale();

  return (
    <section className="flex flex-col gap-1 px-5 pt-6 sm:px-8 sm:pt-10 md:gap-6 md:px-10 md:pt-12 print:px-0 print:pt-4">
      <h1 className="my-0 text-2xl/tight font-bold tracking-tight text-blue-800 dark:text-blue-800-dark sm:text-3xl md:text-4xl lg:text-5xl">
        {t("globalHealthMonitorHeroTitleLine1")}{" "}
        <span className="text-blue-600 dark:text-blue-600-dark">
          {t("globalHealthMonitorHeroTitleLine2")}
        </span>
      </h1>
      <div className="mb-4 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end sm:gap-6 md:mb-8">
        <div className="flex max-w-2xl flex-col gap-4">
          <p className="my-0 text-base text-blue-700 [text-wrap:pretty] dark:text-blue-700-dark md:text-lg">
            <span className="md:hidden">
              {t("globalHealthMonitorHeroSubtitleMobile")}
            </span>
            <span className="hidden md:inline">
              {t("globalHealthMonitorHeroSubtitle")}
            </span>
          </p>
          <div className="print:hidden">
            <Button href={GHM_TOURNAMENT_PATH} variant="primary" size="md">
              {t("globalHealthMonitorTournamentCta")}
            </Button>
          </div>
        </div>
        <div className="flex shrink-0 flex-col gap-1 text-sm text-blue-700 dark:text-blue-700-dark sm:items-end">
          <LiveBadge label={t("globalHealthMonitorLiveBadge")} />
          <span>
            {t("globalHealthMonitorLatestEdition", {
              date: formatEditionDate(latestSlug, locale),
            })}
          </span>
          <span className="text-blue-600 dark:text-blue-600-dark">
            {t("globalHealthMonitorNextEdition", {
              date: formatEditionDate(nextEditionOn, locale),
            })}
          </span>
        </div>
      </div>
    </section>
  );
}
