import { getLocale, getTranslations } from "next-intl/server";

import LiveBadge from "@/app/(main)/midterms-2026/components/live_badge";
import cn from "@/utils/core/cn";

import { ModeSwitcher } from "../components/mode_switcher";
import { formatEditionDate } from "../helpers/format";
import { GhmMode } from "../helpers/mode";

export async function HeroSection({
  latestSlug,
  mode,
}: {
  latestSlug: string;
  mode: GhmMode;
}) {
  const t = await getTranslations();
  const locale = await getLocale();

  return (
    <section
      className={cn(
        "flex flex-col gap-4 bg-gray-0 px-5 pt-5 dark:bg-gray-0-dark sm:px-8 sm:pt-8 md:gap-6 md:px-10 md:pt-10 print:px-0 print:pt-4",
        // In full mode the section tabs continue this card; simple mode has none.
        mode === "simple" ? "rounded-md pb-5 sm:pb-8 md:pb-10" : "rounded-t-md"
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
        <h1 className="my-0 text-2xl/tight font-bold tracking-tight text-blue-800 dark:text-blue-800-dark sm:text-3xl md:text-4xl lg:text-5xl">
          {t("globalHealthMonitorHeroTitleLine1")}{" "}
          <span className="text-blue-600 dark:text-blue-600-dark">
            {t("globalHealthMonitorHeroTitleLine2")}
          </span>
        </h1>
        <ModeSwitcher mode={mode} />
      </div>
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end sm:gap-6">
        <p className="my-0 max-w-2xl text-base text-blue-700 [text-wrap:pretty] dark:text-blue-700-dark md:text-lg">
          <span className="md:hidden">
            {t("globalHealthMonitorHeroSubtitleMobile")}
          </span>
          <span className="hidden md:inline">
            {t("globalHealthMonitorHeroSubtitle")}
          </span>
        </p>
        <div className="flex shrink-0 flex-col gap-1 text-sm text-blue-700 dark:text-blue-700-dark sm:items-end">
          <LiveBadge label={t("globalHealthMonitorLiveBadge")} />
          <span>
            {t("globalHealthMonitorLatestEdition", {
              date: formatEditionDate(latestSlug, locale),
            })}
          </span>
        </div>
      </div>
    </section>
  );
}
