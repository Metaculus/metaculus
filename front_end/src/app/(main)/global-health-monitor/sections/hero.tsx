import { getTranslations } from "next-intl/server";

import {
  HubPdf,
  PdfDownloadButton,
} from "@/app/(main)/labor-hub/components/pdf_download_button";

import { EditionSelector } from "../components/edition_selector";
import { EditionStatus } from "../components/edition_status";
import { GhmSnapshot } from "../helpers/snapshot";

export async function HeroSection({
  snapshot,
  latestSlug,
  pdf,
}: {
  snapshot: GhmSnapshot;
  latestSlug: string;
  pdf: HubPdf;
}) {
  const t = await getTranslations();

  return (
    // The section tabs continue this card.
    <section className="flex flex-col gap-4 rounded-t-md bg-gray-0 px-5 pt-5 dark:bg-gray-0-dark sm:px-8 sm:pt-8 md:gap-6 md:px-10 md:pt-10 print:px-0 print:pt-4">
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
        <h1 className="my-0 text-2xl/tight font-bold tracking-tight text-blue-800 dark:text-blue-800-dark sm:text-3xl md:text-4xl lg:text-5xl">
          {t("globalHealthMonitorHeroTitleLine1")}{" "}
          <span className="text-blue-600 dark:text-blue-600-dark">
            {t("globalHealthMonitorHeroTitleLine2")}
          </span>
        </h1>
        <PdfDownloadButton
          pdf={pdf}
          labelled
          className="shrink-0 print:hidden"
        />
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
        <div className="flex shrink-0 flex-col gap-2 sm:items-end">
          <EditionSelector
            editions={snapshot.editions}
            currentSlug={snapshot.edition.slug}
            latestSlug={latestSlug}
          />
          <EditionStatus
            edition={snapshot.edition}
            isLatest={snapshot.isLatest}
          />
        </div>
      </div>
    </section>
  );
}
