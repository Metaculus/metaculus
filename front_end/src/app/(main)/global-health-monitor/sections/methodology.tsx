import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ReactNode } from "react";

import {
  ContentParagraph,
  SectionCard,
  SectionHeader,
} from "@/app/(main)/labor-hub/components/section";
import SectionToggle from "@/components/ui/section_toggle";

import { GHM_TOURNAMENT_PATH } from "../config/season";

function FaqItem({ title, children }: { title: string; children: ReactNode }) {
  return (
    <SectionToggle title={title} variant="light">
      <div className="space-y-3 text-sm text-gray-700 [text-wrap:pretty] dark:text-gray-700-dark md:text-base [&_p]:my-0">
        {children}
      </div>
    </SectionToggle>
  );
}

export async function MethodologySection() {
  const t = await getTranslations();

  return (
    <SectionCard id="methodology" className="flex flex-col gap-4 md:gap-6">
      <SectionHeader>{t("globalHealthMonitorNavMethodology")}</SectionHeader>
      <ContentParagraph>
        {t("globalHealthMonitorMethodologyIntro")}
      </ContentParagraph>
      <div className="flex flex-col gap-2 rounded bg-blue-100 p-1 dark:bg-blue-100-dark">
        <FaqItem title={t("globalHealthMonitorMethodologyForecastsTitle")}>
          <p>{t("globalHealthMonitorMethodologyForecastsBody")}</p>
        </FaqItem>
        <FaqItem title={t("globalHealthMonitorMethodologyEditionsTitle")}>
          <p>{t("globalHealthMonitorMethodologyEditionsBody")}</p>
        </FaqItem>
        <FaqItem title={t("globalHealthMonitorMethodologyDataTitle")}>
          <p>{t("globalHealthMonitorMethodologyDataBody")}</p>
        </FaqItem>
      </div>
      <p className="m-0 border-t border-blue-300 pt-4 text-xs text-blue-700 [text-wrap:pretty] dark:border-blue-300-dark dark:text-blue-700-dark">
        {t("globalHealthMonitorFundingDisclaimer")}{" "}
        {t.rich("globalHealthMonitorTournamentLinkText", {
          link: (chunks) => (
            <Link href={GHM_TOURNAMENT_PATH} className="underline">
              {chunks}
            </Link>
          ),
        })}
      </p>
    </SectionCard>
  );
}
