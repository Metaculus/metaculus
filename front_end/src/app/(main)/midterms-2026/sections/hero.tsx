import { getTranslations } from "next-intl/server";

import LiveBadge from "../components/live_badge";

export default async function HeroSection() {
  const t = await getTranslations();

  return (
    <section className="flex flex-col gap-4 px-5 pt-6 sm:px-8 sm:pt-10 md:gap-6 md:px-10 md:pt-12">
      <h1 className="my-0 text-2xl/tight font-bold tracking-tight text-blue-800 dark:text-blue-800-dark sm:text-3xl md:text-4xl lg:text-5xl">
        {t("midtermsHubHeroTitleLine1")}{" "}
        <span className="text-blue-600 dark:text-blue-600-dark">
          {t("midtermsHubHeroTitleLine2")}
        </span>
      </h1>
      <div className="mb-4 flex flex-col-reverse items-start justify-between gap-3 sm:flex-row sm:items-end sm:gap-6">
        <p className="my-0 max-w-xl text-sm text-blue-700 [text-wrap:pretty] dark:text-blue-700-dark sm:text-base md:text-lg">
          {t("midtermsHubHeroSubtitle")}
        </p>
        <div className="shrink-0">
          <LiveBadge />
        </div>
      </div>
    </section>
  );
}
