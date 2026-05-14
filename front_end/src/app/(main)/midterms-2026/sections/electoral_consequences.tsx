import { getTranslations } from "next-intl/server";

import {
  ContentParagraph,
  SectionCard,
  SectionHeader,
} from "@/app/(main)/labor-hub/components/section";

import ConsequenceRow from "../components/consequence_row";
import { DonkeyIcon, ElephantIcon } from "../components/party_icons";
import { MIDTERMS_COLORS } from "../constants";
import { MOCK_CONSEQUENCES } from "../data";

// Saturated card backgrounds inspired by the reference design — distinct
// from the soft pastel bar fills used elsewhere on the page.
const REP_HEADER_BG = MIDTERMS_COLORS.repBorder; // #C53B33
const DEM_HEADER_BG = "#1E3A8A"; // Tailwind blue-900, deep navy

export default async function ElectoralConsequencesSection() {
  const t = await getTranslations();
  return (
    <SectionCard>
      <SectionHeader className="mb-2">
        {t("midtermsHubElectoralConsequences")}
      </SectionHeader>
      <ContentParagraph className="mb-8">
        {t("midtermsHubConsequencesSubtitle")}
      </ContentParagraph>
      <div className="rounded-md border border-blue-300 bg-blue-100 p-3 dark:border-blue-300-dark dark:bg-blue-100-dark sm:p-5">
        <div className="mb-4 hidden md:grid md:grid-cols-[2fr_1fr_1fr] md:gap-4">
          {/* Empty header above the Question column — the row content
              speaks for itself, matching the reference layout. */}
          <div />
          <PartyHeader
            backgroundColor={REP_HEADER_BG}
            Icon={ElephantIcon}
            title={t("midtermsHubConsequenceHeaderRepTitle")}
            subtitle={t("midtermsHubConsequenceHeaderRepSubtitle")}
          />
          <PartyHeader
            backgroundColor={DEM_HEADER_BG}
            Icon={DonkeyIcon}
            title={t("midtermsHubConsequenceHeaderDemTitle")}
            subtitle={t("midtermsHubConsequenceHeaderDemSubtitle")}
          />
        </div>
        {MOCK_CONSEQUENCES.map((row) => (
          <ConsequenceRow key={row.questionKey} row={row} />
        ))}
      </div>
    </SectionCard>
  );
}

type PartyHeaderProps = {
  backgroundColor: string;
  Icon: typeof ElephantIcon;
  title: string;
  subtitle: string;
};

function PartyHeader({
  backgroundColor,
  Icon,
  title,
  subtitle,
}: PartyHeaderProps) {
  return (
    <div
      className="flex flex-col items-center gap-2 rounded-md px-4 py-5 text-white"
      style={{ backgroundColor }}
    >
      <Icon width={36} height={36} className="shrink-0" aria-hidden="true" />
      <div className="text-center leading-tight">
        <div className="text-base font-bold">{title}</div>
        <div className="mt-0.5 text-[11px] uppercase tracking-wider opacity-90">
          {subtitle}
        </div>
      </div>
    </div>
  );
}
